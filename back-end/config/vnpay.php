<?php

return [
    'tmn_code'    => env('VNP_TMN_CODE', ''),
    'hash_secret' => env('VNP_HASH_SECRET', ''),
    'pay_url'     => env('VNP_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    'return_url'  => env('VNP_RETURNURL', 'http://localhost:3000/checkout/result'),
];
