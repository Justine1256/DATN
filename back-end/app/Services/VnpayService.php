<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class VnpayService
{
    public static function createPaymentUrl(array $payload): string
    {
        $vnp_Url        = rtrim(env('VNP_URL'), '/');
        $vnp_TmnCode    = env('VNP_TMN_CODE');
        $vnp_HashSecret = trim((string) env('VNP_HASH_SECRET')); // TRIM tránh ký tự ẩn

        // txnRef duy nhất, bạn có thể giữ cách cũ nếu muốn
        $txnRef = 'PMT' . now()->format('YmdHis') . random_int(1000, 9999);

        // Lưu map txnRef -> orders để return/ipn đọc
        Cache::put("vnp:{$txnRef}", [
            'user_id'   => $payload['user_id'] ?? null,
            'order_ids' => $payload['order_ids'] ?? [],
            'amount'    => (int) ($payload['amount'] ?? 0),
        ], now()->addMinutes(30));

        // VNP yêu cầu amount * 100 (số nguyên)
        $vnp_Amount = (int) round(((int)($payload['amount'] ?? 0)) * 100);

        // Dùng URL tuyệt đối (absolute) cho return
        $returnUrl = $payload['return_url'] ?? route('vnpay.return', [], true);

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
            'vnp_ReturnUrl'  => $returnUrl,      // GIỮ NGUYÊN, KHÔNG encode ở hash
            'vnp_TxnRef'     => $txnRef,
            'vnp_ExpireDate' => now()->addMinutes(15)->format('YmdHis'),
        ];

        // Sắp xếp KEY
        ksort($params);

        // 1) hashData: KHÔNG urlencode
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

        return $vnp_Url.'?'.$query.'&vnp_SecureHash='.$secureHash;
    }

    public static function verifyHash(array $params): bool
    {
        $vnp_HashSecret = trim((string) env('VNP_HASH_SECRET'));

        $secureHash = $params['vnp_SecureHash'] ?? '';
        unset($params['vnp_SecureHash'], $params['vnp_SecureHashType']);

        ksort($params);

        // KHÔNG urlencode khi verify
        $hashData = implode('&', array_map(
            fn($k,$v) => $k.'='.$v,
            array_keys($params), $params
        ));

        $calc = hash_hmac('sha512', $hashData, $vnp_HashSecret);

        // so sánh không phân biệt hoa/thường
        return hash_equals(strtolower($calc), strtolower($secureHash));
    }
}
