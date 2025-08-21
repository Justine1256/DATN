<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VnpayService
{
    // Dùng urlencode (RFC1738). KHÔNG dùng rawurlencode/encodeURIComponent
    private static function buildHashData(array $params): string
    {
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        ksort($params);
        $hashData = '';
        foreach ($params as $k => $v) {
            $hashData .= ($hashData ? '&' : '') . $k . '=' . urlencode((string)$v);
        }
        return $hashData;
    }

    private static function ipv4(): string
    {
        $ip = request()->ip();
        if ($ip === '::1' || $ip === '0:0:0:0:0:0:0:1') return '127.0.0.1';
        if (str_contains($ip, ':') && preg_match('/::ffff:(\d+\.\d+\.\d+\.\d+)/', $ip, $m)) return $m[1];
        if (str_contains($ip, ':')) return '127.0.0.1';
        return $ip ?: '127.0.0.1';
    }

    private static function cleanTxnRef(?string $ref): string
    {
        if ($ref) {
            $ref = preg_replace('/[^A-Za-z0-9_.-]/', '', $ref) ?? '';
            return Str::limit($ref, 34, '');
        }
        // PMT + ymdHis + 6 random uppercase (<=34)
        return Str::limit('PMT'.now('Asia/Ho_Chi_Minh')->format('YmdHis').strtoupper(Str::random(6)), 34, '');
    }

    private static function cleanOrderInfo(?string $info, string $fallback): string
    {
        $s = (string)($info ?? $fallback);
        // loại emoji (ngoài BMP) để tránh sandbox từ chối
        $s = preg_replace('/[\x{10000}-\x{10FFFF}]/u', '', $s) ?? '';
        return Str::limit($s, 255, '');
    }

    public static function createPaymentUrl(int $amountVnd, ?string $orderId = null, ?string $orderInfo = null): string
    {
        $tmn     = config('vnpay.tmn_code');
        $secret  = config('vnpay.hash_secret');
        $payUrl  = config('vnpay.pay_url');
        $retUrl  = config('vnpay.return_url');

        // Tối giản: hardcode các giá trị không cần ENV
        $version = '2.1.0';
        $currency = 'VND';
        $locale = 'vn';

        // Chuẩn hóa input
        if ($amountVnd < 10000) $amountVnd = 10000; // sandbox thường yêu cầu >= 10k
        $txnRef = self::cleanTxnRef($orderId);
        $orderInfo = self::cleanOrderInfo($orderInfo, 'Thanh toan don hang: '.$txnRef);

        $create = now('Asia/Ho_Chi_Minh');
        $expire = (clone $create)->addMinutes(15);

        $params = [
            'vnp_Version'    => $version,
            'vnp_Command'    => 'pay',
            'vnp_TmnCode'    => $tmn,
            'vnp_Amount'     => $amountVnd * 100, // nhân 100
            'vnp_CurrCode'   => $currency,
            'vnp_TxnRef'     => $txnRef,
            'vnp_OrderInfo'  => $orderInfo,
            'vnp_OrderType'  => 'other',
            'vnp_Locale'     => $locale,
            'vnp_IpAddr'     => self::ipv4(),
            'vnp_ReturnUrl'  => $retUrl,
            'vnp_CreateDate' => $create->format('YmdHis'),
            'vnp_ExpireDate' => $expire->format('YmdHis'),
        ];

        $hashData = self::buildHashData($params);
        $secure   = hash_hmac('sha512', $hashData, $secret);
        $full     = rtrim($payUrl, '?') . '?' . $hashData . '&vnp_SecureHash=' . $secure;

        Log::info('[VNP] send', [
            'tmn' => $tmn,
            'secret_len' => strlen($secret),
            'ip' => $params['vnp_IpAddr'],
            'amount' => $amountVnd,
            'txn' => $txnRef,
            'return' => $retUrl,
            'hashData' => $hashData,
            'secure' => $secure,
            'full' => $full,
        ]);

        return $full;
    }

    public static function verify(array $params): bool
    {
        $secret = config('vnpay.hash_secret');
        $hashData = self::buildHashData($params);
        $calc = hash_hmac('sha512', $hashData, $secret);
        $recv = $params['vnp_SecureHash'] ?? '';

        $ok = hash_equals(strtolower($calc), strtolower($recv));

        Log::info('[VNP] back', [
            'hashDataBack' => $hashData,
            'calc' => $calc,
            'recv' => $recv,
            'equal' => $ok,
            'vnp_ResponseCode' => $params['vnp_ResponseCode'] ?? null,
        ]);

        return $ok;
    }
}
