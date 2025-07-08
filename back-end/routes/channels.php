<?php
// routes/channels.php
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

// Kiểm tra quyền truy cập của người dùng vào kênh
Broadcast::channel('private-chat.{user1}.{user2}', function ($user, $user1, $user2) {
    // Xác thực quyền truy cập vào kênh chat
    return $user->id === (int)$user1 || $user->id === (int)$user2;
});
