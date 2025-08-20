<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class VnpayService
{
    private $vnp_TmnCode;
    private $vnp_HashSecret;
    private $vnp_Url;
    private $vnp_ReturnUrl;

    public function __construct()
    {
        $this->vnp_TmnCode = env('VNP_TMN_CODE');
        $this->vnp_HashSecret = env('VNP_HASH_SECRET');
        $this->vnp_Url = env('VNP_URL');
        $this->vnp_ReturnUrl = env('VNP_RETURNURL');
    }

    /**
     * Create VNPay payment URL
     */
    public function createPaymentUrl($orderIds, $amount, $orderInfo, $returnUrl = null, $customerInfo = [])
    {
        try {
            // Generate unique transaction reference
            $vnp_TxnRef = 'PMT' . date('YmdHis') . rand(1000, 9999);

            // Use custom return URL if provided, otherwise use default
            $actualReturnUrl = $returnUrl ?: $this->vnp_ReturnUrl;

            // Store order mapping in cache for 30 minutes
            $orderData = [
                'order_ids' => $orderIds,
                'customer_info' => $customerInfo,
                'created_at' => now()
            ];
            Cache::put("vnpay_txn_{$vnp_TxnRef}", $orderData, 30 * 60);

            // Build VNPay parameters
            $vnp_Params = [
                'vnp_Version' => '2.1.0',
                'vnp_Command' => 'pay',
                'vnp_TmnCode' => $this->vnp_TmnCode,
                'vnp_Amount' => $amount * 100, // VNPay expects amount in VND cents
                'vnp_CurrCode' => 'VND',
                'vnp_TxnRef' => $vnp_TxnRef,
                'vnp_OrderInfo' => $orderInfo,
                'vnp_OrderType' => 'other',
                'vnp_Locale' => 'vn',
                'vnp_ReturnUrl' => $actualReturnUrl,
                'vnp_IpAddr' => request()->ip(),
                'vnp_CreateDate' => date('YmdHis'),
                'vnp_ExpireDate' => date('YmdHis', strtotime('+15 minutes')),
                'vnp_SecureHashType' => 'HmacSHA512'
            ];

            // Generate secure hash
            $vnp_Params['vnp_SecureHash'] = $this->generateSecureHash($vnp_Params);

            // Build payment URL
            $paymentUrl = $this->vnp_Url . '?' . http_build_query($vnp_Params);

            Log::info('VNPay payment URL created', [
                'txn_ref' => $vnp_TxnRef,
                'amount' => $amount,
                'order_ids' => $orderIds,
                'return_url' => $actualReturnUrl
            ]);

            return [
                'payment_url' => $paymentUrl,
                'txn_ref' => $vnp_TxnRef
            ];

        } catch (\Exception $e) {
            Log::error('VNPay payment URL creation failed', [
                'error' => $e->getMessage(),
                'order_ids' => $orderIds,
                'amount' => $amount
            ]);
            throw $e;
        }
    }

    /**
     * Generate secure hash for VNPay parameters
     * CRITICAL: Exclude vnp_SecureHashType from signature generation
     */
    private function generateSecureHash($params)
    {
        // Remove vnp_SecureHash if exists (for verification)
        unset($params['vnp_SecureHash']);

        // IMPORTANT: Remove vnp_SecureHashType from signature generation
        // This is the key fix that resolves signature validation issues
        unset($params['vnp_SecureHashType']);

        // Sort parameters alphabetically by key
        ksort($params);

        // Build query string
        $queryString = '';
        foreach ($params as $key => $value) {
            if ($value !== null && $value !== '') {
                $queryString .= $key . '=' . urlencode($value) . '&';
            }
        }

        // Remove trailing &
        $queryString = rtrim($queryString, '&');

        // Append hash secret
        $stringToHash = $queryString . '&vnp_HashSecret=' . $this->vnp_HashSecret;

        // Generate HMAC-SHA512 hash and convert to UPPERCASE
        // This uppercase conversion is critical for VNPay validation
        $secureHash = strtoupper(hash_hmac('sha512', $stringToHash, $this->vnp_HashSecret));

        Log::debug('VNPay signature generation', [
            'query_string' => $queryString,
            'hash_input' => $stringToHash,
            'generated_hash' => $secureHash
        ]);

        return $secureHash;
    }

    /**
     * Verify VNPay return parameters
     */
    public function verifyReturnUrl($params)
    {
        try {
            if (!isset($params['vnp_SecureHash'])) {
                return [
                    'valid' => false,
                    'message' => 'Missing secure hash'
                ];
            }

            $providedHash = $params['vnp_SecureHash'];
            $calculatedHash = $this->generateSecureHash($params);

            $isValid = hash_equals($calculatedHash, $providedHash);

            Log::info('VNPay return verification', [
                'txn_ref' => $params['vnp_TxnRef'] ?? 'unknown',
                'response_code' => $params['vnp_ResponseCode'] ?? 'unknown',
                'valid' => $isValid,
                'provided_hash' => $providedHash,
                'calculated_hash' => $calculatedHash
            ]);

            return [
                'valid' => $isValid,
                'message' => $isValid ? 'Signature valid' : 'Invalid signature',
                'transaction_data' => $this->parseVnpayResponse($params)
            ];

        } catch (\Exception $e) {
            Log::error('VNPay verification failed', [
                'error' => $e->getMessage(),
                'params' => $params
            ]);

            return [
                'valid' => false,
                'message' => 'Verification error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Parse VNPay response parameters
     */
    private function parseVnpayResponse($params)
    {
        return [
            'txn_ref' => $params['vnp_TxnRef'] ?? null,
            'amount' => isset($params['vnp_Amount']) ? $params['vnp_Amount'] / 100 : null,
            'response_code' => $params['vnp_ResponseCode'] ?? null,
            'transaction_status' => $params['vnp_TransactionStatus'] ?? null,
            'transaction_no' => $params['vnp_TransactionNo'] ?? null,
            'bank_code' => $params['vnp_BankCode'] ?? null,
            'bank_tran_no' => $params['vnp_BankTranNo'] ?? null,
            'card_type' => $params['vnp_CardType'] ?? null,
            'order_info' => $params['vnp_OrderInfo'] ?? null,
            'pay_date' => $params['vnp_PayDate'] ?? null,
            'tmn_code' => $params['vnp_TmnCode'] ?? null
        ];
    }

    /**
     * Get VNPay response code message in Vietnamese
     */
    public function getResponseMessage($responseCode)
    {
        $messages = [
            '00' => 'Giao dịch thành công',
            '07' => 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
            '09' => 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
            '10' => 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11' => 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
            '12' => 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
            '13' => 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
            '24' => 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51' => 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
            '65' => 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
            '75' => 'Ngân hàng thanh toán đang bảo trì.',
            '79' => 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
            '99' => 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
        ];

        return $messages[$responseCode] ?? 'Lỗi không xác định';
    }

    /**
     * Get order data from cache using transaction reference
     */
    public function getOrderData($txnRef)
    {
        return Cache::get("vnpay_txn_{$txnRef}");
    }

    /**
     * Clear order data from cache
     */
    public function clearOrderData($txnRef)
    {
        Cache::forget("vnpay_txn_{$txnRef}");
    }
}
