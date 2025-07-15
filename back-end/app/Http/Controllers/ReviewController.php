<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\OrderDetail;


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
            'order_detail_id' => 'required|exists:order_details,id',
            'rating'          => 'required|integer|min:1|max:5',
            'comment'         => 'required|string|min:10',
            'images'          => 'nullable|array',
            'images.*'        => 'url',
        ]);

        $user = Auth::user();

        $orderDetail = OrderDetail::with('order')->find($validated['order_detail_id']);

        if (!$orderDetail || $orderDetail->order->user_id !== $user->id) {
            return response()->json(['message' => 'Bạn không có quyền đánh giá sản phẩm này'], 403);
        }

        if (strtolower($orderDetail->order->order_status) !== 'delivered') {
            return response()->json(['message' => 'Chỉ được đánh giá sau khi nhận hàng'], 403);
        }

        if (Review::where('order_detail_id', $validated['order_detail_id'])->exists()) {
            return response()->json(['message' => 'Sản phẩm này đã được đánh giá rồi'], 403);
        }

        $review = Review::create([
            'user_id'         => $user->id,
            'order_detail_id' => $validated['order_detail_id'],
            'rating'          => $validated['rating'],
            'comment'         => $validated['comment'],
            'image'           => !empty($validated['images']) ? json_encode($validated['images']) : null,
            'status'          => 'approved',
        ]);

        return response()->json([
            'message' => 'Thêm đánh giá thành công',
            'data'    => [
                'id'          => $review->id,
                'user_id'     => $review->user_id,
                'order_detail_id' => $review->order_detail_id,
                'rating'      => $review->rating,
                'comment'     => $review->comment,
                'status'      => $review->status,
                'created_at'  => $review->created_at,
                'updated_at'  => $review->updated_at,
                'images'      => $review->images, // ✅ từ accessor
            ]
        ], 201);
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
            'image' => 'nullable|string|starts_with:http,https', // FE gửi URL ảnh
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
    public function getByProduct($id)
{
    $reviews = Review::with(['user', 'orderDetail'])
        ->whereHas('orderDetail', function ($q) use ($id) {
            $q->where('product_id', $id);
        })
        ->orderByDesc('created_at')
        ->get();

    $data = $reviews->map(function ($review) {
        return [
            'id' => $review->id,
            'user' => [
                'name' => $review->user->name,
                'avatar' => $review->user->avatar,
            ],
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at,
            'images' => $review->images, // 👈 từ accessor
        ];
    });

    return response()->json(['data' => $data]);
}
}
