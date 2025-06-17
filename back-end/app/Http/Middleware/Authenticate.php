<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    protected function redirectTo($request)
{
    // Nếu request không phải ajax/json thì redirect, còn không trả về null (tức là lỗi 401)
    if (!$request->expectsJson()) {
        // Nếu bạn không có route login, có thể trả về null hoặc 401
        // hoặc trả về URL nào đó bạn có
        // return route('login'); // bỏ dòng này đi
        return null;
    }
}

}
