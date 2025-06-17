<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Services\ContentModerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    // ✅ Thêm bình luận cho sản phẩm
public function addCommentIntoProduct(Request $request, $shopslug, $productslug, ContentModerationService $moderation)
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Bạn chưa đăng nhập.'], 403);
    }

    $product = \App\Models\Product::where('slug', $productslug)
        ->whereHas('shop', function ($query) use ($shopslug) {
            $query->where('slug', $shopslug);
        })->first();

    if (!$product) {
        return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
    }

    $validator = Validator::make($request->all(), [
        'content' => 'required|string|max:1000',
        'image' => 'nullable|string',
        'parent_id' => 'nullable|exists:comments,id',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // ✅ Check AI
    if (!$moderation->check($request->content)) {
        return response()->json(['message' => 'Nội dung vi phạm tiêu chuẩn.'], 400);
    }

    $commentId = DB::table('comments')->insertGetId([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'content' => $request->content,
        'image' => $request->image,
        'parent_id' => $request->parent_id,
        'created_at' => now(),
        'updated_at' => null,
    ]);

    $comment = Comment::find($commentId);

    return response()->json([
        'message' => 'Bình luận thành công.',
        'comment' => $comment,
    ], 201);
}


    // ✅ Lấy danh sách bình luận theo sản phẩm
public function getCommentsInProduct($shopslug, $productslug)
{
    $product = \App\Models\Product::where('slug', $productslug)
        ->whereHas('shop', function ($query) use ($shopslug) {
            $query->where('slug', $shopslug);
        })->first();

    if (!$product) {
        return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
    }

    $comments = Comment::with(['user', 'replies.user'])
        ->where('product_id', $product->id)
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
