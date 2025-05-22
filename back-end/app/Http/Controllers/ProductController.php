<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // Danh sách sản phẩm
    public function index()
    {
        return response()->json(Product::all());
    }

    // Chi tiết 1 sản phẩm
    public function show($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }
        return response()->json($product);
    }

    // Tạo mới sản phẩm
public function store(Request $request)
{
    $validated = $request->validate([
        'category_id' => 'required|exists:categories,id',
        'shop_id' => 'required|exists:shops,id',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'sale_price' => 'nullable|numeric|min:0|lt:price', // sale_price < price
        'stock' => 'nullable|integer|min:0',
        'sold' => 'nullable|integer|min:0',
        'image' => 'nullable|string|max:255',
        'option1' => 'nullable|string|max:255',
        'value1' => 'nullable|string|max:255',
        'option2' => 'nullable|string|max:255',
        'value2' => 'nullable|string|max:255',
        'status' => 'nullable|in:activated,deleted',
    ], [
        'sale_price.lt' => 'Giá khuyến mãi phải nhỏ hơn giá gốc.',
        'category_id.exists' => 'Danh mục không hợp lệ.',
        'shop_id.exists' => 'Cửa hàng không hợp lệ.',
    ]);

    $product = Product::create($validated);

    return response()->json([
        'message' => 'Tạo sản phẩm thành công!',
        'product' => $product
    ], 201);
}


    // Cập nhật sản phẩm
public function update(Request $request, $id)
{
    $product = Product::find($id);

    if (!$product) {
        return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
    }

    // Lưu giá hiện tại để kiểm tra nếu không gửi 'price'
    $currentPrice = $product->price;

    $validated = $request->validate([
        'category_id' => 'sometimes|exists:categories,id',
        'shop_id' => 'sometimes|exists:shops,id',
        'name' => 'sometimes|string|max:255',
        'description' => 'nullable|string',
        'price' => 'sometimes|numeric|min:0',
        'sale_price' => [
            'nullable',
            'numeric',
            'min:0',
            function ($attribute, $value, $fail) use ($request, $currentPrice) {
                $priceToCompare = $request->input('price', $currentPrice);
                if ($value >= $priceToCompare) {
                    $fail('Giá khuyến mãi phải nhỏ hơn giá gốc.');
                }
            }
        ],
        'stock' => 'nullable|integer|min:0',
        'sold' => 'nullable|integer|min:0',
        'image' => 'nullable|string|max:255',
        'option1' => 'nullable|string|max:255',
        'value1' => 'nullable|string|max:255',
        'option2' => 'nullable|string|max:255',
        'value2' => 'nullable|string|max:255',
        'status' => 'sometimes|in:activated,deleted',
    ], [
        'category_id.exists' => 'Danh mục không hợp lệ.',
        'shop_id.exists' => 'Cửa hàng không hợp lệ.',
    ]);

    $product->update($validated);

    return response()->json([
        'message' => 'Cập nhật sản phẩm thành công!',
        'product' => $product,
    ]);
}

    // Xóa sản phẩm
    public function delete($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        $product->delete();
        return response()->json(['message' => 'Đã xóa sản phẩm']);
    }
    // Lấy danh sách sản phẩm bán chạy
        public function bestSellingProducts(Request $request)
    {
        $limit = $request->input('limit', 10); // giới hạn số sản phẩm trả về

        $products = Product::where('status', 'activated')
            ->orderByDesc('sold')
            ->take($limit)
            ->get();

        return response()->json([
            'message' => 'Sản phẩm bán chạy nhất',
            'products' => $products
        ]);
    }
    // Lấy danh sách sản phẩm giảm giá nhiều nhất
    public function topDiscountedProducts(Request $request)
    {
        $limit = $request->input('limit', 10);

        $products = Product::whereNotNull('sale_price')
            ->whereColumn('sale_price', '<', 'price')
            ->where('status', 'activated')
            ->get()
            ->sortByDesc(function ($product) {
                return (($product->price - $product->sale_price) / $product->price) * 100;
            })
            ->take($limit)
            ->values(); // reset index

        return response()->json([
            'message' => 'Sản phẩm ưu đãi nhiều nhất',
            'products' => $products
        ]);
    }
}
