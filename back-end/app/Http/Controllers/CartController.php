<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $carts = Cart::with('product.shop')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

$carts->transform(function ($cart) {
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

    // ✅ Nếu có variant_id → lấy theo ID
    if ($cart->variant_id) {
        $matched = ProductVariant::find($cart->variant_id);
    } else {
        // 🔍 Nếu không có → tìm theo value
        $query = ProductVariant::where('product_id', $cart->product_id);
        if (!empty($values[0])) $query->where('value1', $values[0]);
        if (!empty($values[1])) $query->where('value2', $values[1]);
        $matched = $query->first();
    }

    if ($matched) {
        $variant['price'] = $matched->price;
        $variant['sale_price'] = $matched->sale_price;
    } else {
        // ✅ Fallback: không có biến thể → dùng giá từ product gốc
        $variant['price'] = $cart->product->price;
        $variant['sale_price'] = $cart->product->sale_price;
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
        $replaceQuantity = $request->boolean('replace_quantity', false);

        $product = Product::where('id', $validated['product_id'])
            ->where('status', 'activated')
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa'], 404);
        }

        $hasVariants = ProductVariant::where('product_id', $product->id)->exists();

        $productOption = null;
        $productValue  = null;

        // ✅ Nếu có variant_id được truyền
        if (array_key_exists('variant_id', $validated) && $validated['variant_id']) {
            $variant = ProductVariant::where('id', $validated['variant_id'])
                ->where('product_id', $product->id)
                ->first();

            if (!$variant) {
                return response()->json(['message' => 'Biến thể không hợp lệ cho sản phẩm này'], 400);
            }

            // Ghép chuỗi từ biến thể
            $productOption = trim(implode(' - ', array_filter([$product->option1, $product->option2])));
            $productValue  = trim(implode(' - ', array_filter([$variant->value1, $variant->value2])));
        } else {
            // ✅ Không có variant_id, dùng dữ liệu từ product gốc
            $hasValues = $product->value1 || $product->value2;

            if ($hasVariants && !$hasValues) {
                // ❌ Có biến thể nhưng không có value từ product → phải chọn variant
                return response()->json(['message' => 'Vui lòng chọn biến thể cụ thể cho sản phẩm này'], 400);
            }

            // Ghép chuỗi từ product gốc
            $productOption = trim(implode(' - ', array_filter([$product->option1, $product->option2])));
            $productValue  = trim(implode(' - ', array_filter([$product->value1, $product->value2])));
        }

        // ✅ Kiểm tra giỏ hàng đã tồn tại chưa
        $cart = Cart::where('user_id', $userId)
            ->where('product_id', $product->id)
            ->where('product_option', $productOption)
            ->where('product_value', $productValue)
            ->where('is_active', true)
            ->first();

        if ($cart) {
            $cart->quantity = $replaceQuantity ? $quantity : $cart->quantity + $quantity;
            $cart->save();
        } else {
            $cart = Cart::create([
                'user_id'        => $userId,
                'product_id'     => $product->id,
                'variant_id'     => $variant->id ?? null,
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

    $carts = Cart::with('product')
        ->where('user_id', $userId)
        ->where('is_active', true)
        ->get();

    // Gắn variant giống logic ở index()
    $carts->transform(function ($cart) {
        $options = explode(' - ', $cart->product_option ?? '');
        $values = explode(' - ', $cart->product_value ?? '');

        $query = ProductVariant::where('product_id', $cart->product_id);
        if (isset($values[0])) $query->where('value1', $values[0]);
        if (isset($values[1])) $query->where('value2', $values[1]);

        $matched = $query->first();

        if ($matched) {
            $cart->variant = [
                'id'         => $matched->id,
                'option1'    => $matched->option1,
                'value1'     => $matched->value1,
                'option2'    => $matched->option2,
                'value2'     => $matched->value2,
                'price'      => $matched->price,
                'sale_price' => $matched->sale_price,
                'stock'      => $matched->stock,
            ];
        } else {
            $cart->variant = null;
        }

        return $cart;
    });

    $total = 0;
    foreach ($carts as $cart) {
        $price = $cart->variant['sale_price']
            ?? $cart->variant['price']
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
    public function storeGuest(Request $request)
{
    $validated = $request->validate([
        'product_id' => 'required|exists:products,id',
        'variant_id' => 'nullable|exists:product_variants,id',
        'quantity'   => 'nullable|integer|min:1',
        'replace_quantity' => 'nullable|boolean'
    ]);

    $quantity = $validated['quantity'] ?? 1;
    $replaceQuantity = $validated['replace_quantity'] ?? false;

    $product = Product::where('id', $validated['product_id'])
        ->where('status', 'activated')
        ->firstOrFail();

    $hasVariants = ProductVariant::where('product_id', $product->id)->exists();

    $productOption = null;
    $productValue  = null;

    if ($validated['variant_id']) {
        $variant = ProductVariant::where('id', $validated['variant_id'])
            ->where('product_id', $product->id)
            ->firstOrFail();

        $productOption = trim(implode(' - ', array_filter([$product->option1, $product->option2])));
        $productValue  = trim(implode(' - ', array_filter([$variant->value1, $variant->value2])));
    } else {
        if ($hasVariants && (!$product->value1 && !$product->value2)) {
            return response()->json(['message' => 'Vui lòng chọn biến thể cho sản phẩm này'], 400);
        }

        $productOption = trim(implode(' - ', array_filter([$product->option1, $product->option2])));
        $productValue  = trim(implode(' - ', array_filter([$product->value1, $product->value2])));
    }

    $cart = session()->get('guest_cart', []);

    $key = $validated['product_id'] . '-' . ($validated['variant_id'] ?? 'null');

    if (isset($cart[$key])) {
        $cart[$key]['quantity'] = $replaceQuantity
            ? $quantity
            : $cart[$key]['quantity'] + $quantity;
    } else {
        $cart[$key] = [
            'product_id' => $product->id,
            'variant_id' => $validated['variant_id'] ?? null,
            'quantity'   => $quantity,
            'name'       => $product->name,
            'image'      => $product->image[0] ?? null,
            'price'      => $product->price,
            'sale_price' => $product->sale_price,
            'value1'     => $validated['variant_id'] ? ($variant->value1 ?? null) : ($product->value1 ?? null),
            'value2'     => $validated['variant_id'] ? ($variant->value2 ?? null) : ($product->value2 ?? null),
        ];
    }

    session()->put('guest_cart', $cart);

    return response()->json([
        'message' => 'Sản phẩm đã được thêm vào giỏ hàng guest',
        'cart' => array_values($cart),
    ]);
}
}
