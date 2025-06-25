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
        $carts = Cart::with('product')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        $carts->transform(function ($cart) {
            // Tách option và value
            $options = explode(' - ', $cart->product_option ?? '');
            $values = explode(' - ', $cart->product_value ?? '');

            $variant = [
                'option1'     => $options[0] ?? null,
                'value1'      => $values[0] ?? null,
                'option2'     => $options[1] ?? null,
                'value2'      => $values[1] ?? null,
                'price'       => null,
                'sale_price'  => null,
            ];

            // Lấy thông tin biến thể nếu có
            $query = ProductVariant::where('product_id', $cart->product_id);
            if (isset($values[0])) $query->where('value1', $values[0]);
            if (isset($values[1])) $query->where('value2', $values[1]);

            $matched = $query->first();
            if ($matched) {
                $variant['price'] = $matched->price;
                $variant['sale_price'] = $matched->sale_price;
            }

            $cart->variant = $variant;
            return $cart;
        });

        return response()->json($carts);
    }

 public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity'   => 'nullable|integer|min:1',
        ]);

        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Người dùng chưa đăng nhập'], 401);
        }

        $quantity = $validated['quantity'] ?? 1;

        // Lấy sản phẩm
        $product = Product::where('id', $validated['product_id'])
            ->where('status', 'activated')
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'], 404);
        }

        // ✅ Kiểm tra sản phẩm có biến thể thật không (từ DB)
        $isVariable = ProductVariant::where('product_id', $product->id)->exists();

        $variant = null;

        if ($isVariable) {
            if (empty($validated['variant_id'])) {
                return response()->json(['message' => 'Vui lòng chọn biến thể của sản phẩm'], 400);
            }

            $variant = ProductVariant::where('id', $validated['variant_id'])
                ->where('product_id', $product->id)
                ->first();

            if (!$variant) {
                return response()->json(['message' => 'Biến thể không hợp lệ cho sản phẩm này'], 400);
            }

            // Gắn lại option từ product (dùng để lưu vào cart)
            $variant->option1 = $product->option1;
            $variant->option2 = $product->option2;
        } else {
            // Sản phẩm đơn (không có biến thể)
            $variant = (object)[
                'option1' => $product->option1,
                'value1'  => $product->value1,
                'option2' => $product->option2,
                'value2'  => $product->value2,
            ];
        }

        // Ghép chuỗi để lưu vào cart
        $productOption = trim(implode(' - ', array_filter([$variant->option1, $variant->option2])));
        $productValue  = trim(implode(' - ', array_filter([$variant->value1, $variant->value2])));

        // Kiểm tra trùng giỏ
        $cart = Cart::where('user_id', $userId)
            ->where('product_id', $product->id)
            ->where('product_option', $productOption)
            ->where('product_value', $productValue)
            ->where('is_active', true)
            ->first();

        if ($cart) {
            $cart->quantity += $quantity;
            $cart->save();
        } else {
            $cart = Cart::create([
                'user_id'        => $userId,
                'product_id'     => $product->id,
                'quantity'       => $quantity,
                'product_option' => $productOption,
                'product_value'  => $productValue,
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
            'quantity'        => 'nullable|integer|min:1',
            'is_active'       => 'nullable|boolean',
            'product_option'  => 'nullable|string|max:255',
            'product_value'   => 'nullable|string|max:255',
        ]);

        if (isset($validated['quantity'])) {
            if ($cart->variant && $cart->variant->stock !== null) {
                if ($validated['quantity'] > $cart->variant->stock) {
                    return response()->json([
                        'message' => 'Số lượng vượt quá tồn kho (' . $cart->variant->stock . ')'
                    ], 400);
                }
            } elseif ($cart->product && $validated['quantity'] > $cart->product->stock) {
                return response()->json([
                    'message' => 'Số lượng vượt quá tồn kho (' . $cart->product->stock . ')'
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
            $price = $cart->variant->sale_price
                ?? $cart->variant->price
                ?? $cart->product->sale_price
                ?? $cart->product->price;
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
