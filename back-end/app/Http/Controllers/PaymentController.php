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

        $url = VnpayService::createPaymentUrl([
            'amount'    => (int)$data['amount'],
            'orderId'   => $data['orderId'] ?? null,
            'orderInfo' => $data['orderInfo'] ?? null,
        ]);

        return response()->json([
            'payment_url' => $url,
        ]);
    }

    public function return(Request $req)
    {
        $ok = VnpayService::verify($req->query());
        $code = $req->query('vnp_ResponseCode');
        $order = $req->query('vnp_TxnRef');

        return response()->json([
            'success' => $ok && $code === '00',
            'verified' => $ok,
            'vnp_ResponseCode' => $code,
            'order_id' => $order,
        ], $ok ? 200 : 400);
    }

    public function ipn(Request $req)
    {
        $ok = VnpayService::verify($req->all());
        if (!$ok) {
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid Checksum']);
        }

        // TODO: xử lý idempotent theo $req->input('vnp_TxnRef'), 'vnp_ResponseCode'
        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }
}
