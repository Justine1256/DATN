<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\Shop;
use Illuminate\Support\Str;
use App\Models\Product;

class ShopController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->shop) {
            return response()->json([
                'message' => 'Bạn chưa có shop, vui lòng đăng ký.'
            ], 403);
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
    /** @var \App\Models\User $user */
    $user = Auth::user();

    if ($user->shop) {
        return response()->json(['error' => 'Bạn đã có shop rồi!'], 400);
    }

    // Chống spam OTP
    if (Cache::has('shop_otp_sent_' . $user->id)) {
        return response()->json(['error' => 'Bạn vừa gửi OTP, vui lòng đợi 1 phút rồi thử lại.'], 429);
    }

    // Validate dữ liệu shop + image
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:100|unique:shops,name',
        'description' => 'required|string|max:255',
        'phone' => ['required', 'regex:/^0\d{9}$/', 'unique:shops,phone'],
        'email' => 'required|email|max:100|unique:shops,email',
        'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Upload logo nếu có
    $logoUrl = null;
    if ($request->hasFile('image')) {
        $file = $request->file('image');
        $path = $file->store('shops', 'public');
        $logoUrl = asset('storage/' . $path);
    }

    $otp = rand(100000, 999999);

    // Lưu data + otp + logo tạm thời vào cache
    Cache::put('shop_otp_' . $user->id, [
        'otp' => $otp,
        'data' => [
            'name' => $request->name,
            'description' => $request->description,
            'phone' => $request->phone,
            'email' => $request->email,
            'logo' => $logoUrl, // có thể null
        ],
    ], now()->addMinutes(10));

    Cache::put('shop_otp_sent_' . $user->id, true, now()->addMinute());

    // Gửi OTP
    try {
        Mail::raw("Mã OTP xác thực tạo shop của bạn là: $otp", function ($message) use ($request) {
            $message->to($request->email)->subject('Xác thực OTP tạo Shop');
        });
    } catch (\Exception $e) {
        Log::error("Gửi OTP shop thất bại: " . $e->getMessage());
        return response()->json(['error' => 'Không thể gửi email OTP. Vui lòng thử lại sau.'], 500);
    }

    return response()->json([
        'message' => 'Mã OTP đã được gửi đến email của bạn. Vui lòng nhập mã để xác nhận.'
    ]);
}

    public function confirmOtp(Request $request)
{
    /** @var \App\Models\User $user */
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
        'slug' => Str::slug($shopData['name']),
        'description' => $shopData['description'],
        'phone' => $shopData['phone'],
        'email' => $shopData['email'],
        'logo' => json_encode([
            $shopData['logo'] ?? $user->avatar ?? asset('uploads/shops/default-logo.png')
        ]),
        'total_sales' => 0,
        'rating' => null,
        'status' => 'activated',
    ]);

    $user->role = 'seller';
    $user->save();

    Cache::forget('shop_otp_' . $user->id);
    Cache::forget('shop_otp_sent_' . $user->id);

    return response()->json([
        'message' => 'Tạo shop thành công! Bạn đã trở thành người bán.',
        'shop' => $shop,
    ]);
}


    public function exitShop()
    {
        Session::forget('temporary_role');
        Session::forget('shop_id');

        return redirect('/');
    }

public function showShopInfo($slug)
{
    $shop = Shop::where('slug', $slug)->withCount('followRecords')->first();

    if (!$shop) {
        return response()->json(['error' => 'Shop không tồn tại'], 404);
    }

    return response()->json([
        'shop' => [
            'id' => $shop->id,
            'name' => $shop->name,
            'slug' => $shop->slug,
            'description' => $shop->description,
            'logo' => $shop->logo,
            'phone' => $shop->phone,
            'email' => $shop->email,
            'total_sales' => $shop->total_sales,
            'rating' => $shop->rating,
            'status' => $shop->status,
            'created_at' => $shop->created_at,
            'updated_at' => $shop->updated_at,
            'followers_count' => $shop->follow_records_count,
        ]
    ]);
}
    public function getShopProducts($slug)
    {
        $shop = Shop::where('slug', $slug)->first();

        if (!$shop) {
            return response()->json(['error' => 'Shop không tồn tại'], 404);
        }

        $products = Product::where('shop_id', $shop->id)
            ->where('status', 'activated')
            ->latest()
            ->paginate(12);

        return response()->json([
            'shop' => $shop->only(['id', 'name', 'slug', 'logo']),
            'products' => $products->through(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'price' => $product->price,
                    'sale_price' => $product->sale_price,
                    'image' => $product->image[0] ?? null,
                    'stock' => $product->stock,
                    'rating' => $product->rating,
                ];
            }),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ]
        ]);
    }
}
