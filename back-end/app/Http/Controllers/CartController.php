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

    // Gắn thủ công dữ liệu "variant" dựa vào product_option và product_value
    $carts->transform(function ($cart) {
        // Tách option và value
        $options = explode(' - ', $cart->product_option ?? '');
        $values = explode(' - ', $cart->product_value ?? '');

        // Tạo một object giả để trả về FE
        $variant = [
            'option1' => $options[0] ?? null,
            'value1'  => $values[0] ?? null,
            'option2' => $options[1] ?? null,
            'value2'  => $values[1] ?? null,
            'price'   => null,
            'sale_price' => null,
        ];

        // Nếu cần, bạn có thể truy từ bảng `product_variants` để lấy giá:
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
                'product_id'   => 'required|exists:products,id',
                'variant_id'   => 'required|exists:product_variants,id',
                'quantity'     => 'nullable|integer|min:1',
            ]);

            $userId = Auth::id();
            if (!$userId) {
                return response()->json(['message' => 'Người dùng chưa đăng nhập'], 401);
            }

            $quantity = $validated['quantity'] ?? 1;

            // 1. Kiểm tra sản phẩm có tồn tại và đang kích hoạt không
            $product = Product::where('id', $validated['product_id'])
                ->where('status', 'activated')
                ->first();

            if (!$product) {
                return response()->json(['message' => 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'], 404);
            }

            // 2. Kiểm tra biến thể hợp lệ
            $variant = ProductVariant::where('id', $validated['variant_id'])
                ->where('product_id', $product->id)
                ->first();

            if (!$variant) {
                return response()->json(['message' => 'Biến thể không hợp lệ cho sản phẩm này'], 400);
            }

            // 3. Kiểm tra xem đã có bản ghi trong giỏ chưa (KHÔNG kiểm theo variant_id nữa)
            $cartQuery = Cart::where('user_id', $userId)
                ->where('product_id', $product->id)
                ->where('product_option', $variant->option1)
                ->where('product_value', $variant->value1)
                ->where('is_active', true);

            $cart = $cartQuery->first();

            if ($cart) {
                $cart->quantity += $quantity;
                $cart->save();
            } else {
                $cart = Cart::create([
                    'user_id'        => $userId,
                    'product_id'     => $product->id,
                    'quantity'       => $quantity,
                    'product_option' => $variant->option1,
                    'product_value'  => $variant->value1,
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
