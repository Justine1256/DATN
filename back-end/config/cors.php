<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'broadcasting/auth',
    ],
    'allowed_methods' => ['*'],

    'allowed_origins' => [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://marketo.info.vn',
],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
