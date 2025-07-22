<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Address;
use App\Models\Voucher;
use App\Services\VnpayService as ServicesVnpayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Notification;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $orders = Order::where('user_id', $userId)
            ->with(['orderDetails.product', 'shop'])
            ->latest()
            ->get()
            ->map(function ($order) {
                $orderDetails = $order->orderDetails->map(function ($detail) {
                    $detail->reviewed = \App\Models\Review::where('order_detail_id', $detail->id)->exists();
                    return $detail;
                });

                return [
                    'id' => $order->id,
                    'user_id' => $order->user_id,
                    'shop_name' => $order->shop->name ?? null,
                    'final_amount' => $order->final_amount,
                    'total_amount' => $order->total_amount,
                    'payment_method' => $order->payment_method,
                    'payment_status' => $order->payment_status,
                    'transaction_id' => $order->transaction_id,
                    'order_status' => $order->order_status,
                    'cancel_status' => $order->cancel_status,
                    'cancel_reason' => $order->cancel_reason,
                    'shipping_status' => $order->shipping_status,
                    'shipping_address' => $order->shipping_address,
                    'created_at' => $order->created_at,
                    'updated_at' => $order->updated_at,
                    'order_details' => $orderDetails, // ✅ đã gắn thêm reviewed
                ];
            });

        return response()->json([
            'orders' => $orders
        ]);
    }

    public function checkout(Request $request)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'payment_method' => 'required|in:cod,vnpay',
            'voucher_code' => 'nullable|string',
            'address_id' => 'nullable|exists:addresses,id',
            'address_manual' => 'nullable|array',
            'address_manual.full_name' => 'required_with:address_manual|string',
            'address_manual.address' => 'required_with:address_manual|string',
            'address_manual.city' => 'required_with:address_manual|string',
            'address_manual.phone' => 'required_with:address_manual|string',
            'address_manual.email' => 'required_with:address_manual|email',
        ]);

        if (empty($validated['address_id']) && empty($validated['address_manual'])) {
            return response()->json(['message' => 'Phải chọn địa chỉ có sẵn hoặc nhập địa chỉ mới'], 422);
        }

$carts = Cart::query()
    ->select(['id', 'product_id', 'variant_id', 'product_option', 'product_value', 'quantity'])
    ->with('product')
    ->where('user_id', $userId)
    ->where('is_active', true)
    ->get();
        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Giỏ hàng trống'], 400);
        }

        DB::beginTransaction();
        try {
            // Địa chỉ giao hàng
            $fullAddress = '';
            if (!empty($validated['address_id'])) {
                $address = Address::where('user_id', $userId)->findOrFail($validated['address_id']);
                $fullAddress = "{$address->address}, {$address->ward}, {$address->district}, {$address->city}";
            } elseif (!empty($validated['address_manual'])) {
                $manual = $validated['address_manual'];
                $fullAddress = "{$manual['address']}, {$manual['city']} ({$manual['full_name']} - {$manual['phone']})";
            }

            // Tính tổng đơn hàng ban đầu
            $subtotalAll = 0;
            foreach ($carts as $cart) {
                $subtotalAll += $cart->quantity * $cart->product->price;
            }

            // Áp dụng voucher nếu có
            $discountAmount = 0;
            $voucher = null;
            $subtotalApplicable = $subtotalAll;

            if (!empty($validated['voucher_code'])) {
                $voucher = Voucher::where('code', $validated['voucher_code'])
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now())
                    ->first();

                if (!$voucher) return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
                if ($voucher->usage_limit && $voucher->usage_count >= $voucher->usage_limit) return response()->json(['message' => 'Mã giảm giá đã được sử dụng hết lượt'], 400);

                $userVoucherCount = DB::table('voucher_users')->where('voucher_id', $voucher->id)->count();
                if ($userVoucherCount > 0) {
                    $userVoucherExists = DB::table('voucher_users')
                        ->where('voucher_id', $voucher->id)
                        ->where('user_id', $userId)->exists();

                    if (!$userVoucherExists) return response()->json(['message' => 'Mã giảm giá không dành cho bạn'], 400);
                }

                $applicableCategoryIds = DB::table('voucher_categories')->where('voucher_id', $voucher->id)->pluck('category_id')->toArray();
                if (count($applicableCategoryIds) > 0) {
                    $subtotalApplicable = 0;
                    foreach ($carts as $cart) {
                        if (in_array($cart->product->category_id, $applicableCategoryIds)) {
                            $subtotalApplicable += $cart->quantity * $cart->product->price;
                        }
                    }
                    if ($subtotalApplicable < $voucher->min_order_value) return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 400);
                } else {
                    if ($subtotalApplicable < $voucher->min_order_value) return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 400);
                }

                if ($voucher->discount_type === 'percent') {
                    $discountAmount = min(
                        $voucher->discount_value / 100 * $subtotalApplicable,
                        $voucher->max_discount_value ?? $subtotalApplicable
                    );
                } else {
                    $discountAmount = min($voucher->discount_value, $subtotalApplicable);
                }
            }

            $cartsByShop = $carts->groupBy(fn($cart) => $cart->product->shop_id);
            $orders = [];
            $totalFinalAmount = 0;

            foreach ($cartsByShop as $shopId => $shopCarts) {
                $shopTotalAmount = 0;

                foreach ($shopCarts as $cart) {
    $product = $cart->product;

    // Load variant từ DB nếu có variant_id
    $variant = $cart->variant_id ? ProductVariant::find($cart->variant_id) : null;

    // Tính giá tại thời điểm
    $priceAtTime = $variant
        ? ($variant->sale_price ?? $variant->price)
        : ($product->sale_price ?? $product->price);

    // Kiểm tra tồn kho
    if ($variant) {
        if ($cart->quantity > $variant->stock) {
            throw new \Exception("Biến thể {$variant->value1} - {$variant->value2} không đủ kho");
        }
        $variant->decrement('stock', $cart->quantity);
    } else {
        if ($cart->quantity > $product->stock) {
            throw new \Exception("Sản phẩm {$product->name} không đủ kho");
        }
        $product->decrement('stock', $cart->quantity);
    }

    $shopTotalAmount += $cart->quantity * $priceAtTime;

    $order = Order::create([
        'user_id' => $userId,
        'shop_id' => $shopId,
        'total_amount' => $shopTotalAmount,
        'final_amount' => $shopTotalAmount,
        'payment_method' => $validated['payment_method'],
        'payment_status' => 'Pending',
        'order_status' => 'Pending',
        'shipping_status' => 'Pending',
        'shipping_address' => $fullAddress,
    ]);

    // Dữ liệu biến thể từ cart hoặc fallback từ variant
   OrderDetail::create([
    'order_id'        => $order->id,
    'product_id'      => $product->id,
    'variant_id'      => $cart->variant_id ?? $variant->id ?? null,
    'product_option'  => $cart->product_option ?? ($variant ? "{$variant->option1} - {$variant->option2}" : null),
    'product_value'   => $cart->product_value ?? ($variant ? "{$variant->value1} - {$variant->value2}" : null),
    'price_at_time'   => $priceAtTime,
    'quantity'        => $cart->quantity,
    'subtotal'        => $cart->quantity * $priceAtTime,
]);
;

    $product->increment('sold', $cart->quantity);
    $orders[] = $order;
}

            }

            Cart::where('user_id', $userId)->delete();
            DB::commit();

            $redirectUrl = null;
            if ($validated['payment_method'] === 'vnpay') {
                $redirectUrl = ServicesVnpayService::createPaymentUrl([
                    'user_id' => $userId,
                    'order_ids' => collect($orders)->pluck('id')->toArray(),
                    'amount' => $totalFinalAmount,
                    'return_url' => route('vnpay.return')
                ]);
            }

            return response()->json([
                'message' => 'Tạo đơn hàng thành công',
                'order_ids' => collect($orders)->pluck('id'),
                'payment_method' => $validated['payment_method'],
                'redirect_url' => $redirectUrl
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Checkout Error: ' . $e->getMessage(), [
                'user_id' => $userId,
                'request' => $request->all()
            ]);
            return response()->json(['message' => 'Lỗi khi đặt hàng: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        $orderDetails = OrderDetail::where('order_id', $id)->get();

        return response()->json([
            'order' => $order,
            'details' => $orderDetails
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $order = Order::where('id', $id)->where('user_id', Auth::id())->first();

        if (!$order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại hoặc không thuộc quyền truy cập'], 404);
        }
        if ($order->order_status === 'Pending') {
            $order->update([
                'order_status' => 'Canceled',
                'cancel_status' => 'Approved',
                'cancel_reason' => $request->input('cancel_reason') ?? 'Người dùng hủy trước khi xác nhận'
            ]);
            return response()->json(['message' => 'Đơn hàng đã được huỷ thành công']);
        }

        if ($order->order_status === 'order confirmation') {
            $validated = $request->validate([
                'cancel_reason' => 'required|string|max:255',
            ]);

            $order->update([
                'cancel_status' => 'Requested',
                'cancel_reason' => $validated['cancel_reason']
            ]);

            return response()->json(['message' => 'Yêu cầu huỷ đơn đã được gửi đến shop. Vui lòng chờ phản hồi']);
        }

        if (in_array($order->order_status, ['Shipped', 'Delivered'])) {
            return response()->json(['message' => 'Đơn hàng đã được vận chuyển. Không thể huỷ đơn'], 400);
        }

        return response()->json(['message' => 'Không thể huỷ đơn ở trạng thái hiện tại'], 400);
    }
    public function adminShow($id)
    {
        $order = Order::with(['user', 'shop', 'orderDetails.product'])
            ->find($id);

        if (!$order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại'], 404);
        }

        $response = [
            'id' => $order->id,
            'buyer' => [
                'id' => $order->user?->id,
                'name' => $order->user?->name,
                'email' => $order->user?->email,
                'phone' => $order->user?->phone,
                'rank' => $order->user?->rank,
                'avatar' => $order->user?->avatar,
            ],
            'shop' => [
                'id' => $order->shop?->id,
                'name' => $order->shop?->name,
            ],
            'final_amount' => $order->final_amount,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'order_status' => $order->order_status,
            'shipping_status' => $order->shipping_status,
            'shipping_address' => $order->shipping_address,
            'created_at' => $order->created_at,
            'products' => $order->orderDetails->map(function ($detail) {
                $firstImage = null;

                if (!empty($detail->product?->image)) {
                    $images = $detail->product->image;

                    // Nếu không phải mảng, thử json_decode
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
            }),

        ];

        return response()->json([
            'order' => $response
        ]);
    }
    public function adminOrderList(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $query = Order::with(['user', 'shop', 'orderDetails']);

        if ($user->role === 'seller') {
            // Lấy shop_id của seller
            $shop = \App\Models\Shop::where('user_id', $user->id)->first();

            if (!$shop) {
                return response()->json([
                    'orders' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'total' => 0,
                    ]
                ]);
            }

            $query->where('shop_id', $shop->id);
        }

        if ($request->filled('status')) {
            $query->where('order_status', $request->input('status'));
        }

        $orders = $query->latest()->paginate(20);

        $data = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'buyer' => [
                    'id' => $order->user?->id,
                    'name' => $order->user?->name,
                ],
                'shop' => [
                    'id' => $order->shop?->id,
                    'name' => $order->shop?->name,
                ],
                'final_amount' => $order->final_amount,
                'payment_method' => $order->payment_method,
                'order_status' => $order->order_status,
                'shipping_status' => $order->shipping_status,
                'shipping_address' => $order->shipping_address,
                'created_at' => $order->created_at,
                'total_products' => $order->orderDetails->sum('quantity'),
            ];
        });

        return response()->json([
            'orders' => $data,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ]
        ]);
    }


    public function updateShippingStatus($orderId, Request $request)
    {
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Chỉ cho phép cập nhật khi đang ở trạng thái "Shipping"
        if ($order->order_status !== 'Shipping') {
            return response()->json([
                'message' => 'Shipping status can only be updated when order is in "Shipping" status.'
            ], 400);
        }

        // Cập nhật trạng thái vận chuyển (ví dụ: 'In Transit', 'Delivered', ...)
        $order->shipping_status = $request->input('shipping_status');
        $order->save();

        return response()->json(['message' => 'Shipping status updated successfully']);
    }
    public function reorder($orderId)
    {
        $userId = Auth::id();

        $order = Order::where('id', $orderId)
            ->where('user_id', $userId)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Đơn hàng không tồn tại hoặc không thuộc quyền truy cập'], 404);
        }

        $orderDetails = OrderDetail::where('order_id', $orderId)->get();

        if ($orderDetails->isEmpty()) {
            return response()->json(['message' => 'Đơn hàng không có sản phẩm'], 400);
        }

        // Xoá giỏ hàng hiện tại của user (nếu cần)
        Cart::where('user_id', $userId)->delete();

        foreach ($orderDetails as $detail) {
            $product = $detail->product;
            if (!$product || $product->stock <= 0) continue;

            $quantity = min($detail->quantity, $product->stock);

            Cart::create([
                'user_id'     => $userId,
                'product_id'  => $detail->product_id,
                'quantity'    => $quantity,
                'is_active'   => true
            ]);
        }

        return response()->json([
            'message'       => 'Đã thêm sản phẩm vào giỏ hàng và ẩn đơn cũ',
            'redirect_url'  => '/cart'
        ]);
    }
public function guestCheckout(Request $request)
{
    $validated = $request->validate([
        'payment_method' => 'required|in:cod,vnpay',
        'address_manual' => 'required|array',
        'address_manual.full_name' => 'required|string',
        'address_manual.address' => 'required|string',
        'address_manual.city' => 'required|string',
        'address_manual.phone' => 'required|string',
        'address_manual.email' => 'required|email',
        'cart_items' => 'required|array|min:1',
        'cart_items.*.product_id' => 'required|integer|exists:products,id',
        'cart_items.*.quantity' => 'required|integer|min:1',
        'cart_items.*.price' => 'required|numeric',
        'cart_items.*.sale_price' => 'nullable|numeric',
        'cart_items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
    ]);

    $manual = $validated['address_manual'];
    $fullAddress = "{$manual['address']}, {$manual['city']} ({$manual['full_name']} - {$manual['phone']})";

    DB::beginTransaction();

    try {
        $cartItems = collect($validated['cart_items']);

        $cartItemsByShop = $cartItems->groupBy(function ($item) {
            $product = Product::find($item['product_id']);
            return $product->shop_id ?? 0;
        });

        $orders = [];

        foreach ($cartItemsByShop as $shopId => $items) {
            $shopTotalAmount = 0;

            $order = Order::create([
                'user_id' => null, // guest
                'shop_id' => $shopId,
                'total_amount' => 0,
                'final_amount' => 0,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'Pending',
                'order_status' => 'Pending',
                'shipping_status' => 'Pending',
                'shipping_address' => $fullAddress,
            ]);

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = $item['quantity'];
                $salePrice = $item['sale_price'] ?? $item['price'];

                $variant = null;
                $productOption = null;
                $productValue = null;

                if ($item['variant_id']) {
                    $variant = ProductVariant::where('id', $item['variant_id'])
                        ->where('product_id', $product->id)
                        ->firstOrFail();

                    if ($quantity > $variant->stock) {
                        throw new \Exception("Biến thể {$variant->value1} - {$variant->value2} không đủ kho");
                    }

                    $variant->decrement('stock', $quantity);

                    $productOption = trim(implode(' - ', array_filter([$product->option1, $product->option2])));
                    $productValue  = trim(implode(' - ', array_filter([$variant->value1, $variant->value2])));
                } else {
                    if ($quantity > $product->stock) {
                        throw new \Exception("Sản phẩm {$product->name} không đủ kho");
                    }
                    $product->decrement('stock', $quantity);

                    $productOption = trim(implode(' - ', array_filter([$product->option1, $product->option2])));
                    $productValue  = trim(implode(' - ', array_filter([$product->value1, $product->value2])));
                }

                $product->increment('sold', $quantity);

                OrderDetail::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'variant_id' => $item['variant_id'] ?? null,
                    'product_option' => $productOption,
                    'product_value' => $productValue,
                    'price_at_time' => $salePrice,
                    'quantity' => $quantity,
                    'subtotal' => $quantity * $salePrice,
                ]);

                $shopTotalAmount += $quantity * $salePrice;
            }

            $order->update([
                'total_amount' => $shopTotalAmount,
                'final_amount' => $shopTotalAmount
            ]);

            $orders[] = $order;
        }

        DB::commit();

        return response()->json([
            'message' => 'Đặt hàng thành công',
            'order_ids' => collect($orders)->pluck('id')
        ]);
    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error('Guest Checkout Error: ' . $e->getMessage(), [
            'request' => $request->all()
        ]);
        return response()->json(['message' => 'Lỗi khi đặt hàng: ' . $e->getMessage()], 500);
    }
}
    public function updateOrderStatus(Request $request, $orderId)
    {
        // Validate input
        $validated = $request->validate([
            'order_status' => 'required|string|max:50',
        ]);

        // Tìm đơn hàng
        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $orderStatus = strtolower($validated['order_status']);

        // Ánh xạ order_status -> shipping_status
        $statusMap = [
            'pending'              => 'Pending',
            'order confirmation'   => 'Pending',
            'shipped'              => 'Shipping',
            'delivered'            => 'Delivered',
            'canceled'             => 'Failed',
        ];

        // Cập nhật order_status
        $order->order_status = ucfirst($orderStatus);

        // Cập nhật shipping_status nếu ánh xạ được
        if (isset($statusMap[$orderStatus])) {
            $order->shipping_status = $statusMap[$orderStatus];
        }

        $order->save();

        // Tạo thông báo nếu Delivered
        if ($orderStatus === 'delivered') {
            Notification::create([
                'title'     => "Đơn hàng #{$order->id} đã giao",
                'content'   => "Đơn hàng của bạn đã được giao thành công. Nhấn để xem chi tiết.",
                'image_url' => '/images/order-delivered.png',
                'link'      => "/account?section=orders&order_id={$order->id}",
                'is_read'   => 0,
            ]);
        }

        // Tạo thông báo nếu Canceled
        if ($orderStatus === 'canceled') {
            Notification::create([
                'title'     => "Đơn hàng #{$order->id} đã bị huỷ",
                'content'   => "Đơn hàng của bạn đã bị huỷ do khách hàng không nhận. Liên hệ hỗ trợ nếu cần.",
                'image_url' => '/images/order-cancelled.png',
                'link'      => "/account?section=orders&order_id={$order->id}",
                'is_read'   => 0,
            ]);
        }

        return response()->json(['message' => 'Order status updated successfully']);
    }
    public function orderStatistics()
    {
        $user = Auth::user();

        $query = Order::query();

        if ($user->role === 'seller') {
            // Lấy shop của seller
            $shop = \App\Models\Shop::where('user_id', $user->id)->first();
            if (!$shop) {
                return response()->json([
                    'message' => 'Seller chưa có shop',
                    'data' => [
                        'total_orders' => 0,
                        'total_amount' => 0,
                        'formatted_total_amount' => '0 ₫',
                        'pending_orders' => 0,
                        'confirmation_orders' => 0,
                        'shipping_orders' => 0,
                        'delivered_orders' => 0,
                        'canceled_orders' => 0,
                    ]
                ]);
            }

            // chỉ lọc đơn của shop này
            $query->where('shop_id', $shop->id);
        }

        $totalOrders = $query->count();

        $totalAmount = $query->sum('final_amount');

        $pendingOrders = (clone $query)->where('order_status', 'Pending')->count();
        $confirmationOrders = (clone $query)->where('order_status', 'order confirmation')->count();
        $shippingOrders = (clone $query)->where('order_status', 'Shipped')->count();
        $deliveredOrders = (clone $query)->where('order_status', 'Delivered')->count();
        $canceledOrders = (clone $query)->where('order_status', 'Canceled')->count();

        return response()->json([
            'total_orders'           => $totalOrders,
            'total_amount'           => $totalAmount,
            'formatted_total_amount' => number_format($totalAmount, 0, ',', '.') . ' ₫',
            'pending_orders'         => $pendingOrders,
            'confirmation_orders'    => $confirmationOrders,
            'shipping_orders'        => $shippingOrders,
            'delivered_orders'       => $deliveredOrders,
            'canceled_orders'        => $canceledOrders,
        ]);
    }
    public function downloadInvoice($id)
    {
        $order = Order::with(['user', 'orderDetails.product', 'shop'])->findOrFail($id);

        $pdf = Pdf::loadView('invoices.order', compact('order'));
        $pdf->setPaper('A4');
        $pdf->setOptions([
            'defaultFont' => 'DejaVu Sans'
        ]);

        return $pdf->download("invoice_order_{$order->id}.pdf");
    }
}
