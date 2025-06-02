<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        $orderDetailId = $request->query('order_detail_id');
        $perPage = $request->query('per_page', 10);

        $query = Review::with(['user', 'orderDetail']);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($orderDetailId) {
            $query->where('order_detail_id', $orderDetailId);
        }

        $reviews = $query->paginate($perPage);

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'order_detail_id' => 'required|exists:order_details,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string',
            'image' => 'nullable|string',
            'status' => 'in:pending,approved,rejected',
        ]);

        // Kiểm tra đơn hàng có thuộc về user và đã giao chưa
        $orderDetail = \App\Models\OrderDetail::with('order')->find($validated['order_detail_id']);

        if (!$orderDetail || $orderDetail->order->user_id !== $validated['user_id']) {
            return response()->json(['message' => 'Bạn không có quyền đánh giá sản phẩm này'], 403);
        }

        if ($orderDetail->order->order_status !== 'Delivered') {
            return response()->json(['message' => 'Chỉ được đánh giá sau khi nhận hàng'], 403);
        }

        $review = Review::create($validated);

        return response()->json(['message' => 'Thêm đánh giá thành công', 'data' => $review], 201);
    }

    public function show($id)
    {
        $review = Review::with(['user', 'orderDetail'])->find($id);

        if (!$review) {
            return response()->json(['message' => 'Đánh giá không tồn tại'], 404);
        }

        return response()->json($review);
    }

    public function update(Request $request, $id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Đánh giá không tồn tại'], 404);
        }

        $validated = $request->validate([
            'rating' => 'nullable|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
        ]);

        $review->update($validated);

        return response()->json(['message' => 'Cập nhật đánh giá thành công', 'data' => $review]);
    }

    public function destroy($id)
    {
        $review = Review::find($id);

        if (!$review) {
            return response()->json(['message' => 'Đánh giá không tồn tại'], 404);
        }

        $review->delete();

        return response()->json(['message' => 'Xoá đánh giá thành công']);
    }
}
