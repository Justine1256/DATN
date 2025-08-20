<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VnpayService
{
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        // TRIM để tránh ký tự ẩn/cách dòng
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) ($payload['amount'] ?? 0),
        ], now()->addMinutes(30));

        // DÙNG DUY NHẤT MỘT GIÁ TRỊ RETURN URL (từ payload hoặc env), và dùng nó cho CẢ hash lẫn query
        $vnp_ReturnUrl = $payload['return_url']
            ?? (config('services.vnpay.return_url') ?? env('VNP_RETURNURL'));
        // đảm bảo absolute URL
        if (!preg_match('~^https?://~i', $vnp_ReturnUrl)) {
            $vnp_ReturnUrl = url($vnp_ReturnUrl);
        }

        $vnp_IpAddr  = request()->ip();
        $vnp_Amount  = (int) round(((int)($payload['amount'] ?? 0)) * 100); // NHÂN 100

        $inputData = [
            'vnp_Version'    => '2.1.0',
            'vnp_TmnCode'    => $vnp_TmnCode,
            'vnp_Amount'     => $vnp_Amount,
            'vnp_Command'    => 'pay',
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_CurrCode'   => 'VND',
            'vnp_IpAddr'     => $vnp_IpAddr,
            'vnp_Locale'     => 'vn',
            'vnp_OrderInfo'  => 'Thanh toan don hang: ' . $txnRef,
            'vnp_OrderType'  => 'other',
            'vnp_ReturnUrl'  => $vnp_ReturnUrl, // dùng đúng biến đã chọn
            'vnp_TxnRef'     => $txnRef,
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        // loại param rỗng nếu có (phòng hờ)
        $inputData = array_filter($inputData, fn($v) => $v !== null && $v !== '');

        ksort($inputData);

        // KHÔNG urlencode khi tạo hashData
        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($inputData), $inputData
        ));

        // CÓ urlencode khi tạo query
        $query = implode('&', array_map(
            fn($k,$v) => urlencode($k).'='.urlencode($v),
            array_keys($inputData), $inputData
        ));

        $vnp_Url = $vnp_Url . '?' . $query;

        if ($vnp_HashSecret !== '') {
            $vnpSecureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
            $vnp_Url .= '&vnp_SecureHash=' . $vnpSecureHash;
        }

        // (debug tạm – xoá sau khi xong)
        // Log::info('VNP hash len='.strlen($vnp_HashSecret).' url='.$vnp_Url.' hashData='.$hashData);

        return $vnp_Url;
    }

    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        $secureHash = $params['vnp_SecureHash'] ?? '';
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);

        // loại param rỗng nếu có
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');

        ksort($params);

        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));

        $calcHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        return hash_equals(strtolower($calcHash), strtolower($secureHash));
    }
}
