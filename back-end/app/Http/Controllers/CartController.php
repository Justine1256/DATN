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
        'quantity'   => 'nullable|integer|min:1',
    ]);

    $userId = Auth::id();
    $quantity = $validated['quantity'] ?? 1;

    // Kiểm tra sản phẩm có status = 'activated' hay không
    $product = \App\Models\Product::where('id', $validated['product_id'])
        ->where('status', 'activated')
        ->first();

    if (!$product) {
        return response()->json([
            'message' => 'Sản phẩm không tồn tại hoặc đã bị xóa/bị ẩn'
        ], 404);
    }

    $cart = Cart::where('user_id', $userId)
        ->where('product_id', $validated['product_id'])
        ->where('is_active', true)
        ->first();

    if ($cart) {
        $cart->quantity += $quantity;
        $cart->save();
    } else {
        $cart = Cart::create([
            'user_id'    => $userId,
            'product_id' => $validated['product_id'],
            'quantity'   => $quantity,
            'is_active'  => true,
        ]);
    }

    return response()->json($cart, 201);
}

    public function update(Request $request, $id)
    {
        $cart = Cart::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'quantity'  => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['quantity'])) {
            $product = $cart->product;
            if ($validated['quantity'] > $product->stock) {
                return response()->json([
                    'message' => 'Số lượng vượt quá tồn kho (' . $product->stock . ')'
                ], 400);
            }
        }

        $cart->update($validated);

        return response()->json($cart);
    }
    public function getTotal()
    {
        $userId = Auth::id();
        $carts = Cart::with('product')->where('user_id', $userId)->where('is_active', true)->get();

        $total = 0;
        foreach ($carts as $cart) {
            $total += $cart->quantity * $cart->product->price;
        }

        return response()->json(['total' => $total]);
    }


    public function destroy($id)
    {
        $cart = Cart::where('user_id', Auth::id())->findOrFail($id);
        $cart->delete();

        return response()->json(['message' => 'Xóa sản phẩm khỏi giỏ hàng thành công']);
    }
}
