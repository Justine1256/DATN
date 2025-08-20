<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class VnpayService
{
    /**
     * HMAC-SHA512; KHÔNG gửi vnp_SecureHashType trong URL
     * - Ký: ksort + "key=value" nối bằng '&' (KHÔNG encode)
     * - Query: rawurlencode từng key/value
     */
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(config('services.vnpay.url') ?? env('VNP_URL'), '/');
        $vnp_TmnCode    = config('services.vnpay.tmn_code') ?? env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));

        Log::info('[VNP] secret_fingerprint', [
            'where' => 'create',
            'len'   => strlen($vnp_HashSecret),
            'md5'   => md5($vnp_HashSecret),
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

        // 4) Params (vnp_Amount phải *100)
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
            // 'vnp_BankCode' => 'NCB', // tùy chọn khi test
        ];
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');

        // 5) Ký HMAC-SHA512 trên chuỗi THÔ đã sort
        ksort($params);
        $hashData   = implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($params), $params));
        $secureHash = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        // 6) Build query: rawurlencode để tránh '+' ⇄ '%20'
        $query  = implode('&', array_map(fn($k,$v)=>rawurlencode($k).'='.rawurlencode($v), array_keys($params), $params));
        $fullUrl = $vnp_Url.'?'.$query.'&vnp_SecureHash='.$secureHash; // KHÔNG thêm vnp_SecureHashType

        // (khuyến nghị) Self-check để debug nhanh
        parse_str(parse_url($fullUrl, PHP_URL_QUERY), $p);
        $recv = $p['vnp_SecureHash'] ?? '';
        unset($p['vnp_SecureHash'], $p['vnp_SecureHashType']);
        $p = array_filter($p, fn($v) => $v !== null && $v !== '');
        ksort($p);
        $rehash = hash_hmac('sha512', implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($p), $p)), $vnp_HashSecret);

        Log::info('[VNP] createPaymentUrl', [
            'hash_equal' => hash_equals(strtolower($rehash), strtolower($recv)),
            'return_url' => $vnp_ReturnUrl,
            'full_url'   => $fullUrl,
        ]);

        return $fullUrl;
    }

    /**
     * Verify từ mảng params (đã decode bởi framework)
     * BỎ vnp_SecureHash & vnp_SecureHashType ra khỏi dữ liệu ký
     */
    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));
        Log::info('[VNP] secret_fingerprint', [
            'where' => 'verify',
            'len'   => strlen($vnp_HashSecret),
            'md5'   => md5($vnp_HashSecret),
        ]);

        $secureHash = $params['vnp_SecureHash'] ?? '';
        if ($secureHash === '') {
            Log::warning('[VNP] verifyHash: missing vnp_SecureHash');
            return false;
        }

        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        $params = array_filter($params, fn($v) => $v !== null && $v !== '');
        ksort($params);

        $hashData = implode('&', array_map(fn($k,$v)=>$k.'='.$v, array_keys($params), $params));
        $calc     = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $ok       = hash_equals(strtolower($calc), strtolower($secureHash));

        Log::info('[VNP] verifyHash result', [
            'ok'        => $ok,
            'hash_data' => $hashData,
        ]);

        return $ok;
    }

    /**
     * (Robust) Verify từ RAW query string để tránh sai khác dấu '+' / '%20'
     */
    public static function verifyHashFromRaw(Request $request): bool
    {
        $vnp_HashSecret = trim((string) (config('services.vnpay.hash_secret') ?? env('VNP_HASH_SECRET')));
        $qs = (string) $request->getQueryString();
        if ($qs === '') return false;

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
        $recv     = (string) $request->query('vnp_SecureHash', '');
        $calc     = hash_hmac('sha512', $hashData, $vnp_HashSecret);
        $ok       = hash_equals(strtolower($calc), strtolower($recv));

        Log::info('[VNP] verifyHashFromRaw', ['ok' => $ok]);

        return $ok;
    }
}
