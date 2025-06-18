<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function createVnpayPayment(Request $request)
    {
        $vnp_TmnCode = env('VNP_TMN_CODE');
        $vnp_HashSecret = env('VNP_HASH_SECRET');
        $vnp_Url = env('VNP_URL');
        $vnp_Returnurl = env('VNP_RETURNURL');

        $order_id = time();
        $amount = $request->amount;
        $orderInfo = "Thanh toán đơn hàng #$order_id";
        $vnp_TxnRef = $order_id;
        $vnp_OrderInfo = $orderInfo;
        $vnp_OrderType = 'billpayment';
        $vnp_Amount = $amount * 100;
        $vnp_Locale = 'vn';
        $vnp_IpAddr = $_SERVER['REMOTE_ADDR'];

        $inputData = array(
            "vnp_Version" => "2.1.0",
            "vnp_TmnCode" => $vnp_TmnCode,
            "vnp_Amount" => $vnp_Amount,
            "vnp_Command" => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode" => "VND",
            "vnp_IpAddr" => $vnp_IpAddr,
            "vnp_Locale" => $vnp_Locale,
            "vnp_OrderInfo" => $vnp_OrderInfo,
            "vnp_OrderType" => $vnp_OrderType,
            "vnp_ReturnUrl" => $vnp_Returnurl,
            "vnp_TxnRef" => $vnp_TxnRef
        );

        ksort($inputData);
        $hashdata = urldecode(http_build_query($inputData));
        $query = http_build_query($inputData);

        $vnp_SecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
        $vnp_Url = $vnp_Url . "?" . $query . '&vnp_SecureHash=' . $vnp_SecureHash;

        return response()->json([
            'code' => '00',
            'message' => 'success',
            'payment_url' => $vnp_Url
        ]);
    }

    public function vnpayReturn(Request $request)
    {
        $inputData = $request->all();
        $vnp_HashSecret = env('VNP_HASH_SECRET');

        $vnp_SecureHash = $inputData['vnp_SecureHash'];
        unset($inputData['vnp_SecureHash']);
        unset($inputData['vnp_SecureHashType']);

        ksort($inputData);
        $hashdata = urldecode(http_build_query($inputData));

        $secureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);

        if ($secureHash == $vnp_SecureHash) {
            if ($request->vnp_ResponseCode == '00') {
                return response()->json([
                    'code' => '00',
                    'message' => 'Payment success',
                    'data' => $inputData
                ]);
            } else {
                return response()->json([
                    'code' => $request->vnp_ResponseCode,
                    'message' => 'Payment failed',
                    'data' => $inputData
                ]);
            }
        } else {
            return response()->json([
                'code' => '97',
                'message' => 'Checksum failed',
                'data' => $inputData
            ]);
        }
    }
}
