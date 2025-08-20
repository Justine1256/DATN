<?php

namespace App\Services;

class VnpayService
{
    private $vnp_TmnCode;
    private $vnp_HashSecret;
    private $vnp_Url;

    public function __construct()
    {
        $this->vnp_TmnCode = env('VNP_TMN_CODE');
        $this->vnp_HashSecret = env('VNP_HASH_SECRET');
        $this->vnp_Url = env('VNP_URL');
    }

    public function createPaymentUrl($data)
    {
        $vnp_Params = [
            'vnp_Version' => '2.1.0',
            'vnp_Command' => 'pay',
            'vnp_TmnCode' => $this->vnp_TmnCode,
            'vnp_Amount' => $data['amount'] * 100,
            'vnp_CurrCode' => 'VND',
            'vnp_TxnRef' => $data['txn_ref'],
            'vnp_OrderInfo' => $data['order_info'],
            'vnp_OrderType' => 'other',
            'vnp_Locale' => 'vn',
            'vnp_ReturnUrl' => $data['return_url'],
            'vnp_IpAddr' => $data['ip_addr'],
            'vnp_CreateDate' => date('YmdHis'),
            'vnp_ExpireDate' => date('YmdHis', strtotime('+15 minutes')),
        ];

        // Sort parameters alphabetically
        ksort($vnp_Params);

        // Create query string (exclude vnp_SecureHashType from signature generation)
        $query = http_build_query($vnp_Params);

        // Generate signature using HMAC-SHA512
        $vnp_SecureHash = hash_hmac('sha512', $query, $this->vnp_HashSecret);

        $vnp_SecureHash = strtoupper($vnp_SecureHash);

        // Add signature to parameters
        $vnp_Params['vnp_SecureHashType'] = 'HmacSHA512';
        $vnp_Params['vnp_SecureHash'] = $vnp_SecureHash;

        // Build final URL
        $paymentUrl = $this->vnp_Url . '?' . http_build_query($vnp_Params);

        return $paymentUrl;
    }

    public function validateSignature($vnpayData)
    {
        $vnp_SecureHash = $vnpayData['vnp_SecureHash'];
        unset($vnpayData['vnp_SecureHash']);
        unset($vnpayData['vnp_SecureHashType']); // Exclude from validation

        ksort($vnpayData);
        $query = http_build_query($vnpayData);

        $expectedHash = hash_hmac('sha512', $query, $this->vnp_HashSecret);
        $expectedHash = strtoupper($expectedHash);

        return hash_equals($expectedHash, $vnp_SecureHash);
    }
}
