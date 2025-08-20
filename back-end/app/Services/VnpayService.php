<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VnpayService
{
    /**
     * $payload:
     *  - user_id: int|null
     *  - order_ids: int[]
     *  - amount: int|float (VND, chưa nhân 100)
     *  - return_url?: string (absolute/relative)
     */
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        // Mã giao dịch nội bộ
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // Map txnRef -> orders để return/ipn xử lý
        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) ($payload['amount'] ?? 0),
        ], now()->addMinutes(30));

        // Dùng MỘT giá trị return_url duy nhất cho cả hash lẫn query
        $vnp_ReturnUrl = $payload['return_url']
            ?? (config('services.vnpay.return_url') ?? env('VNP_RETURNURL'));
        if (!preg_match('~^https?://~i', (string)$vnp_ReturnUrl)) {
            $vnp_ReturnUrl = url($vnp_ReturnUrl); // ép absolute
        }

        $vnp_Amount = (int) round(((int)($payload['amount'] ?? 0)) * 100); // nhân 100 theo chuẩn VNPAY

        $params = [
            'vnp_Version'    => '2.1.0',
            'vnp_TmnCode'    => $vnp_TmnCode,
            'vnp_Amount'     => $vnp_Amount,
            'vnp_Command'    => 'pay',
            'vnp_CreateDate' => now()->format('YmdHis'),
            'vnp_CurrCode'   => 'VND',
            'vnp_IpAddr'     => request()->ip(),
            'vnp_Locale'     => 'vn',
            'vnp_OrderInfo'  => 'Thanh toan don hang: ' . $txnRef,
            'vnp_OrderType'  => 'other',
            'vnp_ReturnUrl'  => $vnp_ReturnUrl,
            'vnp_TxnRef'     => $txnRef,
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        // Loại param rỗng (an toàn)
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');

        // 1) hashData: KHÔNG urlencode
        ksort($params);
        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));

        // 2) query: CÓ urlencode
        $query = implode('&', array_map(
            fn($k,$v) => urlencode($k).'='.urlencode($v),
            array_keys($params), $params
        ));

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $fullUrl = $vnp_Url.'?'.$query.'&vnp_SecureHash='.$secureHash;

        // ===== Self-check từ chính URL đã build =====
        parse_str(parse_url($fullUrl, PHP_URL_QUERY), $p);
        $recv = $p['vnp_SecureHash'] ?? '';
        unset($p['vnp_SecureHash'], $p['vnp_SecureHashType']);
        $p = array_filter($p, fn($v) => $v !== null && $v !== '');
        ksort($p);
        $rehash = hash_hmac('sha512',
            implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($p), $p)),
            $vnp_HashSecret
        );

        Log::info('[VNP] createPaymentUrl', [
            'hash_equal'  => hash_equals(strtolower($rehash), strtolower($recv)),
            'secret_len'  => strlen($vnp_HashSecret),
            'return_url'  => $vnp_ReturnUrl,
            'full_url'    => $fullUrl,
        ]);

        if (!hash_equals(strtolower($rehash), strtolower($recv))) {
            Log::error('[VNP] SELF-CHECK FAILED', [
                'hashData_used_to_sign' => $hashData,
                'rehash_from_query'     => $rehash,
                'sent_secure_hash'      => $recv,
                'full_url'              => $fullUrl,
            ]);
            throw new \RuntimeException('VNP SELF-CHECK FAILED: signature mismatch before redirect');
        }

        return $fullUrl;
    }

    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        $secureHash = $params['vnp_SecureHash'] ?? '';
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');
        ksort($params);

        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));

        $calc = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $ok = hash_equals(strtolower($calc), strtolower($secureHash));

        Log::info('[VNP] verifyHash', [
            'ok'         => $ok,
            'secret_len' => strlen($vnp_HashSecret),
        ]);

        return $ok;
    }
}
