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
use Illuminate\Support\Facades\DB;

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
public function update(Request $request)
{
    $user = Auth::user();

    if (!$user->shop) {
        return response()->json(['error' => 'Bạn chưa có shop!'], 400);
    }

    $shop = $user->shop;

    $validator = Validator::make($request->all(), [
        'name' => 'sometimes|string|max:100|unique:shops,name,' . $shop->id,
        'description' => 'sometimes|string|max:255',
        'phone' => ['sometimes', 'regex:/^0\d{9}$/', 'unique:shops,phone,' . $shop->id],
        'email' => 'sometimes|email|max:100|unique:shops,email,' . $shop->id,
        'image' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:2048',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    if ($request->hasFile('image')) {
        $file = $request->file('image');
        $path = $file->store('shops', 'public');
        $shop->logo = json_encode([asset('storage/' . $path)]);
    }

    $shop->fill($request->only(['name', 'description', 'phone', 'email']));
    $shop->save();

    return response()->json(['message' => 'Cập nhật shop thành công!', 'shop' => $shop]);
}

    public function exitShop()
    {
        Session::forget('temporary_role');
        Session::forget('shop_id');

        return redirect('/');
    }

    public function showShopInfo($slug)
    {
        $shop = Shop::where('slug', $slug)->first();

        if (!$shop) {
            return response()->json(['error' => 'Shop không tồn tại'], 404);
        }
        // 📦 Tính tổng đã bán (Delivered)
        $totalSales = \App\Models\OrderDetail::whereHas('order', function ($q) use ($shop) {
            $q->where('shop_id', $shop->id)
                ->where('order_status', 'Delivered');
        })->sum('quantity');

        // ⭐ Tính rating động
        $avgRating = \App\Models\Review::whereHas('orderDetail.product', function ($q) use ($shop) {
            $q->where('shop_id', $shop->id);
        })->avg('rating');


        // 🎯 Ghi đè giá trị động lên model
        $shop->total_sales = $totalSales;
        $shop->rating = $avgRating ? round($avgRating, 1) : null;
        $shop->save();

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
    public function showAllShops(Request $request)
{
    $perPage = $request->input('per_page', 10);
    $page = $request->input('page', 1);
    $search = $request->input('search');

    $query = DB::table('shops')
        ->leftJoin('users', 'shops.user_id', '=', 'users.id')
        ->select(
            'shops.id as shop_id',
            'shops.name as shop_name',
            'shops.description',
            'shops.logo',
            'shops.banner',
            'shops.address as shop_address',
            'shops.category',
            'shops.is_verified',
            'shops.status as shop_status',
            'shops.created_at as shop_created_at',
            'shops.rating',
            'users.id as owner_id',
            'users.name as owner_name',
            'users.phone as owner_phone',
            'users.email as owner_email',
            'users.avatar as owner_avatar',
            'users.address as owner_address',
            'users.created_at as owner_created_at',
            'users.last_login as owner_last_login'
        );

    if (!empty($search)) {
        $query->where('shops.name', 'like', "%$search%");
    }

    $shops = $query
        ->orderBy('shops.created_at', 'desc')
        ->paginate($perPage, ['*'], 'page', $page);

    // Gắn thêm thống kê
    $shops->getCollection()->transform(function ($shop) {
        // Thống kê sản phẩm
        $totalProducts = DB::table('products')->where('shop_id', $shop->shop_id)->count();

        // Thống kê đơn hàng
        $totalOrders = DB::table('orders')->where('shop_id', $shop->shop_id)->count();
        $totalRevenue = DB::table('orders')
            ->where('shop_id', $shop->shop_id)
            ->where('order_status', 'Delivered')
            ->where('payment_status', 'Completed')
            ->sum('final_amount');

        $monthlyRevenue = DB::table('orders')
            ->where('shop_id', $shop->shop_id)
            ->where('order_status', 'Delivered')
            ->where('payment_status', 'Completed')
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('final_amount');

        // Tổng review
        $totalReviews = DB::table('reviews')->where('shop_id', $shop->shop_id)->count();

        // Đếm số vi phạm
        $violationCount = DB::table('reports')->where('shop_id', $shop->shop_id)->count();

        return [
            'id' => 'SHOP' . str_pad($shop->shop_id, 4, '0', STR_PAD_LEFT),
            'name' => $shop->shop_name,
            'description' => $shop->description ?? 'Chưa có mô tả',
            'logo' => $shop->logo ? asset('storage/' . $shop->logo) : '/placeholder.svg?height=40&width=40&text=S',
            'banner' => $shop->banner ? asset('storage/' . $shop->banner) : '/placeholder.svg?height=200&width=800&text=Banner',
            'owner' => [
                'id' => 'USER' . str_pad($shop->owner_id, 4, '0', STR_PAD_LEFT),
                'name' => $shop->owner_name,
                'phone' => $shop->owner_phone,
                'email' => $shop->owner_email,
                'avatar' => $shop->owner_avatar ? asset('storage/' . $shop->owner_avatar) : '/placeholder.svg?height=40&width=40&text=U',
                'address' => $shop->owner_address ?? '',
                'joinDate' => $shop->owner_created_at,
                'lastLogin' => $shop->owner_last_login
            ],
            'status' => $shop->shop_status === 'activated' ? 'active' : $shop->shop_status,
            'registrationDate' => $shop->shop_created_at,
            'totalProducts' => $totalProducts,
            'totalOrders' => $totalOrders,
            'totalRevenue' => (float)$totalRevenue,
            'monthlyRevenue' => (float)$monthlyRevenue,
            'rating' => (float)($shop->rating ?? 0),
            'totalReviews' => $totalReviews,
            'address' => $shop->shop_address ?? '',
            'category' => $shop->category ?? '',
            'isVerified' => (bool)$shop->is_verified,
            'violationCount' => $violationCount,
            'lastActive' => $shop->owner_last_login
        ];
    });

    return response()->json([
        'status' => true,
        'message' => 'Danh sách tất cả shop',
        'data' => $shops->items(),
        'pagination' => [
            'current_page' => $shops->currentPage(),
            'last_page' => $shops->lastPage(),
            'per_page' => $shops->perPage(),
            'total' => $shops->total(),
        ]
    ]);
}

}

