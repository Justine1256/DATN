<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Redis;

class PreventFrequentViews
{
    public function handle($request, Closure $next)
    {
        $productId = $request->route('id');
        $ip = $request->ip();
        $key = "product_viewed:{$productId}:{$ip}";

        if (Redis::exists($key)) {
            // Nếu IP này đã xem sản phẩm trong 1 phút
            return $next($request); // Cho phép tiếp tục nhưng không tăng view
        }

        // Đánh dấu đã xem và đặt thời gian sống 60 giây
        Redis::setex($key, 60, true);

        // Gửi thông tin cho controller để biết có thể tăng view
        $request->merge(['shouldCountView' => true]);

        return $next($request);
    }
}
