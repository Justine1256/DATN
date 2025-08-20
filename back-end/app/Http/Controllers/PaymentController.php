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
        ]);

        $url = VnpayService::createPaymentUrl([
            'user_id'   => Auth::id(),
            'order_ids' => $request->order_ids,
            'amount'    => (int)$request->amount,
            'return_url'=> route('vnpay.return', [], true), // absolute
        ]);

        return response()->json(['payment_url' => $url]);
    }

    public function vnpayReturn(Request $request)
    {
        $params = $request->all();

        if (!VnpayService::verifyHash($params)) {
            return $this->redirectToFrontend([
                'status' => 'failed',
                'reason' => 'invalid_hash',
            ]);
        }

        $txnRef = $params['vnp_TxnRef'] ?? null;
        $resp   = $params['vnp_ResponseCode'] ?? null;
        $map    = $txnRef ? Cache::get("vnp:{$txnRef}") : null;

        if (!$map) {
            return $this->redirectToFrontend([
                'status' => 'failed',
                'reason' => 'mapping_not_found',
            ]);
        }

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
                ]);
            }

            Cache::forget("vnp:{$txnRef}");

            return $this->redirectToFrontend([
                'status'     => 'success',
                'order_ids'  => implode(',', $map['order_ids'] ?? []),
                'amount'     => (int)($map['amount'] ?? 0),
                'code'       => $params['vnp_TransactionNo'] ?? '',
            ]);
        }

        return $this->redirectToFrontend([
            'status' => 'failed',
            'reason' => $resp,
        ]);
    }

    public function vnpayIpn(Request $request)
    {
        $params = $request->all();

        if (!VnpayService::verifyHash($params)) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid Checksum']);
        }

        $txnRef = $params['vnp_TxnRef'] ?? null;
        $resp   = $params['vnp_ResponseCode'] ?? null;
        $map    = $txnRef ? Cache::get("vnp:{$txnRef}") : null;

        if (!$map) {
            return response()->json(['RspCode' => '00', 'Message' => 'OK']);
        }

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

                Cache::forget("vnp:{$txnRef}");

                return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
            } catch (\Throwable $e) {
                Log::error('VNPAY IPN update error: '.$e->getMessage());
                return response()->json(['RspCode' => '99', 'Message' => 'DB Error']);
            }
        }

        return response()->json(['RspCode' => '00', 'Message' => 'Payment Failed']);
    }

    private function redirectToFrontend(array $query)
    {
        $url = config('services.vnpay.return_url') ?? env('FRONTEND_RESULT_URL') ?? env('VNP_RETURNURL');
        $qs  = http_build_query($query);
        return redirect()->away($url . (str_contains($url, '?') ? '&' : '?') . $qs);
    }
}
