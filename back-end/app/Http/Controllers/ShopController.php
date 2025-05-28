<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use App\Models\Shop;


class ShopController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user->shop) {
            return response()->json([
                'message' => 'Bạn chưa có shop, vui lòng đăng ký.'
            ], 403); // 403 Forbidden hoặc 404 nếu cần
        }

        if (!session()->has('temporary_role')) {
            session(['temporary_role' => 'seller']);
            session(['shop_id' => $user->shop->id]);
        }

        return response()->json([
            'shop' => $user->shop,
            'message' => 'Truy cập dashboard thành công.'
        ], 200);
    }
    public function sendOtp(Request $request)
{
    $user = Auth::user();

    if ($user->shop) {
        return response()->json(['error' => 'Bạn đã có shop rồi!'], 400);
    }

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:100|unique:shops,name',
        'description' => 'required|string|max:255',
        'phone' => ['required', 'regex:/^0\d{9,19}$/'],
        'email' => 'required|email|max:100|unique:shops,email', // ✅ Đảm bảo email duy nhất
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $otp = rand(100000, 999999);

    // Lưu thông tin tạm vào cache trong 10 phút
    Cache::put('shop_otp_' . $user->id, [
        'otp' => $otp,
        'data' => $request->only(['name', 'description', 'phone', 'email']),
    ], now()->addMinutes(10));

    // Gửi email chứa OTP với xử lý lỗi
    try {
        Mail::raw("Mã OTP xác thực tạo shop của bạn là: $otp", function ($message) use ($request) {
            $message->to($request->email)->subject('Xác thực OTP tạo Shop');
        });
    } catch (\Exception $e) {
        return response()->json(['error' => 'Không thể gửi email OTP. Vui lòng thử lại sau.'], 500);
    }

    return response()->json([
        'message' => 'Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để xác nhận.'
    ]);
}


    public function confirmOtp(Request $request)
    {
        $user = Auth::user();

        if ($user->shop) {
            return response()->json(['error' => 'Bạn đã có shop rồi!'], 400);
        }

        $validator = Validator::make($request->all(), [
            'otp' => 'required|digits:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Lấy dữ liệu từ cache
        $cache = Cache::get('shop_otp_' . $user->id);

        if (!$cache) {
            return response()->json(['error' => 'Không tìm thấy thông tin tạo shop. Vui lòng thử lại.'], 400);
        }

        if ($request->otp != $cache['otp']) {
            return response()->json(['error' => 'OTP không đúng. Vui lòng kiểm tra và nhập lại.'], 400);
        }

        $shopData = $cache['data'];

        $shop = Shop::create([
            'user_id' => $user->id,
            'name' => $shopData['name'],
            'description' => $shopData['description'],
            'phone' => $shopData['phone'],
            'email' => $shopData['email'],
            'logo' => $user->avatar ?? 'uploads/shops/default-logo.png',
            'total_sales' => 0,
            'rating' => null,
            'status' => 'activated',
        ]);

        // Xoá cache sau khi tạo shop
        Cache::forget('shop_otp_' . $user->id);

        // (Không bắt buộc) Gán role tạm
        Session::put('temporary_role', 'seller');
        Session::put('shop_id', $shop->id);

        return response()->json([
            'message' => 'Tạo shop thành công!',
            'shop' => $shop,
        ]);
    }

    public function exitShop()
    {
        Session::forget('temporary_role');
        Session::forget('shop_id');

        return redirect('/');
    }
}
