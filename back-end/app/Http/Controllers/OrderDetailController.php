<?php

namespace App\Http\Controllers;

use App\Models\OrderDetail;
use Illuminate\Http\Request;

class OrderDetailController extends Controller
{
    public function index(Request $request)
    {
        // Lấy query param filter nếu có
        $orderId = $request->query('order_id');
        $productId = $request->query('product_id');
        $perPage = $request->query('per_page', 10); // số bản ghi mỗi trang, mặc định 10

        // Tạo query builder
        $query = OrderDetail::with(['product', 'order']);

        // Nếu có filter order_id thì thêm điều kiện
        if ($orderId) {
            $query->where('order_id', $orderId);
        }

        // Nếu có filter product_id thì thêm điều kiện
        if ($productId) {
            $query->where('product_id', $productId);
        }

        // Phân trang và trả về JSON
        $details = $query->paginate($perPage);

        return response()->json($details);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'product_id' => 'required|exists:products,id',
            'price_at_time' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $detail = OrderDetail::create($validated);
        return response()->json(['message' => 'Thêm chi tiết đơn hàng thành công', 'data' => $detail], 201);
    }

    public function show($id)
    {
        $detail = OrderDetail::with(['product', 'order'])->find($id);
        if (!$detail) {
            return response()->json(['message' => 'Chi tiết đơn hàng không tồn tại'], 404);
        }

        return response()->json($detail);
    }

    public function update(Request $request, $id)
    {
        $detail = OrderDetail::find($id);
        if (!$detail) {
            return response()->json(['message' => 'Chi tiết đơn hàng không tồn tại'], 404);
        }

        $validated = $request->validate([
            'price_at_time' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|integer|min:1',
            'subtotal' => 'nullable|numeric|min:0',
        ]);

        $detail->update($validated);
        return response()->json(['message' => 'Cập nhật thành công', 'data' => $detail]);
    }

    public function destroy($id)
    {
        $detail = OrderDetail::find($id);
        if (!$detail) {
            return response()->json(['message' => 'Chi tiết đơn hàng không tồn tại'], 404);
        }

        $detail->delete();
        return response()->json(['message' => 'Xoá thành công']);
    }
}
