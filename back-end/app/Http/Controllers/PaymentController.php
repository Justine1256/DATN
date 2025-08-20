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
    public function createVnpayPayment(Request $request)
    {
        $request->validate([
            'amount'      => 'required|numeric|min:1000',
            'order_ids'   => 'required|array|min:1',
            'order_ids.*' => 'integer',
            'return_url'  => 'nullable|string', // Accept return_url from frontend
        ]);

        $returnUrl = $request->return_url ?? route('vnpay.return', [], true);

        $url = VnpayService::createPaymentUrl([
            'user_id'   => Auth::id(),
            'order_ids' => $request->order_ids,
            'amount'    => (int)$request->amount,
            'return_url'=> $returnUrl, // Use the determined return URL
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'order_info' => $request->order_info ?? 'Thanh toan don hang',
        ]);

        return response()->json(['payment_url' => $url]);
    }

    // User quay về từ VNPAY
    public function vnpayReturn(Request $request)
    {
        Log::info('[VNP] return raw', ['qs' => $request->getQueryString()]);

        $params = $request->all();

        if (!VnpayService::verifyHash($params)) {
            Log::warning('[VNP] return invalid hash');
            return $this->redirectToFrontend([
                'status' => 'failed',
                'reason' => 'invalid_hash',
                'vnp_ResponseCode' => $params['vnp_ResponseCode'] ?? '',
                'vnp_TxnRef' => $params['vnp_TxnRef'] ?? '',
            ]);
        }

        $txnRef = $params['vnp_TxnRef'] ?? null;
        $resp   = $params['vnp_ResponseCode'] ?? null;
        $map    = $txnRef ? Cache::get("vnp:{$txnRef}") : null;

        if (!$map) {
            Log::warning('[VNP] return mapping_not_found', ['ref' => $txnRef]);
            return $this->redirectToFrontend([
                'status' => 'failed',
                'reason' => 'mapping_not_found',
                'vnp_ResponseCode' => $resp,
                'vnp_TxnRef' => $txnRef,
            ]);
        }

        Log::info('[VNP] return verify', ['ok' => true, 'resp' => $resp, 'ref' => $txnRef]);

        if ($resp === '00') {
            try {
                DB::transaction(function () use ($map, $params) {
                    $orderIds = $map['order_ids'] ?? [];
                    $payCode  = $params['vnp_TransactionNo'] ?? null;

                    Order::whereIn('id', $orderIds)->update([
                        'payment_status' => 'Completed',
                        'transaction_id' => $payCode,
                        'order_status'   => 'order confirmation',
                    ]);
                });
            } catch (\Throwable $e) {
                Log::error('VNPAY Return update error: '.$e->getMessage());
                return $this->redirectToFrontend([
                    'status' => 'failed',
                    'reason' => 'db_error',
                    'vnp_ResponseCode' => $resp,
                    'vnp_TxnRef' => $txnRef,
                ]);
            }

            Cache::forget("vnp:{$txnRef}");

            return $this->redirectToFrontend([
                'status'     => 'success',
                'order_ids'  => implode(',', $map['order_ids'] ?? []),
                'amount'     => (int)($map['amount'] ?? 0),
                'vnp_TransactionNo' => $params['vnp_TransactionNo'] ?? '',
                'vnp_ResponseCode' => $resp,
                'vnp_TxnRef' => $txnRef,
                'vnp_PayDate' => $params['vnp_PayDate'] ?? '',
                'vnp_OrderInfo' => $params['vnp_OrderInfo'] ?? '',
            ]);
        }

        return $this->redirectToFrontend([
            'status' => 'failed',
            'reason' => $resp,
            'vnp_ResponseCode' => $resp,
            'vnp_TxnRef' => $txnRef,
        ]);
    }


    private function redirectToFrontend(array $query)
    {
        $url = config('services.vnpay.frontend_return_url')
            ?? env('FRONTEND_RESULT_URL')
            ?? env('VNP_RETURNURL')
            ?? 'http://localhost:3000/checkout/result'; // Default to frontend result page

        $qs  = http_build_query($query);
        return redirect()->away($url . (str_contains($url, '?') ? '&' : '?') . $qs);
    }
}
