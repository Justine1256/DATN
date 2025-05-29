<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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
        'sale_price' => 'nullable|numeric|min:0|lt:price',
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

    // Tạo slug từ name
    $baseSlug = Str::slug($validated['name']);
    $slug = $baseSlug;
    $shopId = $validated['shop_id'];
    $count = 1;

    // Kiểm tra trùng slug trong cùng 1 shop
    while (Product::where('shop_id', $shopId)->where('slug', $slug)->exists()) {
        $slug = $baseSlug . '-' . $count++;
    }

    $validated['slug'] = $slug;

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
    public function newProducts(Request $request)
{
    $limit = $request->input('limit', 10);

    $products = Product::where('status', 'activated')
        ->orderBy('created_at', 'desc')
        ->take($limit)
        ->get();

    return response()->json([
        'message' => 'Danh sách sản phẩm mới nhất',
        'products' => $products
    ]);
}

public function showShopProducts(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['error' => 'User chưa có shop.'], 403);
    }

    $shopId = $user->shop->id;

    $perPage = $request->query('per_page', 10);

    $products = Product::where('shop_id', $shopId)
        ->where('status', 'activated')
        ->with('category')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage); // <-- paginate thay vì get

    return response()->json([
        'shop_id' => $shopId,
        'products' => $products
    ]);
}

public function addProductByShop(Request $request)
{
    $validator = Validator::make($request->all(), [
        'category_id' => 'required|exists:categories,id',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'sale_price' => 'nullable|numeric|min:0|lte:price',
        'stock' => 'nullable|integer|min:0',
        'image' => 'nullable|array',
        'image.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        'option1' => 'nullable|string|max:255',
        'value1' => 'nullable|string|max:255',
        'option2' => 'nullable|string|max:255',
        'value2' => 'nullable|string|max:255',
    ], [
        'sale_price.lte' => 'Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc.',
        'image.*.image' => 'Mỗi tệp phải là hình ảnh hợp lệ.',
        'image.*.max' => 'Kích thước ảnh không vượt quá 2MB.',
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
    }

    $user = $request->user();
    if (!$user || !$user->shop) {
        return response()->json(['status' => false, 'message' => 'Người dùng chưa có shop.'], 403);
    }
$slug = Str::slug($request->name);

$exists = \App\Models\Product::where('shop_id', $user->shop->id)
    ->where('slug', $slug)
    ->exists();

if ($exists) {
    return response()->json([
        'status' => false,
        'message' => 'Tên sản phẩm đã tồn tại trong cửa hàng. Vui lòng chọn tên khác.'
    ], 422);
}

    $imagePaths = [];
    if ($request->hasFile('image')) {
        foreach ($request->file('image') as $image) {
            $path = $image->store('products', 'public');
            $imagePaths[] = $path;
        }
    }

    $product = \App\Models\Product::create([
        'shop_id' => $user->shop->id,
        'category_id' => $request->category_id,
        'name' => $request->name,
        'slug' => $slug,
        'description' => $request->description,
        'price' => $request->price,
        'sale_price' => $request->sale_price,
        'stock' => $request->stock ?? 0,
        'image' => json_encode($imagePaths), // Lưu JSON
        'option1' => $request->option1,
        'value1' => $request->value1,
        'option2' => $request->option2,
        'value2' => $request->value2,
        'status' => 'activated',
    ]);

    return response()->json([
        'status' => true,
        'message' => 'Sản phẩm đã được thêm thành công.',
        'data' => [
            ...$product->toArray(),
            'image' => $imagePaths, // Trả mảng ảnh cho FE
        ]
    ], 201);
}


}
