<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('private-chat.{userId}', function ($user, $userId) {
    // User can only access their own private chat channel
    return $user->id === (int)$userId;
});
