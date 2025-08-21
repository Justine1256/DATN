<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VnpayService
{
    private static function phpUrlEncode(string $v): string
    {
        // PHP urlencode chuẩn RFC1738 đã OK; viết riêng chỉ để nhấn mạnh không dùng rawurlencode
        return urlencode($v);
    }

    private static function buildHashData(array $params): string
    {
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);
        ksort($params);

        $hashData = '';
        foreach ($params as $key => $value) {
            $hashData .= ($hashData ? '&' : '') . $key . '=' . self::phpUrlEncode((string)$value);
        }
        return $hashData;
    }

    private static function clientIpv4(): string
    {
        // Lấy IPv4 an toàn; nếu là ::1 thì trả 127.0.0.1
        $ip = request()->ip();
        if ($ip === '::1' || $ip === '0:0:0:0:0:0:0:1') return '127.0.0.1';

        // Nếu là IPv6 dạng ::ffff:1.2.3.4 thì tách IPv4
        if (str_contains($ip, ':') && preg_match('/::ffff:(\d+\.\d+\.\d+\.\d+)/', $ip, $m)) {
            return $m[1];
        }
        // Nếu vẫn là IPv6, trả về 127.0.0.1 cho chắc
        if (str_contains($ip, ':')) return '127.0.0.1';
        return $ip ?: '127.0.0.1';
    }

    private static function sanitizeOrderInfo(?string $s): string
    {
        $s = (string)($s ?? '');
        // Loại emoji/ký tự không phải BMP để tránh cổng từ chối
        $s = preg_replace('/[\x{10000}-\x{10FFFF}]/u', '', $s) ?? '';
        // Giới hạn độ dài hợp lý (VD 255)
        return Str::limit($s, 255, '');
    }

    private static function makeTxnRef(?string $given): string
    {
        // vnp_TxnRef: tối đa 34 ký tự, chỉ nên dùng A-Z a-z 0-9 _ - .
        if ($given) {
            $ref = preg_replace('/[^A-Za-z0-9_.-]/', '', $given) ?? '';
            return Str::limit($ref, 34, '');
        }
        $base = 'PMT' . now('Asia/Ho_Chi_Minh')->format('YmdHis') . strtoupper(Str::random(6));
        return Str::limit($base, 34, '');
    }

    public static function createPaymentUrl(array $payload): string
    {
        $tmnCode    = config('vnpay.tmn_code');
        $secret     = config('vnpay.hash_secret');
        $payUrl     = config('vnpay.pay_url');
        $returnUrl  = config('vnpay.return_url');
        $locale     = config('vnpay.locale', 'vn');
        $currency   = 'VND';
        $version    = '2.1.0';

        // ===== Sanitize & validate input =====
        $amountVnd = (int)($payload['amount'] ?? 0);
        if ($amountVnd < 10000) { // đề phòng biên nhỏ khiến cổng từ chối
            $amountVnd = 10000;
        }

        $txnRef    = self::makeTxnRef($payload['orderId'] ?? null);
        $orderInfo = self::sanitizeOrderInfo($payload['orderInfo'] ?? ('Thanh toan don hang: ' . $txnRef));
        $ipAddr    = self::clientIpv4();

        $create = now('Asia/Ho_Chi_Minh');
        $expire = (clone $create)->addMinutes(15);

        $input = [
            'vnp_Version'    => $version,
            'vnp_Command'    => 'pay',
            'vnp_TmnCode'    => $tmnCode,
            'vnp_Amount'     => $amountVnd * 100, // nhân 100
            'vnp_CurrCode'   => $currency,
            'vnp_TxnRef'     => $txnRef,
            'vnp_OrderInfo'  => $orderInfo,
            'vnp_OrderType'  => 'other',
            'vnp_Locale'     => $locale,
            'vnp_IpAddr'     => $ipAddr,
            'vnp_ReturnUrl'  => $returnUrl,
            'vnp_CreateDate' => $create->format('YmdHis'),
            'vnp_ExpireDate' => $expire->format('YmdHis'),
        ];

        if (config('vnpay.ipn_url')) {
            $input['vnp_IpnUrl'] = config('vnpay.ipn_url');
        }

        $hashData = self::buildHashData($input);
        $secure   = hash_hmac('sha512', $hashData, $secret);

        $query = $hashData . '&vnp_SecureHash=' . $secure;
        $full  = rtrim($payUrl, '?') . '?' . $query;

        Log::info('[VNP] send', [
            'tmn'      => $tmnCode,
            'amount'   => $amountVnd,
            'txnRef'   => $txnRef,
            'ip'       => $ipAddr,
            'hashData' => $hashData,
            'secure'   => $secure,
            'full'     => $full,
        ]);

        return $full;
    }

    public static function verify(array $params): bool
    {
        $secret   = config('vnpay.hash_secret');
        $hashData = self::buildHashData($params);
        $calc     = hash_hmac('sha512', $hashData, $secret);
        $recv     = $params['vnp_SecureHash'] ?? '';

        Log::info('[VNP] back', [
            'hashDataBack' => $hashData,
            'calc'         => $calc,
            'recv'         => $recv,
            'equal'        => hash_equals(strtolower($calc), strtolower($recv)),
            'vnp_ResponseCode' => $params['vnp_ResponseCode'] ?? null,
        ]);

        return hash_equals(strtolower($calc), strtolower($recv));
    }
}
