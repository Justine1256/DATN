<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VnpayService
{
    /**
     * - Ký HMAC-SHA512 trên chuỗi THÔ đã sort (không encode)
     * - Query dùng rawurlencode (tránh '+' ↔ '%20')
     * - KHÔNG đưa vnp_SecureHashType vào chuỗi ký
     * - vnp_SecureHash UPPERCASE
     * - Có block log 4 biến thể URL để test sandbox (bật/tắt qua ENV)
     *
     * ENV hỗ trợ (tùy chọn):
     *  - VNP_DEBUG_VARIANTS=true  => log 4 URL thử nghiệm
     *  - VNP_FORCE_ALGO=SHA512|SHA256
     *  - VNP_FORCE_HASH_TYPE=NONE|SHA512|HmacSHA512  (NONE = không kèm type)
     */
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string)(config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        Log::info('[VNP] secret_fingerprint', [
            'where' => 'create',
            'len'   => strlen($vnp_HashSecret),
            'md5'   => md5($vnp_HashSecret),
        ]);

        // 1) Mã giao dịch nội bộ
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // 2) Map txnRef -> info
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

        // 4) Params (Amount *100)
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
            // 'vnp_BankCode' => 'NCB', // nếu muốn cố định bank khi test
        ];

        // 5) Ký HMAC trên chuỗi THÔ (sort, KHÔNG encode)
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');
        ksort($params);
        $hashData = implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($params), $params));

        // Hash variants (UPPERCASE)
        $h512 = strtoupper(hash_hmac('sha512', $hashData, $vnp_HashSecret));
        $h256 = strtoupper(hash_hmac('sha256', $hashData, $vnp_HashSecret));

        // Build query: rawurlencode
        $q = implode('&', array_map(
            fn($k,$v) => rawurlencode($k).'='.rawurlencode($v),
            array_keys($params), $params
        ));

        // 6) Tạo các biến thể URL (KHÔNG đưa type vào chuỗi ký)
        $url_512_plain     = $vnp_Url.'?'.$q.'&vnp_SecureHash='.$h512;
        $url_512_withtype1 = $vnp_Url.'?'.$q.'&vnp_SecureHashType=SHA512&vnp_SecureHash='.$h512;
        $url_512_withtype2 = $vnp_Url.'?'.$q.'&vnp_SecureHashType=HmacSHA512&vnp_SecureHash='.$h512;
        $url_256_withtype  = $vnp_Url.'?'.$q.'&vnp_SecureHashType=SHA256&vnp_SecureHash='.$h256;

        // 7) Log thử nghiệm (bật qua ENV nếu muốn)
        if (filter_var(env('VNP_DEBUG_VARIANTS', false), FILTER_VALIDATE_BOOLEAN)) {
            Log::info('[VNP] try_urls', compact(
                'url_512_plain','url_512_withtype1','url_512_withtype2','url_256_withtype','hashData'
            ));
        }

        // 8) Chọn URL trả về theo ENV (mặc định: SHA512, không type)
        $forceAlgo = strtoupper((string) env('VNP_FORCE_ALGO', 'SHA512'));          // SHA512|SHA256
        $forceType = strtoupper((string) env('VNP_FORCE_HASH_TYPE', 'NONE'));       // NONE|SHA512|HMACSHA512

        if ($forceAlgo === 'SHA256') {
            $fullUrl = $url_256_withtype; // SHA256 đa số yêu cầu kèm type
        } else {
            if ($forceType === 'SHA512') {
                $fullUrl = $url_512_withtype1;
            } elseif ($forceType === 'HMACSHA512') {
                $fullUrl = $url_512_withtype2;
            } else {
                $fullUrl = $url_512_plain;
            }
        }

        // 9) Self-check (bỏ SecureHash/Type ra khỏi chuỗi ký khi rehash)
        parse_str(parse_url($fullUrl, PHP_URL_QUERY), $p);
        $recv = strtoupper((string)($p['vnp_SecureHash'] ?? ''));
        unset($p['vnp_SecureHash'], $p['vnp_SecureHashType']);
        $p = array_filter($p, fn($v) => $v !== null && $v !== '');
        ksort($p);
        $rehash = strtoupper(hash_hmac('sha512',
            implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($p), $p)),
            $vnp_HashSecret
        ));

        Log::info('[VNP] createPaymentUrl', [
            'hash_equal' => hash_equals($rehash, $recv),
            'return_url' => $vnp_ReturnUrl,
            'full_url'   => $fullUrl,
        ]);

        return $fullUrl;
    }

    /**
     * Verify từ mảng params (đã decode bởi framework)
     * - Bỏ vnp_SecureHash & vnp_SecureHashType khỏi dữ liệu ký
     * - So sánh UPPERCASE
     */
    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string)(config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        Log::info('[VNP] secret_fingerprint', [
            'where' => 'verify',
            'len'   => strlen($vnp_HashSecret),
            'md5'   => md5($vnp_HashSecret),
        ]);

        $secureHashRecv = strtoupper((string)($params['vnp_SecureHash'] ?? ''));
        if ($secureHashRecv === '') {
            Log::warning('[VNP] verifyHash: missing vnp_SecureHash');
            return false;
        }

        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');
        ksort($params);

        $hashData = implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($params), $params));
        $calc512  = strtoupper(hash_hmac('sha512', $hashData, $vnp_HashSecret));

        // So sánh SHA512 trước
        if (hash_equals($calc512, $secureHashRecv)) {
            Log::info('[VNP] verifyHash result', ['ok' => true, 'algo' => 'SHA512', 'hash_data' => $hashData]);
            return true;
        }

        // (Dự phòng) Nếu sandbox của bạn dùng SHA256 cho return/ipn
        $calc256 = strtoupper(hash_hmac('sha256', $hashData, $vnp_HashSecret));
        $ok256   = hash_equals($calc256, $secureHashRecv);

        Log::info('[VNP] verifyHash result', [
            'ok'        => $ok256,
            'algo'      => $ok256 ? 'SHA256' : 'NONE',
            'hash_data' => $hashData,
            'recv'      => $secureHashRecv,
        ]);

        return $ok256;
    }

    /**
     * Verify từ RAW query string (tránh '+' / '%20' sai khác)
     * - Bỏ vnp_SecureHash & vnp_SecureHashType
     * - So sánh UPPERCASE
     */
    public static function verifyHashFromRaw(Request $request): bool
    {
        $vnp_HashSecret = trim((string)(config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));
        $qs = (string) $request->getQueryString();
        if ($qs === '') {
            Log::warning('[VNP] verifyHashFromRaw: empty query string');
            return false;
        }

        $pairs = [];
        foreach (explode('&', $qs) as $seg) {
            if (str_starts_with($seg, 'vnp_SecureHash=')) continue;
            if (str_starts_with($seg, 'vnp_SecureHashType=')) continue;
            $pairs[] = $seg; // giữ nguyên thô
        }

        $kv = [];
        foreach ($pairs as $seg) {
            [$k, $v] = array_pad(explode('=', $seg, 2), 2, '');
            $kv[$k] = $v;
        }
        ksort($kv);

        $hashData = implode('&', array_map(fn($k,$v)=>"$k=$v", array_keys($kv), $kv));
        $recv     = strtoupper((string) $request->query('vnp_SecureHash', ''));

        // Thử SHA512 rồi fallback SHA256
        $calc512  = strtoupper(hash_hmac('sha512', $hashData, $vnp_HashSecret));
        if (hash_equals($calc512, $recv)) {
            Log::info('[VNP] verifyHashFromRaw', ['ok' => true, 'algo' => 'SHA512']);
            return true;
        }
        $calc256  = strtoupper(hash_hmac('sha256', $hashData, $vnp_HashSecret));
        $ok       = hash_equals($calc256, $recv);

        Log::info('[VNP] verifyHashFromRaw', [
            'ok'   => $ok,
            'algo' => $ok ? 'SHA256' : 'NONE',
        ]);

        return $ok;
    }
}
