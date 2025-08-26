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
use App\Models\OrderDetail;
use App\Models\Review;
use Illuminate\Support\Facades\Schema;

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

public function showShopInfo(Request $request, string $slug)
{
    $shop = Shop::where('slug', $slug)->first();

    if (!$shop) {
        return response()->json(['error' => 'Shop không tồn tại'], 404);
    }

    // 📦 Tổng đã bán
    $totalSales = OrderDetail::whereHas('order', function ($q) use ($shop) {
        $q->where('shop_id', $shop->id)
          ->where('order_status', 'Delivered');
    })->sum('quantity');

    // ⭐ Rating trung bình
    $avgRating = Review::whereHas('orderDetail.product', function ($q) use ($shop) {
        $q->where('shop_id', $shop->id);
    })->avg('rating');

    // 👥 Theo dõi — 1 trong 2 cách (tự chọn theo DB đang có)
    $userId = optional($request->user())->id;

    if (Schema::hasTable('follows')) {
        // Dùng bảng follows + quan hệ followRecords()
        $followersCount = $shop->followRecords()->count();
        $isFollowing    = $userId
            ? $shop->followRecords()->where('user_id', $userId)->exists()
            : false;
    } else {
        // Dùng pivot shop_user + quan hệ followers()
        $followersCount = $shop->followers()->count();
        $isFollowing    = $userId
            ? $shop->followers()->where('users.id', $userId)->exists()
            : false;
    }

    // ❌ Không save để tránh bẩn updated_at
    return response()->json([
        'shop' => [
            'id'              => $shop->id,
            'name'            => $shop->name,
            'slug'            => $shop->slug,
            'description'     => $shop->description,
            'logo'            => $shop->logo,
            'phone'           => $shop->phone,
            'email'           => $shop->email,
            'status'          => $shop->status,
            'created_at'      => $shop->created_at,
            'updated_at'      => $shop->updated_at,

            // Giá trị động
            'total_sales'     => (int) $totalSales,
            'rating'          => $avgRating !== null ? round((float) $avgRating, 1) : null,

            // 🔢 Số follower + trạng thái đã theo dõi (1 endpoint)
            'followers_count' => (int) $followersCount,
            'is_following'    => (bool) $isFollowing,
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
    // Subquery: tổng report theo shop
    $reportsSub = DB::table('reports')
        ->select('shop_id', DB::raw('COUNT(*) AS totalReports'))
        ->groupBy('shop_id');

    // Subquery: rating trung bình theo shop (chỉ lấy review approved)
    // reviews -> order_details (order_detail_id) -> orders (shop_id)
    $ratingsSub = DB::table('reviews AS rv')
        ->join('order_details AS od', 'od.id', '=', 'rv.order_detail_id')
        ->join('orders AS o', 'o.id', '=', 'od.order_id')
        ->where('rv.status', 'approved')
        ->select(
            'o.shop_id',
            DB::raw('AVG(rv.rating) AS rating_avg'),
            DB::raw('COUNT(*) AS rating_count')
        )
        ->groupBy('o.shop_id');

    $shops = DB::table('shops')
        ->leftJoin('users', 'shops.user_id', '=', 'users.id')
        ->leftJoinSub($reportsSub, 'r', function ($join) {
            $join->on('shops.id', '=', 'r.shop_id');
        })
        ->leftJoinSub($ratingsSub, 'rt', function ($join) {
            $join->on('shops.id', '=', 'rt.shop_id');
        })
        ->select(
            'shops.id AS shop_id',
            'shops.name AS shop_name',
            'shops.description',
            'shops.logo',
            'shops.address AS shop_address',
            'shops.is_verified',
            'shops.status AS shop_status',
            'shops.created_at AS shop_created_at',
            // dùng rating tính từ reviews; nếu chưa có thì 0
            DB::raw('IFNULL(rt.rating_avg, 0) AS rating_avg'),
            DB::raw('IFNULL(rt.rating_count, 0) AS rating_count'),

            'users.id AS owner_id',
            'users.name AS owner_name',
            'users.phone AS owner_phone',
            'users.email AS owner_email',
            'users.avatar AS owner_avatar',

            DB::raw('(SELECT COUNT(*) FROM products WHERE products.shop_id = shops.id) AS totalProducts'),
            DB::raw('(
                SELECT COUNT(*) FROM orders
                WHERE orders.shop_id = shops.id
                  AND orders.order_status = "Delivered"
                  AND orders.payment_status = "Completed"
            ) AS totalOrders'),
            DB::raw('(
                SELECT IFNULL(SUM(final_amount), 0) FROM orders
                WHERE orders.shop_id = shops.id
                  AND orders.order_status = "Delivered"
                  AND orders.payment_status = "Completed"
            ) AS totalRevenue'),
            DB::raw('IFNULL(r.totalReports, 0) AS totalReports')
        )
        ->get();

    $data = $shops->map(function ($shop) {
        // ✅ Xác định trạng thái cảnh báo
        $warningLevel = 'normal';
        $warningColor = 'green';

        if ((int)$shop->totalReports >= 10) {
            $warningLevel = 'danger';
            $warningColor = 'red';
        } elseif ((int)$shop->totalReports >= 5) {
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

            // ✅ rating lấy từ reviews (approved)
            'rating' => (float) round($shop->rating_avg ?? 0, 2),
            'ratingCount' => (int) ($shop->rating_count ?? 0),

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

    // Các trạng thái admin coi là "đã hủy"
    $cancelStatuses = [
        'Cancelled by Customer',
        'Cancelled by Seller',
        'Cancelled - Payment Failed',
        'Cancelled - Customer Refused Delivery',
    ];
    // chuẩn hoá so sánh (phòng DB dùng '–')
    $normalizeDash = function ($s) { return str_replace('–', '-', $s); };
    $cancelStatusesNorm = array_map($normalizeDash, $cancelStatuses);

    // Lấy danh sách user đã mua ở shop (distinct)
    $userIds = Order::where('shop_id', $shop->id)
        ->whereNotNull('user_id')
        ->distinct()
        ->pluck('user_id');

    $users = User::whereIn('id', $userIds)
        ->with('defaultAddress')
        ->get();

    $data = $users->map(function ($u) use ($shop, $cancelStatusesNorm, $normalizeDash) {
        // ======= Aggregates toàn bộ lịch sử (không load full list) =======
        $agg = Order::where('shop_id', $shop->id)
            ->where('user_id', $u->id)
            ->selectRaw('COUNT(*) as total_orders, COALESCE(SUM(final_amount),0) as total_spent, MAX(created_at) as last_order_at')
            ->first();

        // Đếm đơn đã hủy trên toàn bộ lịch sử
        $cancelledCount = Order::where('shop_id', $shop->id)
            ->where('user_id', $u->id)
            ->where(function ($q) use ($cancelStatusesNorm, $normalizeDash) {
                $q->where('order_status', 'Canceled')
                  ->orWhere(function ($q2) use ($cancelStatusesNorm, $normalizeDash) {
                      // so sánh theo biến thể dấu gạch nối
                      $q2->whereIn(\DB::raw("REPLACE(order_admin_status, '–', '-')"), $cancelStatusesNorm);
                  });
            })
            ->count();

        // ======= Chỉ lấy 3 đơn mới nhất để hiển thị chi tiết =======
        $recentOrders = Order::with(['orderDetails.product'])
            ->where('shop_id', $shop->id)
            ->where('user_id', $u->id)
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        // Tách trong 3 đơn này: đơn hủy & đơn đã giao
        $recentCancelled = $recentOrders->filter(function ($o) use ($cancelStatusesNorm, $normalizeDash) {
            return $o->order_status === 'Canceled'
                || in_array($normalizeDash($o->order_admin_status ?? ''), $cancelStatusesNorm, true);
        });

        $recentCompleted = $recentOrders->filter(function ($o) {
            return $o->order_status === 'Delivered';
        });

        // Map product cho từng order (trên tập 3 đơn)
        $mapProducts = function ($order) {
            return $order->orderDetails->map(function ($detail) {
                $firstImage = null;
                $images = $detail->product?->image;

                if (!is_array($images)) {
                    $decoded = json_decode($images ?? '[]', true);
                    if (is_array($decoded)) $images = $decoded;
                }
                if (is_array($images) && count($images) > 0) $firstImage = $images[0];

                return [
                    'id'            => $detail->product->id ?? null,
                    'name'          => $detail->product->name ?? null,
                    'price_at_time' => $detail->price_at_time,
                    'quantity'      => $detail->quantity,
                    'subtotal'      => $detail->subtotal,
                    'image'         => $firstImage,
                ];
            });
        };

        return [
            'user_id'          => $u->id,
            'name'             => $u->name,
            'email'            => $u->email,
            'phone'            => optional($u->defaultAddress)?->phone,
            'shipping_address' => optional($u->defaultAddress)?->full_address,
            'avatar'           => $u->avatar,

            // Tổng hợp toàn bộ lịch sử (không load hết)
            'total_orders'           => (int) ($agg->total_orders ?? 0),
            'total_spent'            => (float) ($agg->total_spent ?? 0),
            'last_order_at'          => $agg->last_order_at,
            'has_cancelled_order'    => $cancelledCount > 0,
            'cancelled_orders_count' => $cancelledCount,

            // Chỉ hiển thị chi tiết trong 3 đơn mới nhất
            'cancel_details' => $recentCancelled->map(function ($o) use ($mapProducts) {
                return [
                    'order_id'           => $o->id,
                    'cancel_reason'      => $o->cancel_reason,
                    'cancel_status'      => $o->cancel_status,
                    'canceled_at'        => $o->canceled_at,
                    'order_status'       => $o->order_status,
                    'order_admin_status' => $o->order_admin_status,
                    'payment_status'     => $o->payment_status,
                    'shipping_status'    => $o->shipping_status,
                    'products'           => $mapProducts($o),
                ];
            })->values(),

            'completed_orders' => $recentCompleted->map(function ($o) use ($mapProducts) {
                return [
                    'order_id'        => $o->id,
                    'delivered_at'    => $o->delivered_at,
                    'order_status'     => $o->order_status,
                    'payment_status'   => $o->payment_status,
                    'shipping_status'  => $o->shipping_status,
                    'products'         => $mapProducts($o),
                ];
            })->values(),
        ];
    });

    return response()->json([
        'data' => $data->values(),
    ]);
}

public function stats(Request $request)
{
    $user = Auth::user();
    $shopId = $user->shop->id ?? null;

    if (!$shopId) {
        return response()->json(['error' => 'Shop not found'], 404);
    }

    // Tổng doanh thu đơn hàng đã giao thành công
    $totalSales = DB::table('orders')
        ->where('shop_id', $shopId)
        ->where('order_status', 'Delivered')
        ->where('payment_status', 'Completed')
        ->sum('final_amount');

    // ✅ Tính commission (5%)
    $commission = round($totalSales * 0.05, 2);

    // Tổng số đơn hàng
    $totalOrders = DB::table('orders')
        ->where('shop_id', $shopId)
        ->count();

    // Đơn đã giao
    $completedOrders = DB::table('orders')
        ->where('shop_id', $shopId)
        ->where('order_status', 'Delivered')
        ->count();

    // Đơn đã huỷ
    $canceledOrders = DB::table('orders')
        ->where('shop_id', $shopId)
        ->where('order_status', 'Canceled')
        ->count();

    // Tổng sản phẩm đang bán
    $totalProducts = DB::table('products')
        ->where('shop_id', $shopId)
        ->where('status', 'activated')
        ->count();

    // Sản phẩm sắp hết hàng (tồn kho < 5)
    $lowStockProducts = DB::table('products')
        ->where('shop_id', $shopId)
        ->where('stock', '<', 5)
        ->count();

    // Sản phẩm bán chạy nhất
    $topSellingProducts = DB::table('products')
        ->where('shop_id', $shopId)
        ->orderByDesc('sold')
        ->limit(5)
        ->select('id', 'name', 'sold', 'stock')
        ->get();

    // ✅ Trung bình đánh giá shop tính từ reviews (approved)
    $averageRating = DB::table('reviews')
        ->join('order_details', 'reviews.order_detail_id', '=', 'order_details.id')
        ->join('products', 'order_details.product_id', '=', 'products.id')
        ->where('products.shop_id', $shopId)
        ->where('reviews.status', 'approved')
        ->avg('reviews.rating');

    // Tổng đánh giá
    $totalReviews = DB::table('reviews')
        ->join('order_details', 'reviews.order_detail_id', '=', 'order_details.id')
        ->join('products', 'order_details.product_id', '=', 'products.id')
        ->where('products.shop_id', $shopId)
        ->where('reviews.status', 'approved')
        ->count();

    // Tổng số người theo dõi
    $totalFollowers = DB::table('follows')
        ->where('shop_id', $shopId)
        ->count();

    // Doanh thu theo tháng (6 tháng gần nhất)
    $monthlyRevenue = DB::table('orders')
        ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(final_amount) as revenue")
        ->where('shop_id', $shopId)
        ->where('order_status', 'Delivered')
        ->where('payment_status', 'Completed')
        ->where('created_at', '>=', now()->subMonths(6))
        ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
        ->orderBy('month')
        ->get();

    return response()->json([
        'total_sales'      => round($totalSales, 2),
        'commission'       => $commission, // ✅ Thêm trường commission 5%
        'shop_revenue'     => round($totalSales - $commission, 2), // ✅ Doanh thu thực nhận của shop
        'total_orders'     => $totalOrders,
        'completed_orders' => $completedOrders,
        'canceled_orders'  => $canceledOrders,
        'total_products'   => $totalProducts,
        'low_stock_products' => $lowStockProducts,
        'top_selling_products' => $topSellingProducts,
        'average_rating'   => round($averageRating, 1),
        'total_reviews'    => $totalReviews,
        'total_followers'  => $totalFollowers,
        'monthly_revenue'  => $monthlyRevenue,
    ]);
}

    public function updateShopStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:activated,locked,hidden',
        ]);

        $shop = Shop::find($id);

        if (!$shop) {
            return response()->json(['message' => 'Shop không tồn tại'], 404);
        }

        $shop->status = $validated['status'];
        $shop->save();

        return response()->json([
            'message' => 'Cập nhật trạng thái shop thành công',
            'shop' => $shop
        ]);
    }
}

