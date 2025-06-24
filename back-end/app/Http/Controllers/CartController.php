<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Product;
use App\Models\ProductVariant;

class CartController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $carts = Cart::with('product', 'variant')->where('user_id', $userId)->where('is_active', true)->get();
        return response()->json($carts);
    }

public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'product_id'     => 'required|exists:products,id',
            'variant_id'     => 'required|exists:product_variants,id',
            'quantity'       => 'nullable|integer|min:1',
            'product_option' => 'nullable|string|max:255',
            'product_value'  => 'nullable|string|max:255',
        ]);

        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Người dùng chưa đăng nhập'], 401);
        }

        $quantity = $validated['quantity'] ?? 1;

        // 1. Lấy sản phẩm
        $product = Product::where('id', $validated['product_id'])
            ->where('status', 'activated')
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'], 404);
        }

        // 2. Lấy biến thể
        $variant = ProductVariant::where('id', $validated['variant_id'])
            ->where('product_id', $product->id)
            ->first();

        if (!$variant) {
            return response()->json(['message' => 'Biến thể không hợp lệ cho sản phẩm này'], 400);
        }

        // 3. Lấy thông tin biến thể để hiển thị
        $product_option = $validated['product_option'] ?? ($variant->option1 . ' - ' . $variant->option2);
        $product_value  = $validated['product_value']  ?? ($variant->value1 . ' - ' . $variant->value2);

        // 4. Kiểm tra tồn tại trong giỏ hàng
        $cart = Cart::where('user_id', $userId)
            ->where('product_id', $product->id)
            ->where('product_option', $variant->option1)
            ->where('product_value', $variant->value1)
            ->where('is_active', true)
            ->first();

        if ($cart) {
            $cart->quantity += $quantity;
            $cart->save();
        } else {
            $cart = Cart::create([
                'user_id'        => $userId,
                'product_id'     => $product->id,
                'variant_id'     => $variant->id, // nếu bạn có thêm cột này
                'quantity'       => $quantity,
                'product_option' => $product_option,
                'product_value'  => $product_value,
                'is_active'      => true,
            ]);
        }

        return response()->json($cart, 201);

    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Đã xảy ra lỗi khi thêm vào giỏ hàng',
            'error'   => $e->getMessage(),
            'line'    => $e->getLine(),
            'file'    => $e->getFile(),
        ], 500);
    }
}



    public function update(Request $request, $id)
    {
        $cart = Cart::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'quantity'  => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
            'product_option'  => 'nullable|string|max:255',
            'product_value'   => 'nullable|string|max:255',
        ]);

        if (isset($validated['quantity'])) {
            if ($cart->variant) {
                if ($validated['quantity'] > $cart->variant->stock) {
                    return response()->json([
                        'message' => 'Số lượng vượt quá tồn kho (' . $cart->variant->stock . ')'
                    ], 400);
                }
            } else {
                if ($validated['quantity'] > $cart->product->stock) {
                    return response()->json([
                        'message' => 'Số lượng vượt quá tồn kho (' . $cart->product->stock . ')'
                    ], 400);
                }
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
            $price = $cart->variant->sale_price ?? $cart->variant->price ?? $cart->product->sale_price ?? $cart->product->price;
            $total += $cart->quantity * $price;
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
