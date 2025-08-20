<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'openai' => [
    'key' => env('OPENAI_API_KEY'),
    'api_token' => env('GHN_API_TOKEN'),
    'api_url'   => 'https://online-gateway.ghn.vn/shiip/public-api',
],
'vnpay' => [
    'tmn_code'    => env('VNP_TMN_CODE'),
    'hash_secret' => env('VNP_HASH_SECRET'),
    'url'         => env('VNP_URL'),
    // 'return_url'  => env('VNP_RETURNURL'),
],

];
