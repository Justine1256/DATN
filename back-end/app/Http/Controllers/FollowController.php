<?php

namespace App\Http\Controllers;

use App\Models\Follow;
use App\Models\Shop;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    // Theo dõi shop
    public function followShop(Request $request, $shopId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Bạn chưa đăng nhập.'], 403);
        }

        $alreadyFollowed = Follow::where('user_id', $user->id)
            ->where('shop_id', $shopId)
            ->exists();

        if ($alreadyFollowed) {
            return response()->json(['message' => 'Bạn đã theo dõi shop này.'], 409);
        }

        $follow = Follow::create([
            'user_id' => $user->id,
            'shop_id' => $shopId,
            'follow_date' => now(),
        ]);

        return response()->json([
            'message' => 'Đã theo dõi shop.',
            'follow' => $follow,
        ], 201);
    }

    // Bỏ theo dõi shop
    public function unfollowShop(Request $request, $shopId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Bạn chưa đăng nhập.'], 403);
        }

        $follow = Follow::where('user_id', $user->id)
            ->where('shop_id', $shopId)
            ->first();

        if (!$follow) {
            return response()->json(['message' => 'Bạn chưa theo dõi shop này.'], 404);
        }

        $follow->delete();

        return response()->json(['message' => 'Đã bỏ theo dõi shop.']);
    }

    // Lấy danh sách shop mà user đang theo dõi
    public function getFollowedShops(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Bạn chưa đăng nhập.'], 403);
        }

        $shops = $user->follows()->with('shop')->get()->pluck('shop');

        return response()->json(['shops' => $shops]);
    }
    public function getFollowersByShop($shopId)
{
    $shop = Shop::find($shopId);

    if (!$shop) {
        return response()->json(['status' => false, 'message' => 'Không tìm thấy shop.'], 404);
    }

    $followers = Follow::where('shop_id', $shopId)
        ->with('user:id,name,email,avatar') // tùy thuộc vào thông tin bạn cần hiển thị
        ->latest()
        ->get();

    return response()->json([
        'status' => true,
        'followers' => $followers
    ]);
}

}
