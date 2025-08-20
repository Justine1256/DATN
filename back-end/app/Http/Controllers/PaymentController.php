<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\VnpayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    // Nếu muốn endpoint riêng để tạo link
    public function createVnpayPayment(Request $request)
    {
        $request->validate([
            'amount'     => 'required|numeric|min:1000',
            'order_ids'  => 'required|array|min:1',
            'order_ids.*'=> 'integer',
        ]);

        $url = VnpayService::createPaymentUrl([
            'user_id'   => Auth::user()->id,
            'order_ids' => $request->order_ids,
            'amount'    => (int)$request->amount,
            'return_url'=> route('vnpay.return'),
        ]);

        return response()->json(['payment_url' => $url]);
    }

    // User quay về từ VNPAY (front-channel)
    public function vnpayReturn(Request $request)
    {
        $params = $request->all();

        // 1) Kiểm hash
        if (!VnpayService::verifyHash($params)) {
            return $this->redirectToFrontend([
                'status' => 'failed',
                'reason' => 'invalid_hash',
            ]);
        }

        $txnRef = $params['vnp_TxnRef'] ?? null;
        $resp   = $params['vnp_ResponseCode'] ?? null;

        // 2) Lấy mapping txnRef -> orders từ Cache
        $map = $txnRef ? Cache::get("vnp:{$txnRef}") : null;

        if (!$map) {
            return $this->redirectToFrontend([
                'status' => 'failed',
                'reason' => 'mapping_not_found',
            ]);
        }

        // 3) Nếu thành công (00) → cập nhật đơn
        if ($resp === '00') {
            try {
                DB::transaction(function () use ($map, $params) {
                    $orderIds = $map['order_ids'] ?? [];
                    $payCode  = $params['vnp_TransactionNo'] ?? null;

                    Order::whereIn('id', $orderIds)->update([
                        'payment_status' => 'Completed',
                        'transaction_id' => $payCode,
                        'order_status'   => 'order confirmation', // tuỳ flow
                    ]);
                });
            } catch (\Throwable $e) {
                Log::error('VNPAY Return update error: '.$e->getMessage());
                return $this->redirectToFrontend([
                    'status' => 'failed',
                    'reason' => 'db_error',
                ]);
            }

            // Xoá cache sau khi xử lý
            Cache::forget("vnp:{$txnRef}");

            return $this->redirectToFrontend([
                'status'     => 'success',
                'order_ids'  => implode(',', $map['order_ids'] ?? []),
                'amount'     => (int)($map['amount'] ?? 0),
                'code'       => $params['vnp_TransactionNo'] ?? '',
            ]);
        }

        // Thất bại
        return $this->redirectToFrontend([
            'status' => 'failed',
            'reason' => $resp,
        ]);
    }

    // IPN từ VNPAY (server-to-server) để đối soát
    public function vnpayIpn(Request $request)
    {
        $params = $request->all();

        // 1) Kiểm hash
        if (!VnpayService::verifyHash($params)) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid Checksum']); // theo tài liệu VNPAY
        }

        $txnRef = $params['vnp_TxnRef'] ?? null;
        $resp   = $params['vnp_ResponseCode'] ?? null;

        $map = $txnRef ? Cache::get("vnp:{$txnRef}") : null;
        if (!$map) {
            // Có thể bạn đã xử lý ở return trước rồi → coi như OK idempotent
            return response()->json(['RspCode' => '00', 'Message' => 'OK']);
        }

        if ($resp === '00') {
            try {
                DB::transaction(function () use ($map, $params, $txnRef) {
                    $orderIds = $map['order_ids'] ?? [];
                    $payCode  = $params['vnp_TransactionNo'] ?? null;

                    Order::whereIn('id', $orderIds)->update([
                        'payment_status' => 'Completed',
                        'transaction_id' => $payCode,
                        'order_status'   => 'order confirmation',
                    ]);
                });

                Cache::forget("vnp:{$txnRef}");

                return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
            } catch (\Throwable $e) {
                Log::error('VNPAY IPN update error: '.$e->getMessage());
                return response()->json(['RspCode' => '99', 'Message' => 'DB Error']);
            }
        }

        // Thanh toán thất bại
        return response()->json(['RspCode' => '00', 'Message' => 'Payment Failed']);
    }

    private function redirectToFrontend(array $query)
    {
        // Nếu bạn muốn trả về thẳng FE:
        $url = config('services.vnpay.return_url') ?? env('FRONTEND_RESULT_URL') ?? env('VNP_RETURNURL');
        // gắn query ngắn gọn để FE hiển thị
        $qs  = http_build_query($query);
        return redirect()->away($url . (str_contains($url, '?') ? '&' : '?') . $qs);
    }
}
