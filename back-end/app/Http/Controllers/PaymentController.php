<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\VnpayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
class PaymentController extends Controller
{
    public function create(Request $req)
    {
        $data = $req->validate([
            'amount'    => 'required|integer|min:1000',
            'orderId'   => 'nullable|string',
            'orderInfo' => 'nullable|string',
        ]);

        $url = VnpayService::createPaymentUrl(
            (int)$data['amount'],
            $data['orderId'] ?? null,
            $data['orderInfo'] ?? null
        );

        return response()->json([
            'payment_url' => $url,
        ]);
    }

    // GET /api/vnpay/return
    public function return(Request $req)
    {
        $ok   = VnpayService::verify($req->query());
        $code = $req->query('vnp_ResponseCode');
        $txn  = $req->query('vnp_TxnRef');

        // vnp_ResponseCode === '00' mới là thanh toán thành công
        return response()->json([
            'verified' => $ok,
            'success'  => $ok && $code === '00',
            'vnp_ResponseCode' => $code,
            'order_id' => $txn,
        ], $ok ? 200 : 400);
    }

    // POST /api/vnpay/ipn (tuỳ dùng)
    public function ipn(Request $req)
    {
        $ok = VnpayService::verify($req->all());
        return response()->json([
            'RspCode' => $ok ? '00' : '97',
            'Message' => $ok ? 'Confirm Success' : 'Invalid Checksum',
        ]);
    }
}
