<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VnpayService
{
    /**
     * Tạo URL thanh toán VNPAY.
     * $payload:
     *  - user_id: int|null
     *  - order_ids: int[]
     *  - amount: int|float (VND, chưa nhân 100)
     *  - return_url?: string (absolute hoặc relative)
     */
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        // Tạo mã giao dịch duy nhất
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // Lưu map txnRef -> đơn hàng để Return/IPN xử lý
        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) ($payload['amount'] ?? 0),
        ], now()->addMinutes(30));

        // Return URL (dùng MỘT giá trị duy nhất cho cả hash lẫn query)
        $vnp_ReturnUrl = $payload['return_url']
            ?? (config('services.vnpay.return_url') ?? env('VNP_RETURNURL'));

        // Đảm bảo absolute URL
        if (!preg_match('~^https?://~i', (string)$vnp_ReturnUrl)) {
            $vnp_ReturnUrl = url($vnp_ReturnUrl);
        }

        $vnp_Amount = (int) round(((int)($payload['amount'] ?? 0)) * 100); // nhân 100
        $inputData = [
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
            'vnp_ReturnUrl'  => $vnp_ReturnUrl, // dùng đúng biến đã chọn
            'vnp_TxnRef'     => $txnRef,
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        // Loại bỏ param rỗng (phòng trường hợp có optional)
        $inputData = array_filter($inputData, fn($v) => $v !== null && $v !== '');

        // 1) HASH DATA: KHÔNG urlencode
        ksort($inputData);
        $hashData = implode('&', array_map(
            fn($k, $v) => $k . '=' . $v,
            array_keys($inputData), $inputData
        ));

        // 2) QUERY: CÓ urlencode
        $query = implode('&', array_map(
            fn($k, $v) => urlencode($k) . '=' . urlencode($v),
            array_keys($inputData), $inputData
        ));

        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $fullUrl = $vnp_Url . '?' . $query . '&vnp_SecureHash=' . $secureHash;

        // ===== Self-check: rehash chính cái URL đã build (bắt lỗi encode/ReturnUrl lệch) =====
        parse_str(parse_url($fullUrl, PHP_URL_QUERY), $p);
        $recv = $p['vnp_SecureHash'] ?? '';
        unset($p['vnp_SecureHash'], $p['vnp_SecureHashType']);
        // loại param rỗng nếu có (bảo thủ)
        $p = array_filter($p, fn($v) => $v !== null && $v !== '');
        ksort($p);
        $rehash = hash_hmac(
            'sha512',
            implode('&', array_map(fn($k, $v) => $k . '=' . $v, array_keys($p), $p)),
            $vnp_HashSecret
        );
        if (!hash_equals(strtolower($rehash), strtolower($recv))) {
            Log::error('[VNP] SELF-CHECK FAILED', [
                'hashData_used_to_sign' => $hashData,
                'rehash_from_query'     => $rehash,
                'sent_secure_hash'      => $recv,
                'secret_len'            => strlen($vnp_HashSecret),
                'return_url'            => $vnp_ReturnUrl,
                'full_url'              => $fullUrl,
            ]);
            throw new \RuntimeException('VNP SELF-CHECK FAILED: signature mismatch before redirect');
        }

        // (tuỳ chọn) Log nhẹ để debug, xoá sau khi ổn
        // Log::info('[VNP] URL created', ['url' => $fullUrl]);

        return $fullUrl;
    }

    /**
     * Verify checksum ở Return/IPN.
     */
    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        $secureHash = $params['vnp_SecureHash'] ?? '';
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);

        // loại param rỗng nếu có
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');

        ksort($params);

        // KHÔNG urlencode khi verify
        $hashData = implode('&', array_map(
            fn($k, $v) => $k . '=' . $v,
            array_keys($params), $params
        ));

        $calc = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        return hash_equals(strtolower($calc), strtolower($secureHash));
    }
}
