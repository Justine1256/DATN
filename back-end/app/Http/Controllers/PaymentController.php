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
    // POST /api/vnpay/create
    public function create(Request $req)
    {
        $data = $req->validate([
            'amount'     => 'required|integer|min:1000',
            'orderId'    => 'nullable|string',
            'orderInfo'  => 'nullable|string',
        ]);

        // generate orderId nếu không truyền
        if (empty($data['orderId'])) {
            $data['orderId'] = 'PMT' . now('Asia/Ho_Chi_Minh')->format('YmdHis') . Str::random(6);
        }

        $paymentUrl = VnpayService::createPaymentUrl([
            'amount'    => (int)$data['amount'],
            'orderId'   => $data['orderId'],
            'orderInfo' => $data['orderInfo'] ?? ('Thanh toan don hang: ' . $data['orderId']),
        ]);

        return response()->json([
            'payment_url' => $paymentUrl,
            'order_id'    => $data['orderId'],
        ]);
    }

    // GET /api/vnpay/return
    public function return(Request $req)
    {
        $ok = VnpayService::verify($req->query());

        // Tham chiếu thêm mã phản hồi từ VNP
        $responseCode = $req->query('vnp_ResponseCode');
        $txnRef       = $req->query('vnp_TxnRef');

        if (!$ok) {
            // Cho FE hiển thị lỗi
            return response()->json([
                'success' => false,
                'message' => 'Invalid checksum',
                'vnp_ResponseCode' => $responseCode,
                'order_id' => $txnRef,
            ], 400);
        }

        // Tuỳ nghiệp vụ: nếu vnp_ResponseCode === '00' coi là thanh toán thành công
        $success = ($responseCode === '00');

        // TODO: cập nhật đơn hàng, log giao dịch...
        Log::info('[VNP] return verified', ['order_id' => $txnRef, 'resp' => $responseCode]);

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Payment success' : 'Payment not completed',
            'vnp_ResponseCode' => $responseCode,
            'order_id' => $txnRef,
        ]);
    }

    // POST /api/vnpay/ipn
    public function ipn(Request $req)
    {
        $ok = VnpayService::verify($req->all());
        if (!$ok) {
            return response()->json([
                'RspCode' => '97', // checksum failed
                'Message' => 'Invalid Checksum',
            ]);
        }

        $responseCode = $req->input('vnp_ResponseCode');
        $txnRef       = $req->input('vnp_TxnRef');

        // TODO: idempotent update trạng thái đơn hàng tại đây
        Log::info('[VNP] ipn verified', ['order_id' => $txnRef, 'resp' => $responseCode]);

        return response()->json([
            'RspCode' => '00',
            'Message' => 'Confirm Success',
        ]);
    }
}
