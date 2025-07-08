<?php
//routes/channels.php

use Illuminate\Support\Facades\Broadcast;
Broadcast::routes(['middleware' => ['auth:sanctum']]);
Broadcast::channel('private-chat.{user1}.{user2}', function ($user, $user1, $user2) {
    return in_array($user->id, [(int)$user1, (int)$user2]);
});



