<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Address;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        $userId = Auth::id();

        $validated = $request->validate([
            'address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:COD,Card,Wallet,Bank',
            'voucher_code' => 'nullable|string'
        ]);

        $carts = Cart::with('product')->where('user_id', $userId)->where('is_active', true)->get();
        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Giỏ hàng trống'], 400);
        }

        DB::beginTransaction();
        try {
            $address = Address::where('user_id', $userId)->findOrFail($validated['address_id']);
            $subtotalAll = 0;
            foreach ($carts as $cart) {
                if ($cart->quantity > $cart->product->stock) {
                    return response()->json([
                        'message' => 'Sản phẩm "' . $cart->product->name . '" không đủ hàng trong kho'
                    ], 400);
                }
                $subtotalAll += $cart->quantity * $cart->product->price;
            }

            // XỬ LÝ VOUCHER
            $discountAmount = 0;
            $voucher = null;
            $subtotalApplicable = $subtotalAll;

            if (!empty($validated['voucher_code'])) {
                $voucher = Voucher::where('code', $validated['voucher_code'])
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now())
                    ->first();

                if (!$voucher) {
                    return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
                }

                // Kiểm tra số lượt sử dụng
                if ($voucher->usage_limit && $voucher->usage_count >= $voucher->usage_limit) {
                    return response()->json(['message' => 'Mã giảm giá đã được sử dụng hết lượt'], 400);
                }

                // Kiểm tra voucher dành riêng cho user
                $userVoucherCount = DB::table('voucher_users')->where('voucher_id', $voucher->id)->count();
                if ($userVoucherCount > 0) {
                    $userVoucherExists = DB::table('voucher_users')
                        ->where('voucher_id', $voucher->id)
                        ->where('user_id', $userId)
                        ->exists();

                    if (!$userVoucherExists) {
                        return response()->json(['message' => 'Mã giảm giá không dành cho bạn'], 400);
                    }
                }

                // Kiểm tra voucher áp dụng cho danh mục sản phẩm
                $applicableCategoryIds = DB::table('voucher_categories')
                    ->where('voucher_id', $voucher->id)
                    ->pluck('category_id')
                    ->toArray();

                if (count($applicableCategoryIds) > 0) {
                    $subtotalApplicable = 0;
                    foreach ($carts as $cart) {
                        if (in_array($cart->product->category_id, $applicableCategoryIds)) {
                            $subtotalApplicable += $cart->quantity * $cart->product->price;
                        }
                    }

                    if ($subtotalApplicable < $voucher->min_order_value) {
                        return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 400);
                    }
                } else {
                    if ($subtotalApplicable < $voucher->min_order_value) {
                        return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 400);
                    }
                }

                // Tính giá trị giảm
                if ($voucher->discount_type === 'percent') {
                    $discountAmount = min(
                        $voucher->discount_value / 100 * $subtotalApplicable,
                        $voucher->max_discount_value ?? $subtotalApplicable
                    );
                } else {
                    $discountAmount = min($voucher->discount_value, $subtotalApplicable);
                }
            }

            // Chia đơn theo shop
            $cartsByShop = $carts->groupBy(function ($cart) {
                return $cart->product->shop_id;
            });

            $orders = [];
            foreach ($cartsByShop as $shopId => $shopCarts) {
                $shopSubtotal = 0;
                foreach ($shopCarts as $cart) {
                    $shopSubtotal += $cart->quantity * $cart->product->price;
                }

                $shopDiscount = $voucher && $subtotalApplicable > 0
                    ? ($shopSubtotal / $subtotalApplicable) * $discountAmount
                    : 0;

                $finalAmount = $shopSubtotal - $shopDiscount;

                $order = Order::create([
                    'user_id' => $userId,
                    'shop_id' => $shopId,
                    'final_amount' => $finalAmount,
                    'total_amount' => $shopSubtotal,
                    'payment_method' => $validated['payment_method'],
                    'payment_status' => 'Pending',
                    'order_status' => 'Pending',
                    'shipping_status' => 'Pending',
                    'shipping_address' => $address->address,
                ]);

                foreach ($shopCarts as $cart) {
                    OrderDetail::create([
                        'order_id' => $order->id,
                        'product_id' => $cart->product_id,
                        'price_at_time' => $cart->product->price,
                        'quantity' => $cart->quantity,
                        'subtotal' => $cart->quantity * $cart->product->price,
                    ]);
                    $cart->product->decrement('stock', $cart->quantity);
                }

                $orders[] = $order;
            }

            // Tăng usage_count nếu voucher được sử dụng
            if ($voucher) {
                $voucher->increment('usage_count');
            }

            // Xoá giỏ hàng
            Cart::where('user_id', $userId)->where('is_active', true)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Tạo đơn hàng thành công cho nhiều shop',
                'order_ids' => collect($orders)->pluck('id'),
                'payment_method' => $validated['payment_method'],
                'redirect_url' => null
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
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
}
