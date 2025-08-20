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
     *  - return_url?: string (absolute/relative) -> nên truyền route('vnpay.return', [], true)
     */
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));
Log::info('[VNP] secret_fingerprint', [
  'where' => 'create/verify',
  'len' => strlen($vnp_HashSecret),
  'md5' => md5($vnp_HashSecret),
  'host' => gethostname(),
]);

        Log::info('[VNP] runtime cfg', [
            'tmn'        => $vnp_TmnCode,
            'secret_len' => strlen($vnp_HashSecret),
            'env_url'    => $vnp_Url,
        ]);

        // 1) Tạo mã giao dịch nội bộ
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // 2) Lưu map txnRef -> info để return/ipn xử lý
        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) ($payload['amount'] ?? 0),
        ], now()->addMinutes(30));

        // 3) Return URL (backend)
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
            'vnp_OrderInfo'  => 'Thanh toan don hang: ' . $txnRef,
            'vnp_OrderType'  => 'other',
            'vnp_ReturnUrl'  => $vnp_ReturnUrl,
            'vnp_TxnRef'     => $txnRef,
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        // Loại param rỗng
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');

        // 5) hashData: KHÔNG urlencode
        ksort($params);
        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));

        // 6) query: CÓ urlencode
        $query = implode('&', array_map(
            fn($k,$v) => urlencode($k).'='.urlencode($v),
            array_keys($params), $params
        ));

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        // Một số môi trường yêu cầu có vnp_SecureHashType
        $fullUrl = $vnp_Url.'?'.$query
                 .'&vnp_SecureHashType=HmacSHA512'
                 .'&vnp_SecureHash='.$secureHash;

        // ===== Self-check từ URL đã build =====
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

    /**
     * Verify checksum ở Return/IPN với debug chi tiết
     */
    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));
        Log::info('[VNP] secret_fingerprint', [
  'where' => 'create/verify',
  'len' => strlen($vnp_HashSecret),
  'md5' => md5($vnp_HashSecret),
  'host' => gethostname(),
]);

        $secureHash = $params['vnp_SecureHash'] ?? '';
        $originalParams = $params; // Keep original for debugging

        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');
        ksort($params);

        // Log raw parameters as received
        Log::info('[VNP] RAW PARAMETERS RECEIVED', [
            'all_params' => $originalParams,
            'query_string' => $_SERVER['QUERY_STRING'] ?? 'N/A',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A'
        ]);

        // Approach 1: Original (no encoding)
        $hashData1 = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));
        $calc1 = hash_hmac('sha512', $hashData1, $vnp_HashSecret);
        $ok1 = hash_equals(strtolower($calc1), strtolower($secureHash));

        // Approach 2: URL decode values (VNPay might send encoded)
        $decodedParams = array_map('urldecode', $params);
        $hashData2 = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($decodedParams), $decodedParams
        ));
        $calc2 = hash_hmac('sha512', $hashData2, $vnp_HashSecret);
        $ok2 = hash_equals(strtolower($calc2), strtolower($secureHash));

        // Approach 3: URL encode values (opposite approach)
        $encodedParams = array_map('urlencode', $params);
        $hashData3 = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($encodedParams), $encodedParams
        ));
        $calc3 = hash_hmac('sha512', $hashData3, $vnp_HashSecret);
        $ok3 = hash_equals(strtolower($calc3), strtolower($secureHash));

        // Approach 4: Try with raw query string parsing
        $rawQuery = $_SERVER['QUERY_STRING'] ?? '';
        $rawParams = [];
        if ($rawQuery) {
            parse_str($rawQuery, $rawParams);
            unset($rawParams['vnp_SecureHash'], $rawParams['vnp_SecureHashType']);
            $rawParams = array_filter($rawParams, fn($v) => $v !== null && $v !== '');
            ksort($rawParams);

            $hashData4 = implode('&', array_map(
                fn($k,$v) => $k.'='.$v,
                array_keys($rawParams), $rawParams
            ));
            $calc4 = hash_hmac('sha512', $hashData4, $vnp_HashSecret);
            $ok4 = hash_equals(strtolower($calc4), strtolower($secureHash));
        } else {
            $hashData4 = 'N/A';
            $calc4 = 'N/A';
            $ok4 = false;
        }

        // Approach 5: Try with plus signs as spaces (common URL encoding issue)
        $spaceFixedParams = array_map(fn($v) => str_replace('+', ' ', $v), $params);
        $hashData5 = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($spaceFixedParams), $spaceFixedParams
        ));
        $calc5 = hash_hmac('sha512', $hashData5, $vnp_HashSecret);
        $ok5 = hash_equals(strtolower($calc5), strtolower($secureHash));

        Log::info('[VNP] verifyHash EXTENDED DEBUG', [
            'secret_len' => strlen($vnp_HashSecret),
            'received_hash' => $secureHash,
            'original_params' => $originalParams,
            'filtered_params' => $params,

            'approach_1_no_encoding' => [
                'hash_data' => $hashData1,
                'calculated' => $calc1,
                'match' => $ok1
            ],

            'approach_2_url_decode' => [
                'decoded_params' => $decodedParams,
                'hash_data' => $hashData2,
                'calculated' => $calc2,
                'match' => $ok2
            ],

            'approach_3_url_encode' => [
                'encoded_params' => $encodedParams,
                'hash_data' => $hashData3,
                'calculated' => $calc3,
                'match' => $ok3
            ],

            'approach_4_raw_query' => [
                'raw_query' => $rawQuery,
                'raw_params' => $rawParams ?? 'N/A',
                'hash_data' => $hashData4,
                'calculated' => $calc4,
                'match' => $ok4
            ],

            'approach_5_space_fix' => [
                'space_fixed_params' => $spaceFixedParams,
                'hash_data' => $hashData5,
                'calculated' => $calc5,
                'match' => $ok5
            ]
        ]);

        $finalResult = $ok1 || $ok2 || $ok3 || $ok4 || $ok5;

        Log::info('[VNP] verifyHash FINAL RESULT', [
            'final_ok' => $finalResult,
            'which_worked' => $ok1 ? 'no_encoding' : ($ok2 ? 'url_decode' : ($ok3 ? 'url_encode' : ($ok4 ? 'raw_query' : ($ok5 ? 'space_fix' : 'none'))))
        ]);

        return $finalResult;
    }
}
