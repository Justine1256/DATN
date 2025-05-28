<?php
namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    // Kiểm tra mã voucher
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'subtotal' => 'required|numeric|min:0'
        ]);

        $voucher = Voucher::where('code', $request->code)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$voucher) {
            return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
        }

        if ($request->subtotal < $voucher->min_order_value) {
            return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu'], 400);
        }

        if ($voucher->usage_limit && $voucher->usage_count >= $voucher->usage_limit) {
            return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);
        }

        // Tính giảm
        $discount = 0;
        if ($voucher->discount_type === 'percent') {
            $discount = min($voucher->discount_value / 100 * $request->subtotal, $voucher->max_discount_value ?? $request->subtotal);
        } else {
            $discount = min($voucher->discount_value, $request->subtotal);
        }

        return response()->json([
            'message' => 'Áp dụng mã giảm giá thành công',
            'voucher_id' => $voucher->id,
            'discount_amount' => $discount
        ]);
    }
}
