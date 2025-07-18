<?php

namespace App\Services;

class VnpayService
{
    public static function createPaymentUrl($data)
    {
        // Cấu hình từ config/vnpay.php
        $vnp_TmnCode    = config('vnpay.tmn_code');
        $vnp_HashSecret = config('vnpay.hash_secret');
        $vnp_Url        = config('vnpay.url');
        $vnp_Returnurl  = $data['return_url'];

        $vnp_TxnRef     = time() . rand(1000, 9999);
        $vnp_OrderInfo  = 'Thanh toán đơn hàng #' . implode(',', $data['order_ids']);
        $vnp_Amount     = $data['amount'] * 100; // VNPAY yêu cầu nhân 100

        $inputData = [
            "vnp_Version"    => "2.1.0",
            "vnp_TmnCode"    => $vnp_TmnCode,
            "vnp_Amount"     => $vnp_Amount,
            "vnp_Command"    => "pay",
            "vnp_CreateDate" => date('YmdHis'),
            "vnp_CurrCode"   => "VND",
            "vnp_IpAddr"     => request()->ip(),
            "vnp_Locale"     => "vn",
            "vnp_OrderInfo"  => $vnp_OrderInfo,
            "vnp_OrderType"  => "billpayment",
            "vnp_ReturnUrl"  => $vnp_Returnurl,
            "vnp_TxnRef"     => $vnp_TxnRef,
        ];

        // Sort inputData
        ksort($inputData);
        $query  = http_build_query($inputData);
        $vnpUrl = $vnp_Url . "?" . $query;

        return $vnpUrl;
    }
}
