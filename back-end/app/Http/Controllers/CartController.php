<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $carts = Cart::with('product')->where('user_id', $userId)->where('is_active', true)->get();
        return response()->json($carts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1',
        ]);

        $cart = Cart::create([
            'user_id'    => Auth::id(),
            'product_id' => $validated['product_id'],
            'quantity'   => $validated['quantity'],
            'is_active'  => true,
        ]);

        return response()->json($cart, 201);
    }

    public function update(Request $request, $id)
    {
        $cart = Cart::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'quantity'  => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ]);

        $cart->update($validated);

        return response()->json($cart);
    }

    public function destroy($id)
    {
        $cart = Cart::where('user_id', Auth::id())->findOrFail($id);
        $cart->delete();

        return response()->json(['message' => 'Xóa sản phẩm khỏi giỏ hàng thành công']);
    }
}
