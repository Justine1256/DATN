<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\User;
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
    $shops = DB::table('shops')
        ->leftJoin('users', 'shops.user_id', '=', 'users.id')
        ->leftJoin(DB::raw('(SELECT shop_id, COUNT(*) as totalReports FROM reports GROUP BY shop_id) as r'), 'shops.id', '=', 'r.shop_id')
        ->select(
            'shops.id as shop_id',
            'shops.name as shop_name',
            'shops.description',
            'shops.logo',
            'shops.address as shop_address',
            'shops.is_verified',
            'shops.status as shop_status',
            'shops.created_at as shop_created_at',
            'shops.rating',
            'users.id as owner_id',
            'users.name as owner_name',
            'users.phone as owner_phone',
            'users.email as owner_email',
            'users.avatar as owner_avatar',
            DB::raw('(SELECT COUNT(*) FROM products WHERE products.shop_id = shops.id) as totalProducts'),
            DB::raw('(SELECT COUNT(*) FROM orders WHERE orders.shop_id = shops.id AND orders.order_status = "Delivered" AND orders.payment_status = "Completed") as totalOrders'),
            DB::raw('(SELECT IFNULL(SUM(final_amount), 0) FROM orders WHERE orders.shop_id = shops.id AND orders.order_status = "Delivered" AND orders.payment_status = "Completed") as totalRevenue'),
            DB::raw('IFNULL(r.totalReports, 0) as totalReports')
        )
        ->get();

    $data = $shops->map(function ($shop) {
        // ✅ Xác định trạng thái cảnh báo
        $warningLevel = 'normal';
        $warningColor = 'green';

        if ($shop->totalReports >= 10) {
            $warningLevel = 'danger';
            $warningColor = 'red';
        } elseif ($shop->totalReports >= 5) {
            $warningLevel = 'warning';
            $warningColor = 'yellow';
        }

        return [
            'id' => 'SHOP' . str_pad($shop->shop_id, 4, '0', STR_PAD_LEFT),
            'name' => $shop->shop_name,
            'description' => $shop->description ?? '',
            'logo' => $shop->logo ? asset('storage/' . $shop->logo) : '/placeholder.svg?height=40&width=40&text=S',
            'address' => $shop->shop_address ?? '',
            'isVerified' => (bool)$shop->is_verified,
            'status' => $shop->shop_status,
            'registrationDate' => $shop->shop_created_at,
            'rating' => (float)$shop->rating,
            'totalProducts' => (int)$shop->totalProducts,
            'totalOrders' => (int)$shop->totalOrders,
            'totalRevenue' => (float)$shop->totalRevenue,
            'totalReports' => (int)$shop->totalReports,
            'warningStatus' => [
                'level' => $warningLevel,
                'color' => $warningColor
            ],
            'owner' => [
                'id' => 'USER' . str_pad($shop->owner_id, 4, '0', STR_PAD_LEFT),
                'name' => $shop->owner_name,
                'phone' => $shop->owner_phone,
                'email' => $shop->owner_email,
                'avatar' => $shop->owner_avatar ? asset('storage/' . $shop->owner_avatar) : '/placeholder.svg?height=40&width=40&text=U',
            ]
        ];
    });

    // ✅ Sắp xếp: Doanh thu -> Rating -> Tên (A-Z)
    $sortedData = $data->sort(function ($a, $b) {
        if ($a['totalRevenue'] === $b['totalRevenue']) {
            if ($a['rating'] === $b['rating']) {
                return strcmp($a['name'], $b['name']);
            }
            return $b['rating'] <=> $a['rating'];
        }
        return $b['totalRevenue'] <=> $a['totalRevenue'];
    })->values();

    return response()->json([
        'status' => true,
        'message' => 'Danh sách cửa hàng',
        'data' => $sortedData
    ]);
}


    public function applyShop(Request $request)
    {
        // Validate dữ liệu gửi lên
        $request->validate([
            'shop_id' => 'required|integer|exists:shops,id'
        ]);

        $shopId = $request->input('shop_id');

        // Update trạng thái is_verified = 1
        $updated = DB::table('shops')
            ->where('id', $shopId)
            ->update(['is_verified' => 1]);

        if ($updated) {
            return response()->json([
                'status' => true,
                'message' => 'Shop đã được phê duyệt thành công.',
                'shop_id' => $shopId
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không thể phê duyệt shop. Vui lòng thử lại sau.'
        ], 500);
    }
public function getMyShopCustomers(Request $request)
{
    $user = Auth::user();
    $shop = $user->shop;

    if (!$shop) {
        return response()->json(['message' => 'Bạn chưa sở hữu shop nào.'], 403);
    }

    $cancelStatuses = [
        'Cancelled by Customer',
        'Cancelled by Seller',
        'Cancelled - Payment Failed',
        'Cancelled - Customer Refused Delivery'
    ];

    $userIds = Order::where('shop_id', $shop->id)
        ->whereNotNull('user_id')
        ->distinct()
        ->pluck('user_id');

    $users = User::whereIn('id', $userIds)
        ->with('defaultAddress')
        ->get();

    $data = $users->map(function ($user) use ($shop, $cancelStatuses) {
        $orders = Order::where('shop_id', $shop->id)
            ->where('user_id', $user->id)
            ->get();

        $cancelledOrders = $orders->filter(function ($order) use ($cancelStatuses) {
            return $order->order_status === 'Canceled' ||
                   in_array($order->order_admin_status, $cancelStatuses);
        });

        $completedOrders = $orders->filter(function ($order) {
            return $order->order_status === 'Delivered';
        });

        return [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => optional($user->defaultAddress)?->phone,
            'shipping_address' => optional($user->defaultAddress)?->full_address,
            'total_orders' => $orders->count(),
            'total_spent' => $orders->sum('final_amount'),
            'last_order_at' => optional($orders->sortByDesc('created_at')->first())->created_at,
            'has_cancelled_order' => $cancelledOrders->isNotEmpty(),
            'cancelled_orders_count' => $cancelledOrders->count(),

            // Đơn hủy
            'cancel_details' => $cancelledOrders->map(function ($order) {
                $order->loadMissing('orderDetails.product');

                $products = $order->orderDetails->map(function ($detail) {
                    $firstImage = null;

                    if (!empty($detail->product?->image)) {
                        $images = $detail->product->image;

                        if (!is_array($images)) {
                            $decoded = json_decode($images, true);
                            if (is_array($decoded)) {
                                $images = $decoded;
                            }
                        }

                        if (is_array($images) && count($images) > 0) {
                            $firstImage = $images[0];
                        }
                    }

                    return [
                        'id' => $detail->product->id ?? null,
                        'name' => $detail->product->name ?? null,
                        'price_at_time' => $detail->price_at_time,
                        'quantity' => $detail->quantity,
                        'subtotal' => $detail->subtotal,
                        'image' => $firstImage,
                    ];
                });

                return [
                    'order_id' => $order->id,
                    'cancel_reason' => $order->cancel_reason,
                    'canceled_at' => $order->canceled_at,
                    'order_status' => $order->order_status,
                    'order_admin_status' => $order->order_admin_status,
                    'payment_status' => $order->payment_status,
                    'shipping_status' => $order->shipping_status,
                    'products' => $products,
                ];
            })->values(),

            // Đơn đã giao thành công
            'completed_orders' => $completedOrders->map(function ($order) {
                $order->loadMissing('orderDetails.product');

                $products = $order->orderDetails->map(function ($detail) {
                    $firstImage = null;

                    if (!empty($detail->product?->image)) {
                        $images = $detail->product->image;

                        if (!is_array($images)) {
                            $decoded = json_decode($images, true);
                            if (is_array($decoded)) {
                                $images = $decoded;
                            }
                        }

                        if (is_array($images) && count($images) > 0) {
                            $firstImage = $images[0];
                        }
                    }

                    return [
                        'id' => $detail->product->id ?? null,
                        'name' => $detail->product->name ?? null,
                        'price_at_time' => $detail->price_at_time,
                        'quantity' => $detail->quantity,
                        'subtotal' => $detail->subtotal,
                        'image' => $firstImage,
                    ];
                });

                return [
                    'order_id' => $order->id,
                    'delivered_at' => $order->delivered_at,
                    'order_status' => $order->order_status,
                    'payment_status' => $order->payment_status,
                    'shipping_status' => $order->shipping_status,
                    'products' => $products,
                ];
            })->values(),
        ];
    });

    return response()->json([
        'data' => $data
    ]);
}

}

