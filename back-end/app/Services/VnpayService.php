<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class VnpayService
{
    public static function createPaymentUrl(array $payload): string
    {
        // $payload: ['user_id'=>..., 'order_ids'=>[...], 'amount'=>int|float, 'return_url'=>string]
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET');

        // Tạo mã giao dịch nội bộ (txnRef) – duy nhất
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // Lưu tạm mapping txnRef -> order_ids (30 phút)
        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) $payload['amount'],
        ], now()->addMinutes(30));

        $vnp_ReturnUrl  = $payload['return_url'] ?? (config('services.vnpay.return_url') ?? env('VNP_RETURNURL'));
        $vnp_IpAddr     = request()->ip();

        $vnp_Amount = (int)round(($payload['amount'] ?? 0) * 100); // VNP yêu cầu nhân 100
        $inputData = [
            "vnp_Version"   => "2.1.0",
            "vnp_TmnCode"   => $vnp_TmnCode,
            "vnp_Amount"    => $vnp_Amount,
            "vnp_Command"   => "pay",
            "vnp_CreateDate"=> now()->format('YmdHis'),
            "vnp_CurrCode"  => "VND",
            "vnp_IpAddr"    => $vnp_IpAddr,
            "vnp_Locale"    => "vn",
            "vnp_OrderInfo" => "Thanh toan don hang: " . $txnRef,
            "vnp_OrderType" => "other",
            "vnp_ReturnUrl" => url()->route('vnpay.return'),
            "vnp_TxnRef"    => $txnRef,
            // Có thể set ExpireDate (10-15 phút)
            "vnp_ExpireDate"=> now()->addMinutes(15)->format('YmdHis'),
        ];

        // Sắp xếp key theo alphabet
        ksort($inputData);
        $query = [];
        $hashDataArr = [];
        foreach ($inputData as $key => $value) {
            $hashDataArr[] = $key . "=" . $value;
            $query[] = urlencode($key) . "=" . urlencode($value);
        }
        $hashData = implode('&', $hashDataArr);
        $vnp_Url = $vnp_Url . "?" . implode('&', $query);

        if ($vnp_HashSecret) {
            $vnpSecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
            $vnp_Url .= '&vnp_SecureHash=' . $vnpSecureHash;
        }

        return $vnp_Url;
    }

    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET');

        $secureHash = $params['vnp_SecureHash'] ?? '';
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);

        ksort($params);
        $hashDataArr = [];
        foreach ($params as $key => $value) {
            $hashDataArr[] = $key . "=" . $value;
        }
        $hashData = implode('&', $hashDataArr);

        $calcHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        return strtolower($calcHash) === strtolower($secureHash);
    }
}
