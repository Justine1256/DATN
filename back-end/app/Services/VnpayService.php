<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VnpayService
{
    /**
     * Fixed signature generation to match VNPay requirements exactly
     * Based on debugging results: HMAC-SHA512 with vnp_SecureHashType excluded
     */
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        Log::info('[VNP] createPaymentUrl start', [
            'tmn'        => $vnp_TmnCode,
            'secret_len' => strlen($vnp_HashSecret),
            'url'        => $vnp_Url,
        ]);

        // 1) Tạo mã giao dịch nội bộ
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // 2) Lưu map txnRef -> info để return/ipn xử lý
        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) ($payload['amount'] ?? 0),
        ], now()->addMinutes(30));

        // 3) Return URL
        $vnp_ReturnUrl = $payload['return_url']
            ?? (config('services.vnpay.return_url') ?? env('VNP_RETURNURL'));

        if (!preg_match('~^https?://~i', (string)$vnp_ReturnUrl)) {
            $vnp_ReturnUrl = url($vnp_ReturnUrl);
        }

        // 4) Build params (amount phải *100)
        $vnp_Amount = (int) round(((int)($payload['amount'] ?? 0)) * 100);

        $params = [
            'vnp_Version'    => '2.1.0',
            'vnp_TmnCode'    => $vnp_TmnCode,
            'vnp_Amount'     => $vnp_Amount,
            'vnp_Command'    => 'pay',
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_CurrCode'   => 'VND',
            'vnp_IpAddr'     => request()->ip(),
            'vnp_Locale'     => 'vn',
            'vnp_OrderInfo'  => $payload['order_info'] ?? ('Thanh toan don hang: ' . $txnRef),
            'vnp_OrderType'  => 'other',
            'vnp_ReturnUrl'  => $vnp_ReturnUrl,
            'vnp_TxnRef'     => $txnRef,
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        $params = array_filter($params, fn($v) => $v !== null && $v !== '');

        // This matches our debugging results exactly
        ksort($params);
        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        $query = implode('&', array_map(
            fn($k,$v) => urlencode($k).'='.urlencode($v),
            array_keys($params), $params
        ));

        $fullUrl = $vnp_Url.'?'.$query
                 .'&vnp_SecureHashType=HmacSHA512'
                 .'&vnp_SecureHash='.$secureHash;

        Log::info('[VNP] createPaymentUrl success', [
            'txn_ref'     => $txnRef,
            'amount'      => $vnp_Amount,
            'return_url'  => $vnp_ReturnUrl,
            'hash_data'   => $hashData,
            'secure_hash' => $secureHash,
        ]);

        return $fullUrl;
    }

    /**
     * Fixed verification to match VNPay requirements exactly
     * Based on debugging: HMAC-SHA512 with vnp_SecureHashType excluded from signature
     */
    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));
        $secureHash = $params['vnp_SecureHash'] ?? '';

        if (empty($secureHash)) {
            Log::warning('[VNP] verifyHash: no secure hash provided');
            return false;
        }

        // Then remove vnp_SecureHashType from signature generation
        $verifyParams = $params;
        unset($verifyParams['vnp_SecureHash']);

        unset($verifyParams['vnp_SecureHashType']);

        $verifyParams = array_filter($verifyParams, fn($v) => $v !== null && $v !== '');
        ksort($verifyParams);

        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($verifyParams), $verifyParams
        ));

        $calculatedHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $isValid = hash_equals(strtolower($calculatedHash), strtolower($secureHash));

        Log::info('[VNP] verifyHash result', [
            'is_valid'        => $isValid,
            'received_hash'   => $secureHash,
            'calculated_hash' => $calculatedHash,
            'hash_data'       => $hashData,
            'params_count'    => count($verifyParams),
        ]);

        return $isValid;
    }
}
