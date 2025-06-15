<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    // 1. Lấy danh sách tất cả voucher
    public function index()
    {
        $vouchers = Voucher::all();
        return response()->json($vouchers);
    }

    // 2. Tạo mới voucher
    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:vouchers,code',
            'discount_value' => 'required|numeric|min:0',
            'discount_type' => 'required|in:percent,fixed',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'created_by' => 'nullable|exists:users,id',
        ]);

        $voucher = Voucher::create($request->all());
        return response()->json(['message' => 'Tạo voucher thành công', 'data' => $voucher], 201);
    }

    // 3. Lấy chi tiết một voucher theo ID
    public function show($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json(['message' => 'Không tìm thấy voucher'], 404);
        }

        return response()->json($voucher);
    }

    // 4. Cập nhật voucher
    public function update(Request $request, $id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json(['message' => 'Không tìm thấy voucher'], 404);
        }

        $request->validate([
            'code' => 'sometimes|string|unique:vouchers,code,' . $id,
            'discount_value' => 'sometimes|numeric|min:0',
            'discount_type' => 'sometimes|in:percent,fixed',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'created_by' => 'nullable|exists:users,id',
        ]);

        $voucher->update($request->all());
        return response()->json(['message' => 'Cập nhật voucher thành công', 'data' => $voucher]);
    }

    // 5. Xoá voucher
    public function destroy($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json(['message' => 'Không tìm thấy voucher'], 404);
        }

        $voucher->delete();
        return response()->json(['message' => 'Xoá voucher thành công']);
    }

    // 6. Kiểm tra và áp dụng mã giảm giá (đã có)
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
