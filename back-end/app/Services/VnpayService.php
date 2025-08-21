<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class VnpayService
{
    private static function buildHashData(array $params): string
    {
        // loại 2 trường hash nếu có
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);

        ksort($params);

        $hashData = '';
        foreach ($params as $key => $value) {
            $hashData .= ($hashData ? '&' : '') . $key . '=' . urlencode((string)$value);
        }
        return $hashData;
    }

    public static function createPaymentUrl(array $payload): string
    {
        $tmnCode    = config('vnpay.tmn_code');
        $secret     = config('vnpay.hash_secret');
        $payUrl     = config('vnpay.pay_url');
        $returnUrl  = config('vnpay.return_url');
        $locale     = config('vnpay.locale', 'vn');
        $currency   = config('vnpay.currency', 'VND');
        $version    = config('vnpay.version', '2.1.0');

        $amountVnd  = (int)$payload['amount']; // VND
        $txnRef     = $payload['orderId'];     // mã đơn/phiên thanh toán
        $orderInfo  = $payload['orderInfo'] ?? ('Thanh toan don hang: ' . $txnRef);

        $input = [
            'vnp_Version'   => $version,
            'vnp_Command'   => 'pay',
            'vnp_TmnCode'   => $tmnCode,
            'vnp_Amount'    => $amountVnd * 100, // nhân 100 theo chuẩn VNPAY
            'vnp_CurrCode'  => $currency,
            'vnp_TxnRef'    => $txnRef,
            'vnp_OrderInfo' => $orderInfo,
            'vnp_OrderType' => 'other',
            'vnp_Locale'    => $locale,
            'vnp_IpAddr'    => request()->ip(),
            'vnp_ReturnUrl' => $returnUrl,
            'vnp_CreateDate'=> now('Asia/Ho_Chi_Minh')->format('YmdHis'),
            'vnp_ExpireDate'=> now('Asia/Ho_Chi_Minh')->addMinutes(15)->format('YmdHis'),
        ];

        // Nếu bạn muốn dùng IPN cố định:
        if (config('vnpay.ipn_url')) {
            $input['vnp_IpnUrl'] = config('vnpay.ipn_url');
        }

        $hashData = self::buildHashData($input);
        $secure   = hash_hmac('sha512', $hashData, $secret);

        $query = $hashData . '&vnp_SecureHash=' . $secure;
        $full  = rtrim($payUrl, '?') . '?' . $query;

        Log::info('[VNP] send', ['hashData' => $hashData, 'secure' => $secure, 'full' => $full]);

        return $full;
    }

    public static function verify(array $params): bool
    {
        $secret = config('vnpay.hash_secret');
        $hashData = self::buildHashData($params);
        $calc = hash_hmac('sha512', $hashData, $secret);
        $recv = $params['vnp_SecureHash'] ?? '';

        Log::info('[VNP] back', [
            'hashDataBack' => $hashData,
            'calc' => $calc,
            'recv' => $recv,
        ]);

        // so sánh an toàn, không phân biệt hoa/thường
        return hash_equals(strtolower($calc), strtolower($recv));
    }
}
