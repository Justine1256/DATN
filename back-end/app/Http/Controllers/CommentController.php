<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    // ✅ Thêm bình luận cho sản phẩm
    public function addCommentIntoProduct(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Bạn chưa đăng nhập.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'content' => 'required|string|max:1000',
            'image' => 'nullable|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $comment = Comment::create([
            'user_id' => $user->id,
            'product_id' => $request->product_id,
            'content' => $request->content,
            'image' => $request->image,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json([
            'message' => 'Bình luận thành công.',
            'comment' => $comment,
        ], 201);
    }

    // ✅ Lấy danh sách bình luận theo sản phẩm
    public function getCommentsInProduct($productId)
    {
        $comments = Comment::with(['user', 'replies.user'])
            ->where('product_id', $productId)
            ->whereNull('parent_id')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'comments' => $comments
        ]);
    }

    // (Tuỳ chọn) ✅ Xoá mềm bình luận
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $comment = Comment::where('id', $id)->where('user_id', $user->id)->first();

        if (!$comment) {
            return response()->json(['message' => 'Không tìm thấy bình luận của bạn.'], 404);
        }

        $comment->delete();

        return response()->json(['message' => 'Đã xoá bình luận.']);
    }

    // (Tuỳ chọn) ✅ Khôi phục bình luận
    public function restore(Request $request, $id)
    {
        $user = $request->user();
        $comment = Comment::onlyTrashed()->where('id', $id)->where('user_id', $user->id)->first();

        if (!$comment) {
            return response()->json(['message' => 'Không tìm thấy bình luận đã xoá.'], 404);
        }

        $comment->restore();

        return response()->json(['message' => 'Khôi phục bình luận thành công.']);
    }

    // (Tuỳ chọn) ✅ Cập nhật bình luận
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $comment = Comment::where('id', $id)->where('user_id', $user->id)->first();

        if (!$comment) {
            return response()->json(['message' => 'Không tìm thấy bình luận của bạn.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000',
            'image' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $comment->update($validator->validated());

        return response()->json(['message' => 'Cập nhật bình luận thành công.', 'comment' => $comment]);
    }
}
