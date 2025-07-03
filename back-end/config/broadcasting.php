<?php
return [
'pusher' => [
        'driver' => 'pusher',
        'key' => env('key-0b14c3b7df414a209cf9f13e'),
        'secret' => env('secret-f3a6918ce0c743a9b1b5aa29'),
        'app_id' => env('app-719dfb99'),
        'options' => [
            'cluster' => env('PUSHER_APP_CLUSTER'),
            'useTLS' => false,
            'host' => env('PUSHER_HOST', '127.0.0.1'),
            'port' => env('PUSHER_PORT', 6001),
            'scheme' => env('PUSHER_SCHEME', 'http'),
        ],
    ],
];
