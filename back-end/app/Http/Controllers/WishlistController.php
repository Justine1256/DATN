<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    // Lấy danh sách wishlist của user hiện tại
    public function index()
    {
        $wishlists = Wishlist::with('product')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json($wishlists);
    }

    // Thêm sản phẩm vào wishlist
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        // Kiểm tra sản phẩm đã tồn tại trong wishlist chưa
        $exists = Wishlist::where('user_id', Auth::id())
            ->where('product_id', $request->product_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Sản phẩm đã có trong danh sách yêu thích',
            ], 409); // 409 Conflict
        }

        // Nếu chưa có, thêm mới
        $wishlist = Wishlist::create([
            'user_id' => Auth::id(),
            'product_id' => $request->product_id,
        ]);

        return response()->json([
            'message' => 'Đã thêm sản phẩm yêu thích thành công',
            'data' => $wishlist,
        ], 201);
    }


    // Xoá sản phẩm khỏi wishlist
    public function destroy($product_id)
    {
        $deleted = Wishlist::where('user_id', Auth::id())
            ->where('product_id', $product_id)
            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Đã bỏ sản phẩm yêu thích thành công']);
        }

        return response()->json(['message' => 'Không tìm thấy sản phẩm trong danh sách yêu thích'], 404);
    }
}
