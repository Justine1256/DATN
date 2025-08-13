<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Http\Request;
Route::get('/', function () {
    return view('welcome');
});


Route::get('/danh-muc-hien-thi', [CategoryController::class, 'viewList']);
Route::get('/phpinfo', function () {
    phpinfo();
});
Route::post('/broadcasting/auth', function (Request $request) {
    // Get token from Bearer header or cookie
    $token = $request->bearerToken() ?: $request->cookie('authToken');

    Log::info('Pusher auth attempt', [
        'headers' => $request->headers->all(),
        'cookie_authToken' => $request->cookie('authToken'),
        'bearer_present' => (bool) $request->bearerToken(),
        'token_value_truncated' => $token ? substr($token, 0, 10) . '...' : null,
        'channel_name_raw' => $request->input('channel_name'),
        'socket_id' => $request->input('socket_id'),
    ]);

    if (!$token) {
        return response()->json(['error' => 'Unauthorized - no token provided'], 401);
    }

    $pat = PersonalAccessToken::findToken($token);
    if (!$pat) {
        Log::warning('Pusher auth - PAT not found', ['token_sample' => substr($token, 0, 10)]);
        return response()->json(['error' => 'Unauthorized - invalid token'], 401);
    }

    $user = $pat->tokenable;
    Log::info('Pusher auth - tokenable', [
        'user_id' => $user->id ?? null,
        'user_obj' => $user ? $user->only(['id', 'email']) : null
    ]);

    $socketId = $request->input('socket_id');
    $channelName = trim((string)$request->input('channel_name', ''));

    if (str_starts_with($channelName, 'private-chat.')) {
        $userIdFromChannel = (int) str_replace('private-chat.', '', $channelName);
        if ((int)$user->id !== $userIdFromChannel) {
            Log::warning('Pusher auth - user id mismatch', [
                'authenticated_user_id' => $user->id,
                'channel_user_id' => $userIdFromChannel,
                'channelName' => $channelName,
            ]);
            return response()->json([
                'error' => 'Forbidden',
                'reason' => 'user_id_mismatch',
                'authenticated_user_id' => $user->id,
                'channel_user_id' => $userIdFromChannel,
            ], 403);
        }
    }

    $pusher = new \Pusher\Pusher(
        config('broadcasting.connections.pusher.key'),
        config('broadcasting.connections.pusher.secret'),
        config('broadcasting.connections.pusher.app_id'),
        config('broadcasting.connections.pusher.options')
    );

    $auth = $pusher->authorizeChannel($channelName, $socketId);
    return response()->json(json_decode($auth, true));
})->middleware(['web']);
