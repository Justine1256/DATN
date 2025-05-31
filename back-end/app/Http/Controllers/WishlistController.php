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

        $wishlist = Wishlist::firstOrCreate([
            'user_id' => Auth::id(),
            'product_id' => $request->product_id,
        ]);

        return response()->json($wishlist, 201);
    }

    // Xoá sản phẩm khỏi wishlist
    public function destroy($product_id)
    {
        $deleted = Wishlist::where('user_id', Auth::id())
            ->where('product_id', $product_id)
            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Removed from wishlist']);
        }

        return response()->json(['message' => 'Not found'], 404);
    }
}
