<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Review;
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
use Illuminate\Support\Facades\Storage;
use App\Models\OrderReturnPhoto;

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
                    'shop_slug' => $order->shop->slug ?? null,
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
        'voucher_code'   => 'nullable|string',
        'address_id'     => 'nullable|exists:addresses,id',
        'address_manual' => 'nullable|array',
        'address_manual.full_name' => 'required_with:address_manual|string',
        'address_manual.address'   => 'required_with:address_manual|string',
        'address_manual.city'      => 'required_with:address_manual|string',
        'address_manual.phone'     => 'required_with:address_manual|string',
        'address_manual.email'     => 'required_with:address_manual|email',
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

    // Helper lấy đơn giá tại thời điểm (ưu tiên variant->sale->price, rồi product->sale->price)
    $getUnitPrice = function ($cart) {
        $product = $cart->product;
        if ($cart->variant_id) {
            $variant = \App\Models\ProductVariant::find($cart->variant_id);
            if ($variant) return $variant->sale_price ?? $variant->price ?? $product->sale_price ?? $product->price;
        }
        return $product->sale_price ?? $product->price ?? $product->price;
    };

    DB::beginTransaction();
    try {
        // ==== 1. Địa chỉ giao hàng ====
        $fullAddress = '';
        if (!empty($validated['address_id'])) {
            $address = Address::where('user_id', $userId)->findOrFail($validated['address_id']);
            $fullAddress = "{$address->address}, {$address->ward}, {$address->district}, {$address->city}";
        } else {
            $m = $validated['address_manual'];
            $fullAddress = "{$m['address']}, {$m['city']} ({$m['full_name']} - {$m['phone']})";
        }

        // ==== 2. Tổng trước giảm (toàn giỏ) ====
        $subtotalAll = 0;
        foreach ($carts as $cart) {
            $subtotalAll += $cart->quantity * $getUnitPrice($cart);
        }

        // ==== 3. Kiểm tra & tính voucher ====
        $discountAmount = 0;
        $voucher = null;
        $subtotalApplicable = $subtotalAll; // sẽ thay bằng subtotal đủ điều kiện
        $applicableCategoryIds = [];

        if (!empty($validated['voucher_code'])) {
            $voucher = Voucher::where('code', $validated['voucher_code'])
                ->where('start_date', '<=', now())
                ->where('end_date', '>=', now())
                ->first();

            if (!$voucher) return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);

            // Không cộng dồn: nếu session đã áp voucher khác -> từ chối
            $appliedId = session('applied_voucher_id');
            if ($appliedId && (int)$appliedId !== (int)$voucher->id) {
                return response()->json(['message' => 'Bạn đã áp dụng một voucher khác. Vui lòng gỡ voucher cũ.'], 409);
            }

            // Ngăn dùng lại cùng voucher ở đơn chưa hủy
            $hasUsedBefore = Order::where('user_id', $userId)
                ->where('voucher_id', $voucher->id)
                ->whereNull('deleted_at')
                ->whereNotIn('order_status', ['Canceled'])
                ->exists();
            if ($hasUsedBefore) return response()->json(['message' => 'Bạn đã sử dụng voucher này rồi'], 400);

            // Hết lượt dùng?
            if ($voucher->usage_limit && $voucher->usage_count >= $voucher->usage_limit) {
                return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);
            }

            // Voucher gán user?
            $userVoucherCount = DB::table('voucher_users')->where('voucher_id', $voucher->id)->count();
            if ($userVoucherCount > 0) {
                $userVoucherExists = DB::table('voucher_users')
                    ->where('voucher_id', $voucher->id)
                    ->where('user_id', $userId)->exists();
                if (!$userVoucherExists) return response()->json(['message' => 'Mã giảm giá không dành cho bạn'], 400);
            }

            // Lấy categories áp dụng
            $applicableCategoryIds = DB::table('voucher_categories')
                ->where('voucher_id', $voucher->id)
                ->pluck('category_id')->toArray();

            // Lọc item đủ điều kiện (AND: shop & category)
            $eligibleCarts = $carts->filter(function ($cart) use ($voucher, $applicableCategoryIds) {
                if (!is_null($voucher->shop_id) && $cart->product->shop_id != $voucher->shop_id) return false;
                if (!empty($applicableCategoryIds) && !in_array($cart->product->category_id, $applicableCategoryIds)) return false;
                return true;
            });

            // Tổng chỉ trên phần đủ điều kiện
            $subtotalApplicable = $eligibleCarts->reduce(function ($s, $cart) use ($getUnitPrice) {
                return $s + $cart->quantity * $getUnitPrice($cart);
            }, 0);

            if ($subtotalApplicable <= 0) {
                return response()->json(['message' => 'Voucher không áp dụng cho sản phẩm nào trong giỏ'], 400);
            }
            if (!is_null($voucher->min_order_value) && $subtotalApplicable < $voucher->min_order_value) {
                return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu'], 400);
            }

            // Tính số tiền giảm trên phần đủ điều kiện
            if ($voucher->discount_type === 'percent') {
                $discountAmount = min(
                    $voucher->discount_value / 100 * $subtotalApplicable,
                    $voucher->max_discount_value ?? $subtotalApplicable
                );
            } else {
                $discountAmount = min($voucher->discount_value, $subtotalApplicable);
            }
        }

        // ==== 4. Tạo order theo từng shop + phân bổ giảm giá ====
        $cartsByShop = $carts->groupBy(fn($cart) => $cart->product->shop_id);
        $orders = [];
        $totalFinalAmount = 0;

        foreach ($cartsByShop as $shopId => $shopCarts) {
            $shopTotalAmount = 0;

            // Tính tiền & trừ kho
            foreach ($shopCarts as $cart) {
                $product = $cart->product;
                $variant = $cart->variant_id ? ProductVariant::find($cart->variant_id) : null;
                $priceAtTime = $getUnitPrice($cart);

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
            }

            // Phân bổ giảm giá cho shop (không trừ item ngoài phạm vi)
            $shopDiscount = 0;
            if ($voucher) {
                if (!is_null($voucher->shop_id)) {
                    // Voucher SHOP: chỉ shop đó được trừ, và nếu có category thì AND
                    if ((int)$shopId === (int)$voucher->shop_id) {
                        $shopApplicableSubtotal = 0;
                        foreach ($shopCarts as $cart) {
                            if (empty($applicableCategoryIds) || in_array($cart->product->category_id, $applicableCategoryIds)) {
                                $shopApplicableSubtotal += $cart->quantity * $getUnitPrice($cart);
                            }
                        }
                        if ($shopApplicableSubtotal > 0) {
                            $shopDiscount = ($shopApplicableSubtotal / $subtotalApplicable) * $discountAmount;
                        }
                    }
                } else {
                    // Voucher TOÀN SÀN / USER / CATEGORY (không có shop_id)
                    if (empty($applicableCategoryIds)) {
                        // Không giới hạn category -> phân bổ theo tổng của shop
                        $shopDiscount = ($shopTotalAmount / $subtotalAll) * $discountAmount;
                    } else {
                        // Giới hạn category -> chỉ tính phần thuộc category của shop
                        $shopApplicableSubtotal = 0;
                        foreach ($shopCarts as $cart) {
                            if (in_array($cart->product->category_id, $applicableCategoryIds)) {
                                $shopApplicableSubtotal += $cart->quantity * $getUnitPrice($cart);
                            }
                        }
                        if ($shopApplicableSubtotal > 0) {
                            $shopDiscount = ($shopApplicableSubtotal / $subtotalApplicable) * $discountAmount;
                        }
                    }
                }
            }

            $finalAmount = max($shopTotalAmount - round($shopDiscount), 0);
            $totalFinalAmount += $finalAmount;

            $order = Order::create([
                'user_id'        => $userId,
                'shop_id'        => $shopId,
                'voucher_id'     => $voucher?->id,
                'discount_amount'=> round($shopDiscount),
                'total_amount'   => $shopTotalAmount,
                'final_amount'   => $finalAmount,
                'payment_method' => $validated['payment_method'],
                'payment_status' => 'Pending',
                'order_status'   => 'Pending',
                'shipping_status'=> 'Pending',
                'shipping_address'=> $fullAddress,
            ]);

            // Order detail
            foreach ($shopCarts as $cart) {
                $product = $cart->product;
                $variant = $cart->variant_id ? ProductVariant::find($cart->variant_id) : null;
                $priceAtTime = $getUnitPrice($cart);

                OrderDetail::create([
                    'order_id'       => $order->id,
                    'product_id'     => $product->id,
                    'variant_id'     => $cart->variant_id ?? $variant->id ?? null,
                    'product_option' => $cart->product_option ?? ($variant ? "{$variant->option1} - {$variant->option2}" : null),
                    'product_value'  => $cart->product_value ?? ($variant ? "{$variant->value1} - {$variant->value2}" : null),
                    'price_at_time'  => $priceAtTime,
                    'quantity'       => $cart->quantity,
                    'subtotal'       => $cart->quantity * $priceAtTime,
                ]);

                $product->increment('sold', $cart->quantity);
            }

            $orders[] = $order;
        }

        // Xóa giỏ
        Cart::where('user_id', $userId)->delete();

        // Cập nhật usage voucher (khuyên nên cập nhật khi thanh toán thành công)
        if ($voucher) {
            $voucher->increment('usage_count');
            DB::table('voucher_users')->insert([
                'user_id'    => $userId,
                'voucher_id' => $voucher->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        // Clear “không cộng dồn” sau khi tạo đơn
        session()->forget(['applied_voucher_id','applied_discount_amount']);

        DB::commit();

        // VNPAY
        $redirectUrl = null;
        if ($validated['payment_method'] === 'vnpay') {
            $redirectUrl = ServicesVnpayService::createPaymentUrl([
                'user_id'    => $userId,
                'order_ids'  => collect($orders)->pluck('id')->toArray(),
                'amount'     => $totalFinalAmount,
                'return_url' => route('vnpay.return')
            ]);
        }

        return response()->json([
            'message'        => 'Tạo đơn hàng thành công',
            'order_ids'      => collect($orders)->pluck('id'),
            'payment_method' => $validated['payment_method'],
            'redirect_url'   => $redirectUrl
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

        $orderDetails = OrderDetail::where('order_id', $id)->get()->map(function ($detail) {
            $product = Product::find($detail->product_id);

            $detail->product_name = $product ? $product->name : null;

            // Nếu cột image là JSON (chứa nhiều ảnh), lấy ảnh đầu tiên
            if ($product && is_array($product->image)) {
                $detail->product_image = $product->image[0] ?? null;
            } else {
                $detail->product_image = $product->image ?? null;
            }

            return $detail->makeHidden(['product']);
        });

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
                'order_admin_status' => 'Cancelled by Customer',
                'cancel_status' => 'Approved',
                'cancel_reason' => $request->input('cancel_reason') ?? 'Người dùng hủy trước khi xác nhận',
                'canceled_by' => 'Customer',
                'shipping_status' => 'Failed', // Đồng bộ trạng thái giao hàng
                'reconciliation_status' => 'Pending', // Giữ nguyên trạng thái đối soát
            ]);

            return response()->json(['message' => 'Đơn hàng đã được huỷ thành công']);
        }

        if ($order->order_status === 'order confirmation') {
            $validated = $request->validate([
                'cancel_reason' => 'required|string|max:255',
            ]);

            $order->update([
                'cancel_status' => 'Requested',
                'cancel_reason' => $validated['cancel_reason'],
                'order_admin_status' => 'Cancellation Request Pending',
                'canceled_by' => 'Customer',
            ]);
            if (!$order->canceled_at) {
                $order->canceled_at = now();
                $order->save();
            }

            return response()->json(['message' => 'Yêu cầu huỷ đơn đã được gửi đến shop. Vui lòng chờ phản hồi']);
        }

        if (in_array($order->order_status, ['Shipped', 'Delivered', 'Canceled'])) {
            return response()->json(['message' => 'Không thể huỷ đơn ở trạng thái hiện tại'], 400);
        }

        return response()->json(['message' => 'Không thể huỷ đơn ở trạng thái hiện tại'], 400);
    }
    public function ShopCancelOrder(Request $request, $id)
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        // Các trạng thái không thể huỷ
        if (in_array($order->order_status, ['Delivered', 'Canceled'])) {
            return response()->json(['message' => 'Không thể huỷ đơn đã giao hoặc đã huỷ'], 400);
        }

        $validated = $request->validate([
            'cancel_reason' => 'required|string|max:255',
            'cancel_type' => 'required|in:Seller,Payment Gateway,Customer Refused Delivery,System', // Tùy loại huỷ
        ]);

        // Ánh xạ cancel_type → order_admin_status
        $adminStatusMap = [
            'Seller' => 'Cancelled by Seller',
            'Payment Gateway' => 'Cancelled - Payment Failed',
            'Customer Refused Delivery' => 'Cancelled - Customer Refused Delivery',
            'System' => 'Cancelled - System Auto',
        ];

        $order->update([
            'order_status'         => 'Canceled',
            'order_admin_status'   => $adminStatusMap[$validated['cancel_type']],
            'cancel_status'        => 'Approved',
            'cancel_reason'        => $validated['cancel_reason'],
            'canceled_by'          => $validated['cancel_type'],  // Gán đúng người huỷ
            'shipping_status'      => 'Failed',
            'reconciliation_status' => 'Pending',
        ]);
        return response()->json(['message' => 'Đơn hàng đã được huỷ bởi admin']);
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
    public function ShopOrderList(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $query = Order::with(['user', 'shop', 'orderDetails']);

        if ($request->boolean('with_products')) {
            $query->with(['orderDetails.product']);
        }

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
            $query->where('order_admin_status', $request->input('status'));
        }
        $orders = $query->latest()->paginate(20);

        $data = $orders->map(function ($order) use ($request) {
            $orderData = [
                'id' => $order->id,
                'buyer' => [
                    'id' => $order->user?->id,
                    'name' => $order->user?->name,
                    'email' => $order->user?->email,
                    'phone' => $order->user?->phone,
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
                'order_admin_status' => $order->order_admin_status,
                'shipping_status' => $order->shipping_status,
                'shipping_address' => $order->shipping_address,
                'transaction_id' => $order->transaction_id,
                'canceled_by' => $order->canceled_by,
                'reconciliation_status' => $order->reconciliation_status,
                'return_status' => $order->return_status,
                'cancel_status' => $order->cancel_status,
                'cancel_reason' => $order->cancel_reason,
                'rejection_reason' => $order->rejection_reason,
                'created_at' => $order->created_at,
                'confirmed_at' => $order->confirmed_at,
                'shipping_started_at' => $order->shipping_started_at,
                'canceled_at' => $order->canceled_at,
                'return_confirmed_at' => $order->return_confirmed_at,
                'reconciled_at' => $order->reconciled_at,
                'total_products' => $order->orderDetails->sum('quantity'),
            ];

            // ✅ Nếu có with_products, thì thêm sản phẩm
            if ($request->boolean('with_products')) {
                $orderData['products'] = $order->orderDetails->map(function ($detail) {
                    $firstImage = null;
                    $images = $detail->product?->image;

                    if (!is_array($images)) {
                        $images = json_decode($images, true);
                    }

                    if (is_array($images) && count($images) > 0) {
                        $firstImage = $images[0];
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
            }

            return $orderData;
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
                'image_url' => '/order-delivered.png',
                'link'      => "/account?section=orders&order_id={$order->id}",
                'is_read'   => 0,
            ]);
        }

        // Tạo thông báo nếu Canceled
        if ($orderStatus === 'canceled') {
            Notification::create([
                'title'     => "Đơn hàng #{$order->id} đã bị huỷ",
                'content'   => "Đơn hàng của bạn đã bị huỷ do khách hàng không nhận. Liên hệ hỗ trợ nếu cần.",
                'image_url' => '/order-cancelled.png',
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
    public function orderStatisticsByShopStatus(Request $request)
    {
        $user = Auth::user();
        $query = Order::query();

        if ($user->role === 'seller') {
            $shop = \App\Models\Shop::where('user_id', $user->id)->first();
            if (!$shop) {
                return response()->json([
                    'message' => 'Seller chưa có shop',
                    'data' => [
                        'total_orders' => 0,
                        'total_amount' => 0,
                        'formatted_total_amount' => '0 ₫',
                        'pending_processing' => 0,
                        'processing' => 0,
                        'shipping' => 0,
                        'delivered' => 0,
                        'returned_requesting' => 0,
                        'returned_completed' => 0,
                        'cancelled_by_customer' => 0,
                    ]
                ]);
            }

            $query->where('shop_id', $shop->id);
        }
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $from = date($request->input('from_date') . ' 00:00:00');
            $to   = date($request->input('to_date') . ' 23:59:59');
            $query->whereBetween('created_at', [$from, $to]);
        }
        $totalOrders = $query->count();
        $totalAmount = $query->sum('final_amount');

        return response()->json([
            'total_orders'           => $totalOrders,
            'total_amount'           => $totalAmount,
            'formatted_total_amount' => number_format($totalAmount, 0, ',', '.') . ' ₫',
            'pending_processing'     => (clone $query)->where('order_admin_status', 'Pending Processing')->count(),
            'processing'             => (clone $query)->where('order_admin_status', 'Processing')->count(),
            'ready_for_shipment'     => (clone $query)->where('order_admin_status', 'Ready for Shipment')->count(),
            'shipping'               => (clone $query)->where('order_admin_status', 'Shipping')->count(),
            'delivered'              => (clone $query)->where('order_admin_status', 'Delivered')->count(),
            'cancelled_by_customer'  => (clone $query)->where('order_admin_status', 'Cancelled by Customer')->count(),
            'cancelled_by_seller'    => (clone $query)->where('order_admin_status', 'Cancelled by Seller')->count(),
            'cancel_payment_failed'  => (clone $query)->where('order_admin_status', 'Cancelled – Payment Failed')->count(),
            'return_requested'       => (clone $query)->where('order_admin_status', 'Return Requested')->count(),
            'returning'              => (clone $query)->where('order_admin_status', 'Returning')->count(),
            'refunded'               => (clone $query)->where('order_admin_status', 'Refunded')->count(),
        ]);
    }
    public function updateShopOrderStatus(Request $request, $orderId)
    {
        $validated = $request->validate([
            'order_admin_status' => 'required|string|max:100',
            'reconciliation_status' => 'nullable|in:Pending,Done',
        ]);

        $order = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $adminStatus = $validated['order_admin_status'];

        // ✅ Xác định flow chuẩn theo thứ tự xử lý
        $orderFlow = [
            'Pending Processing',
            'Processing',
            'Ready for Shipment',
            'Shipping',
            'Delivered',
            'Paid - Reconciliation Pending',
            'Reconciled',
        ];

        // ✅ Kiểm tra nếu chuyển lùi trạng thái
        $currentIndex = array_search($order->order_admin_status, $orderFlow);
        $newIndex = array_search($adminStatus, $orderFlow);

        if ($currentIndex !== false && $newIndex !== false && $newIndex < $currentIndex) {
            $allowedBackwardTransitions = [
                'Ready for Shipment' => ['Processing'],
                'Processing' => ['Pending Processing'],
            ];

            if (!in_array($adminStatus, $allowedBackwardTransitions[$order->order_admin_status] ?? [])) {
                return response()->json(['message' => 'Không được phép chuyển lùi trạng thái đơn hàng này'], 400);
            }
        }

        // ✅ Kiểm tra trạng thái đối soát trước khi cập nhật trạng thái đơn
        if ($request->has('reconciliation_status')) {
            if (
                $order->order_status !== 'Delivered' ||
                !in_array($order->order_admin_status, ['Delivered', 'Reconciled', 'Paid - Reconciliation Pending'])
            ) {
                return response()->json(['message' => 'Chỉ đơn hàng đã giao và đã xác nhận nhận hàng mới được đối soát'], 400);
            }

            if ($order->payment_method !== 'COD') {
                return response()->json(['message' => 'Chỉ đối soát đơn hàng thanh toán COD'], 400);
            }

            if (str_starts_with($adminStatus, 'Cancelled')) {
                return response()->json(['message' => 'Đơn hàng đã huỷ, không thể đối soát'], 400);
            }

            $order->reconciliation_status = $validated['reconciliation_status'];
        }

        // ✅ Ánh xạ order_admin_status → order_status
        $statusMap = [
            'Pending Processing'              => 'Pending',
            'Processing'                      => 'order confirmation',
            'Processed'                       => 'order confirmation',
            'Cancellation Request Pending'    => 'order confirmation',
            'Ready for Shipment'              => 'Shipped',
            'Shipping'                        => 'Shipped',
            'Delivered'                       => 'Delivered',
            'Paid - Reconciliation Pending'   => 'Delivered',
            'Reconciled'                      => 'Delivered',
            'Returned - Requesting'           => 'Return Requested',
            'Returned - Approved'             => 'Return Requested',
            'Returned - Rejected'             => 'Delivered',
            'Returned - Customer Shipped'     => 'Return Requested',
            'Returned - Completed'            => 'Refunded',
            'Unpaid'                          => 'Pending',
            'Cancelled by Customer'           => 'Canceled',
            'Cancelled by Seller'             => 'Canceled',
            'Cancelled - Payment Failed'      => 'Canceled',
            'Cancelled - Customer Refused Delivery' => 'Canceled',
        ];

        $order->order_admin_status = $adminStatus;

        if (isset($statusMap[$adminStatus])) {
            $order->order_status = $statusMap[$adminStatus];
        }
        if (in_array($adminStatus, ['Processing', 'Processed', 'Ready for Shipment']) && !$order->confirmed_at) {
            $order->confirmed_at = now();
        }
        if ($adminStatus === 'Shipping' && !$order->shipping_started_at) {
            $order->shipping_started_at = now();
        }
        if (str_starts_with($adminStatus, 'Cancelled') && !$order->canceled_at) {
            $order->canceled_at = now();
        }
        if ($order->order_status === 'Delivered' && !$order->delivered_at) {
            $order->delivered_at = now();
        }
        if ($adminStatus === 'Return Approved' && !$order->return_confirmed_at) {
            $order->return_confirmed_at = now();
        }
        if ($adminStatus === 'Reconciled' && !$order->reconciled_at) {
            $order->reconciled_at = now();
        }

        // ✅ Ánh xạ shipping_status nếu phù hợp
        $shippingMap = [
            'Ready for Shipment' => 'Pending',
            'Shipping' => 'Shipping',
            'Delivered' => 'Delivered',
            'Cancelled by Customer' => 'Failed',
            'Cancelled by Seller' => 'Failed',
            'Cancelled - Payment Failed' => 'Failed',
            'Cancelled - Customer Refused Delivery' => 'Failed',
        ];

        if (isset($shippingMap[$adminStatus])) {
            $order->shipping_status = $shippingMap[$adminStatus];
        }
        if ($order->order_status === 'Delivered' && !$order->delivered_at) {
            $order->delivered_at = now();
        }

        // ✅ Ghi nhận người hủy nếu là trạng thái hủy
        if (str_starts_with($adminStatus, 'Cancelled')) {
            if ($adminStatus === 'Cancelled by Customer') {
                $order->canceled_by = 'Customer';
            } elseif ($adminStatus === 'Cancelled by Seller') {
                $order->canceled_by = 'Seller';
            } elseif ($adminStatus === 'Cancelled - Payment Failed') {
                $order->canceled_by = 'Payment Gateway';
            } else {
                $order->canceled_by = 'System';
            }
        }

        $order->save();

        return response()->json(['message' => 'Cập nhật đơn hàng thành công']);
    }
    // hoàn đơn
    public function requestRefund(Request $request, $id)
    {
        $order = Order::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        if ($order->order_status !== 'Delivered') {
            return response()->json(['message' => 'Chỉ được yêu cầu hoàn đơn khi đơn hàng đã giao'], 400);
        }

        if (!$order->delivered_at || $order->delivered_at->diffInDays(now()) > 7) {
            return response()->json(['message' => 'Đơn hàng đã quá hạn 7 ngày kể từ khi giao, không thể hoàn đơn'], 400);
        }

        $exists = Review::whereHas('orderDetail', function ($query) use ($order) {
            $query->where('order_id', $order->id);
        })->exists();
        if ($exists) {
            return response()->json(['message' => 'Đơn hàng đã được đánh giá, không thể hoàn đơn'], 400);
        }

        // Validate FormData
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'images' => 'nullable',
            'images.*' => 'url',
        ]);

        // Cập nhật trạng thái hoàn đơn
        $order->update([
            'return_status' => 'Requested',
            'order_status' => 'Return Requested',
            'order_admin_status' => 'Return Requested',
            'cancel_reason' => $validated['reason'],
            'cancel_status' => 'Requested',
        ]);
        if (!$order->return_confirmed_at) {
            $order->return_confirmed_at = now();
            $order->save();
        }

        // Nếu có ảnh thì xử lý upload
        if (!empty($validated['images'])) {
            foreach ($validated['images'] as $imageUrl) {
                \App\Models\OrderReturnPhoto::create([
                    'order_id' => $order->id,
                    'image_path' => $imageUrl,
                ]);
            }
        }

        return response()->json(['message' => 'Đã gửi yêu cầu hoàn đơn thành công']);
    }


    // từ chối hoàn đơn
    public function rejectRefundRequest(Request $request, $orderId)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:255',
        ]);

        $order = Order::find($orderId);

        if (!$order || $order->order_admin_status !== 'Return Requested') {
            return response()->json(['message' => 'Đơn hàng không hợp lệ để từ chối hoàn đơn'], 400);
        }

        $order->order_admin_status = 'Return Requested';
        $order->order_status = 'Return Requested';
        $order->rejection_reason = $validated['rejection_reason'];
        $order->return_status = 'Rejected';
        $order->save();

        // Gửi thông báo cho user
        Notification::create([
            'user_id'   => $order->user_id,
            'title'     => "Yêu cầu hoàn đơn #{$order->id} bị từ chối",
            'content'   => "Lý do: {$validated['rejection_reason']}",
            // 'image_url' => '/refund-rejected.png',
            'link'      => "/account?section=orders&order_id={$order->id}",
            'is_read'   => 0,
        ]);

        return response()->json(['message' => 'Đã từ chối yêu cầu hoàn đơn thành công']);
    }
    // xem chi tiết hoàn đơn
public function viewRefundRequest($orderId)
{
    // Eager load đủ quan hệ để tránh N+1
    $order = \App\Models\Order::with([
        'user:id,name,email,phone,avatar',
        'shop:id,name,email,logo',
        'orderDetails.product:id,name,image',
    ])->find($orderId);

    if (!$order) {
        return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
    }

    // Ảnh hoàn đơn (dùng accessor getImagesAttribute() bạn đã có)
    $refundPhotos = $order->images ?? [];

    // Chuẩn hoá logo shop về string hoặc null (tránh trường hợp logo bị cast thành array)
    $shopLogo = $order->shop?->logo;
    if (is_array($shopLogo)) {
        $shopLogo = $shopLogo[0] ?? null;
    }

    // Gom ảnh của từng sản phẩm trong đơn
    $productImages = $order->orderDetails->map(function ($detail) {
        $p = $detail->product;
        if (!$p) return null;

        $imgs = $p->image;
        // Chuẩn hoá về mảng
        if (is_string($imgs)) {
            $decoded = json_decode($imgs, true);
            $imgs = json_last_error() === JSON_ERROR_NONE ? $decoded : [$imgs];
        }
        if (!is_array($imgs)) {
            $imgs = $imgs ? [$imgs] : [];
        }

        return [
            'product_id'   => $p->id,
            'product_name' => $p->name,
            'image'        => $imgs,
        ];
    })->filter()->values();

    return response()->json([
        'order_id' => $order->id,
        'user'     => [
            'id'     => $order->user?->id,
            'name'   => $order->user?->name,
            'email'  => $order->user?->email,
            'phone'  => $order->user?->phone,
            'avatar' => $order->user?->avatar,
        ],
        'shop' => [
            'id'    => $order->shop?->id,
            'name'  => $order->shop?->name,
            'email' => $order->shop?->email,
            'logo'  => $shopLogo,
        ],
        'cancel_reason' => $order->cancel_reason,
        'photos'        => $refundPhotos,
        'product_images'=> $productImages,
        'return_confirmed_at'    => $order->return_confirmed_at,      // sẽ tự serialize dạng ISO 8601
        'return_status'        => $order->return_status,   // ví dụ: Requested/Approved/Rejected/Returning/Refunded
    ]);
}

    // duyệt
    public function approveRefundRequest($orderId)
    {
        $order = Order::find($orderId);

        if (!$order || $order->order_admin_status !== 'Return Requested') {
            return response()->json(['message' => 'Không thể duyệt hoàn đơn trong trạng thái hiện tại'], 400);
        }

        $order->order_admin_status = 'Return Approved';
        $order->order_status = 'Returning';
        $order->return_status = 'Approved';
        $order->save();

        Notification::create([
            'user_id' => $order->user_id,
            'title' => "Yêu cầu hoàn đơn #{$order->id} đã được duyệt",
            'content' => "Đơn hàng của bạn đã được chấp nhận hoàn trả. Vui lòng làm theo hướng dẫn từ shop.",
            // 'image_url' => '/refund-approved.png',
            'link' => "/account?section=orders&order_id={$order->id}",
            'is_read' => 0,
        ]);

        return response()->json(['message' => 'Đã duyệt hoàn đơn thành công']);
    }
    public function viewRefundReportDetail($orderId)
    {
        $order = \App\Models\Order::with(['user', 'orderDetails.product'])->find($orderId);
        $report = \App\Models\Report::with('user')->where('order_id', $orderId)->first();

        if (!$order || !$report) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng hoặc tố cáo'], 404);
        }

        // Ảnh người mua gửi khi yêu cầu hoàn đơn
        $photos = \App\Models\OrderReturnPhoto::where('order_id', $orderId)->pluck('image_path');

        // Ảnh sản phẩm gốc trong đơn hàng
        $productImages = $order->orderDetails->map(function ($detail) {
            return [
                'product_id' => $detail->product->id,
                'product_name' => $detail->product->name,
                'image' => $detail->product->image, // Giả sử có cột image trong bảng products
            ];
        });

        return response()->json([
            'report_id' => $report->id,
            'order_id' => $order->id,
            'user' => [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email'  => $order->user->email,
                'phone'  => $order->user->phone,
                'avatar' => $order->user->avatar,
            ],
            'shop' => [
                'id'   => $order->shop->id ?? null,
                'name' => $order->shop->name ?? '(Không tìm thấy shop)',
                'email' => $order->shop->email ?? null,
                'logo'  => $order->shop->logo ?? null,
            ],
            'report_reason' => $report->reason,
            'photos' => $photos,
            'product_images' => $productImages, // Thêm phần này
            'created_at' => $report->created_at,
            'status' => $report->status,
        ]);
    }

    //Duyệt tố cáo (admin đứng về phía người mua)

    public function approveRefundReport($orderId)
    {
        $order = \App\Models\Order::find($orderId);
        $report = \App\Models\Report::where('order_id', $orderId)->first();

        if (!$order || !$report || $report->status !== 'Pending') {
            return response()->json(['message' => 'Không thể duyệt tố cáo'], 400);
        }

        $order->order_admin_status = 'Return Approved';
        $order->order_status = 'Returning';
        $order->return_status = 'Approved';
        $order->save();

        $report->status = 'Resolved';
        $report->save();

        $shop = $order->shop;
        $shop->increment('report_warnings');
        $shop->last_reported_at = now();

        // Xử lý rating và khóa shop theo mốc vi phạm
        switch ($shop->report_warnings) {
            case 3:
                $shop->rating = max(0, ($shop->rating ?? 5) - 1.0);
                break;
            case 6:
                $shop->rating = max(0, ($shop->rating ?? 5) - 2.0);
                break;
            case 9:
                $shop->rating = max(0, ($shop->rating ?? 5) - 3.0);
                break;
            case 15:
                $shop->status = 'hidden';
                $shop->locked_until = now()->addDays(7); // tạm ẩn shop
                break;
        }

        $shop->save();

        \App\Models\Notification::create([
            'user_id' => $order->user_id,
            'title' => "Tố cáo đơn #{$order->id} được duyệt",
            'content' => "Sàn đã xử lý và đồng ý hoàn đơn cho bạn.",
            // 'image_url' => '/refund-approved.png',
            'link' => "/account?section=orders&order_id={$order->id}",
            'is_read' => 0,
        ]);

        return response()->json(['message' => 'Đã duyệt tố cáo hoàn đơn thành công']);
    }
    //Từ chối tố cáo (admin đứng về phía shop)
    public function rejectRefundReport(Request $request, $orderId)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:255',
        ]);

        $order = \App\Models\Order::find($orderId);
        $report = \App\Models\Report::where('order_id', $orderId)->first();

        if (!$order || !$report || $report->status !== 'Pending') {
            return response()->json(['message' => 'Không thể từ chối tố cáo'], 400);
        }

        $order->order_admin_status = 'Return Requested';
        $order->order_status = 'Return Requested';
        $order->rejection_reason = $validated['rejection_reason'];
        $order->return_status = 'Rejected';
        $order->save();

        $report->status = 'Resolved';
        $report->save();

        \App\Models\Notification::create([
            'user_id' => $order->user_id,
            'title' => "Tố cáo đơn #{$order->id} bị từ chối",
            'content' => "Sàn không chấp nhận tố cáo của bạn: {$validated['rejection_reason']}",
            // 'image_url' => '/refund-rejected.png',
            'link' => "/account?section=orders&order_id={$order->id}",
            'is_read' => 0,
        ]);
        $user = $order->user;
        $user->report_violations += 1;

        // Gửi cảnh báo nếu là lần 1 hoặc 2
        if (in_array($user->report_violations, [1, 2])) {
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title' => 'Cảnh báo: Tố cáo sai',
                'content' => "Tố cáo của bạn đã bị từ chối. Nếu tiếp tục gửi sai, bạn có thể bị cấm gửi tố cáo.",
                // 'image_url' => '/warning.png',
                'link' => '/account',
                'is_read' => 0,
            ]);
        }

        // Khóa quyền gửi tố cáo nếu vi phạm >= 3
        if ($user->report_violations >= 3) {
            $user->is_report_blocked = true;

            \App\Models\Notification::create([
                'user_id' => $user->id,
                'title' => 'Bạn đã bị chặn gửi tố cáo',
                'content' => 'Bạn đã gửi nhiều tố cáo sai và đã bị khóa quyền gửi tố cáo mới.',
                'image_url' => '/report-blocked.png',
                'link' => '/account',
                'is_read' => 0,
            ]);
        }

        $user->save();
        return response()->json(['message' => 'Từ chối tố cáo thành công']);
    }
    //Danh sách tất cả đơn bị tố cáo hoàn đơn
    public function listAllRefundReports()
    {
        $reports = \App\Models\Report::with([
            'user',
            'shop',
            'order.orderDetails.product' // Load quan hệ để lấy ảnh sản phẩm
        ])
            ->whereNotNull('order_id')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $reports->map(function ($report) {
                // Lấy ảnh của sản phẩm đầu tiên trong đơn hàng (nếu có)
                $firstProductImage = optional($report->order->orderDetails->first()->product)->image;

                return [
                    'report_id' => $report->id,
                    'order_id' => $report->order_id,
                    'user' => [
                        'id' => $report->user->id,
                        'name' => $report->user->name,
                    ],
                    'shop' => [
                        'id' => $report->shop->id,
                        'name' => $report->shop->name,
                    ],
                    'reason' => $report->reason,
                    'status' => $report->status,
                    'created_at' => $report->created_at ? $report->created_at->format('Y-m-d H:i') : null,
                    'product_image' => $firstProductImage, // ✅ Thêm dòng này
                ];
            }),
        ]);
    }
public function listRefundReportsFromOrders(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $orders = Order::with([
            'user:id,name',
            'shop:id,name,logo',                  // 👈 thêm shop
            'orderDetails.product:id,name,image',
        ])
        ->where('return_status', '!=', 'None')
        ->when($user->role === 'seller', function ($q) use ($user) {
            $q->whereHas('shop', function ($s) use ($user) {
                $s->where('user_id', $user->id);
            });
        })
        ->when($user->role !== 'seller' && $request->filled('shop_id'), function ($q) use ($request) {
            $q->where('shop_id', $request->input('shop_id'));
        })
        ->when($request->filled('status'), function ($q) use ($request) {
            $q->where('return_status', $request->input('status'));
        })
        ->orderByDesc('return_confirmed_at')
        ->orderByDesc('created_at')
        ->get();

    $data = $orders->map(function ($o) {
        // ảnh sản phẩm đầu tiên
        $firstProduct = optional($o->orderDetails->first())->product;
        $imgs = $firstProduct?->image;
        if (is_string($imgs)) {
            $decoded = json_decode($imgs, true);
            $imgs = json_last_error() === JSON_ERROR_NONE ? $decoded : [$imgs];
        }
        if (!is_array($imgs)) $imgs = $imgs ? [$imgs] : [];

        // logo shop có thể là array do cast -> lấy phần tử đầu
        $shopLogo = $o->shop?->logo;
        if (is_array($shopLogo)) {
            $shopLogo = $shopLogo[0] ?? null;
        }

        return [
            'order_id'            => $o->id,
            'user'                => ['id' => $o->user?->id, 'name' => $o->user?->name],
            'shop'                => [                         // 👈 thêm block shop
                'id'   => $o->shop?->id,
                'name' => $o->shop?->name,
                'logo' => $shopLogo,
            ],
            'reason'              => $o->cancel_reason ?? $o->rejection_reason ?? null,
            'return_status'       => $o->return_status,
            'return_confirmed_at' => optional($o->return_confirmed_at)->format('Y-m-d H:i'),
            'product_image'       => $imgs,
        ];
    })->values();

    return response()->json(['data' => $data]);
}

}
