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
use App\Models\ProductVariant;

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
                return [
                    'id' => $order->id,
                    'user_id' => $order->user_id,
                    'shop_name' => $order->shop->name ?? null, // 👈 thêm tên shop
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
                    'order_details' => $order->orderDetails
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

            // Cho khách vãng lai
            'cart_items' => 'nullable|array',
            'cart_items.*.product_id' => 'required_with:cart_items|exists:products,id',
            'cart_items.*.quantity' => 'required_with:cart_items|integer|min:1',
            'cart_items.*.variant_id' => 'nullable|exists:product_variants,id',
        ]);

        if (empty($validated['address_id']) && empty($validated['address_manual'])) {
            return response()->json(['message' => 'Phải chọn địa chỉ có sẵn hoặc nhập địa chỉ mới'], 422);
        }

        // ✅ Phân biệt cart login vs guest
        $guestItems = $request->input('cart_items', []);

        if ($userId) {
            $carts = Cart::with('product')->where('user_id', $userId)->where('is_active', true)->get();
        } elseif (!empty($guestItems)) {
            $carts = collect();

            foreach ($guestItems as $item) {
                $product = \App\Models\Product::with('shop')->find($item['product_id']);
                if (!$product) continue;

                $variant = isset($item['variant_id']) ? ProductVariant::find($item['variant_id']) : null;

                $carts->push((object)[
                    'product_id' => $product->id,
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'variant' => $variant,
                    'product_value' => $variant ? trim(implode(' - ', array_filter([$variant->value1, $variant->value2]))) : null,
                    'product_option' => $variant ? trim(implode(' - ', array_filter([$variant->option1, $variant->option2]))) : null,
                ]);
            }
        } else {
            return response()->json(['message' => 'Giỏ hàng trống'], 400);
        }

        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Giỏ hàng trống'], 400);
        }

        DB::beginTransaction();
        try {
            // 🏠 Địa chỉ giao hàng
            $fullAddress = '';
            if (!empty($validated['address_id']) && $userId) {
                $address = Address::where('user_id', $userId)->findOrFail($validated['address_id']);
                $fullAddress = "{$address->address}, {$address->ward}, {$address->district}, {$address->city}";
            } elseif (!empty($validated['address_manual'])) {
                $manual = $validated['address_manual'];
                $fullAddress = "{$manual['address']}, {$manual['city']} ({$manual['full_name']} - {$manual['phone']})";
            }

            // 💰 Tổng tạm tính
            $subtotalAll = 0;
            foreach ($carts as $cart) {
                $subtotalAll += $cart->quantity * $cart->product->price;
            }

            // 💸 Mã giảm giá
            $discountAmount = 0;
            $voucher = null;
            $applicableCategoryIds = [];

            if (!empty($validated['voucher_code'])) {
                $voucher = Voucher::where('code', $validated['voucher_code'])
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now())
                    ->first();

                if (!$voucher)
                    return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);

                if ($voucher->usage_limit && $voucher->usage_count >= $voucher->usage_limit)
                    return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);

                if ($userId) {
                    $userVoucherCount = DB::table('voucher_users')->where('voucher_id', $voucher->id)->count();
                    if ($userVoucherCount > 0) {
                        $userVoucherExists = DB::table('voucher_users')
                            ->where('voucher_id', $voucher->id)
                            ->where('user_id', $userId)->exists();

                        if (!$userVoucherExists)
                            return response()->json(['message' => 'Mã giảm giá không dành cho bạn'], 400);
                    }
                }

                $applicableCategoryIds = DB::table('voucher_categories')->where('voucher_id', $voucher->id)->pluck('category_id')->toArray();

                $subtotalApplicable = $subtotalAll;
                if (!empty($applicableCategoryIds)) {
                    $subtotalApplicable = 0;
                    foreach ($carts as $cart) {
                        if (in_array($cart->product->category_id, $applicableCategoryIds)) {
                            $subtotalApplicable += $cart->quantity * $cart->product->price;
                        }
                    }

                    if ($subtotalApplicable < $voucher->min_order_value)
                        return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu'], 400);
                } else {
                    if ($subtotalAll < $voucher->min_order_value)
                        return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu'], 400);
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

            // 🛒 Tạo đơn hàng theo từng shop
            $cartsByShop = $carts->groupBy(fn($cart) => $cart->product->shop_id);
            $orders = [];
            $totalFinalAmount = 0;

            foreach ($cartsByShop as $shopId => $shopCarts) {
                $shopTotalAmount = 0;
                $shopFinalAmount = 0;
                $shopApplicableTotal = 0;

                foreach ($shopCarts as $cart) {
                    $originalPrice = $cart->product->price;
                    $salePrice = $cart->product->sale_price ?? $originalPrice;
                    $quantity = $cart->quantity;

                    $shopTotalAmount += $quantity * $originalPrice;
                    $shopFinalAmount += $quantity * $salePrice;

                    if (!$voucher || empty($applicableCategoryIds) || in_array($cart->product->category_id, $applicableCategoryIds)) {
                        $shopApplicableTotal += $quantity * $originalPrice;
                    }
                }

                $shopDiscount = $voucher && $subtotalAll > 0
                    ? ($shopApplicableTotal / $subtotalAll) * $discountAmount
                    : 0;

                $finalAmount = max(0, $shopFinalAmount - $shopDiscount);
                $totalFinalAmount += $finalAmount;

                $order = Order::create([
                    'user_id' => $userId ?? null,
                    'shop_id' => $shopId,
                    'total_amount' => $shopTotalAmount,
                    'final_amount' => $finalAmount,
                    'payment_method' => $validated['payment_method'],
                    'payment_status' => 'Pending',
                    'order_status' => 'Pending',
                    'shipping_status' => 'Pending',
                    'shipping_address' => $fullAddress,
                ]);

                foreach ($shopCarts as $cart) {
                    $salePrice = $cart->product->sale_price ?? $cart->product->price;
                    $quantity = $cart->quantity;
                    $variant = $cart->variant ?? null;

                    if ($variant) {
                        if ($quantity > $variant->stock) {
                            DB::rollBack();
                            return response()->json(['message' => "Biến thể '{$variant->value1}' không đủ hàng trong kho"], 400);
                        }

                        $variant->decrement('stock', $quantity);

                        OrderDetail::create([
                            'order_id' => $order->id,
                            'product_id' => $cart->product_id,
                            'variant_id' => $variant->id,
                            'price_at_time' => $salePrice,
                            'quantity' => $quantity,
                            'subtotal' => $quantity * $salePrice,
                        ]);
                    } else {
                        if ($quantity > $cart->product->stock) {
                            DB::rollBack();
                            return response()->json(['message' => "Sản phẩm '{$cart->product->name}' không đủ hàng trong kho"], 400);
                        }

                        $cart->product->decrement('stock', $quantity);

                        OrderDetail::create([
                            'order_id' => $order->id,
                            'product_id' => $cart->product_id,
                            'variant_id' => null,
                            'price_at_time' => $salePrice,
                            'quantity' => $quantity,
                            'subtotal' => $quantity * $salePrice,
                        ]);
                    }
                }

                $orders[] = $order;
            }

            if ($voucher) $voucher->increment('usage_count');
            if ($userId) {
                Cart::where('user_id', $userId)->delete();
            }

            DB::commit();

            $redirectUrl = null;
            if ($validated['payment_method'] === 'vnpay') {
                $redirectUrl = \App\Services\VnpayService::createPaymentUrl([
                    'user_id' => $userId ?? 0,
                    'order_ids' => collect($orders)->pluck('id')->toArray(),
                    'amount' => $totalFinalAmount,
                    'return_url' => route('vnpay.return')
                ]);
            }

            return response()->json([
                'message' => 'Đặt hàng thành công',
                'order_ids' => collect($orders)->pluck('id'),
                'payment_method' => $validated['payment_method'],
                'redirect_url' => $redirectUrl
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Checkout error', [
                'message' => $e->getMessage(),
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
}
