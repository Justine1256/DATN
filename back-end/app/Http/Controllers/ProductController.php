<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
public function show($shopslug, $productslug)
{
    $product = Product::where('slug', $productslug)
        ->whereHas('shop', function($query) use ($shopslug) {
            $query->where('slug', $shopslug);
        })
        ->first();

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
    $limit = $request->input('limit', 8);

    $products = Product::with(['shop:id,slug']) // chỉ lấy slug
        ->where('status', 'activated')
        ->orderByDesc('sold')
        ->take($limit)
        ->get();

    // Gắn thêm shop_slug vào từng product
    $products->each(function ($product) {
        $product->shop_slug = $product->shop->slug ?? null;
        unset($product->shop); // xóa object shop nếu không cần
    });

    return response()->json([
        'message' => 'Sản phẩm bán chạy nhất',
        'products' => $products
    ]);
}


    // Lấy danh sách sản phẩm giảm giá nhiều nhất
public function topDiscountedProducts(Request $request)
{
    $limit = $request->input('limit', 8);

    $products = Product::with('shop') // 👈 Load quan hệ shop
        ->whereNotNull('sale_price')
        ->whereColumn('sale_price', '<', 'price')
        ->where('status', 'activated')
        ->get()
        ->sortByDesc(function ($product) {
            return (($product->price - $product->sale_price) / $product->price) * 100;
        })
        ->take($limit)
        ->values();

    // Gắn thêm shop_slug vào từng sản phẩm
    $products->transform(function ($product) {
        $product->shop_slug = $product->shop->slug ?? null;
        return $product;
    });

    return response()->json([
        'message' => 'Sản phẩm ưu đãi nhiều nhất',
        'products' => $products
    ]);
}

    // Lấy danh sách sản phẩm mới nhất
public function newProducts(Request $request)
{
    $limit = $request->input('limit', 8);

    $products = Product::with('shop') // Load quan hệ shop
        ->where('status', 'activated')
        ->orderBy('created_at', 'desc')
        ->take($limit)
        ->get();

    // Gắn thêm shop_slug
    $products->transform(function ($product) {
        $product->shop_slug = $product->shop->slug ?? null;
        return $product;
    });

    return response()->json([
        'message' => 'Danh sách sản phẩm mới nhất',
        'products' => $products
    ]);
}

    // Lấy danh sách sản phẩm của shop
public function showShopProducts(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['error' => 'User chưa có shop.'], 403);
    }

    $shopId = $user->shop->id;

    $perPage = $request->query('per_page', 5);

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
        // Thêm sản phẩm mới bởi shop
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
        // Cập nhật sản phẩm bởi shop
public function update(Request $request, $id)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['status' => false, 'message' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'], 403);
    }

    $shopId = $user->shop->id;

    $product = Product::where('id', $id)->where('shop_id', $shopId)->first();

    if (!$product) {
        return response()->json(['status' => false, 'message' => 'Không tìm thấy sản phẩm trong cửa hàng của bạn.'], 404);
    }

    // Validation
    $validator = Validator::make($request->all(), [
        'category_id' => 'sometimes|exists:categories,id',
        'name' => 'sometimes|string|max:255',
        'description' => 'nullable|string',
        'price' => 'sometimes|numeric|min:0',
        'sale_price' => 'nullable|numeric|min:0|lte:price',
        'stock' => 'nullable|integer|min:0',
        'image' => 'nullable|array',
        'image.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        'option1' => 'nullable|string|max:255',
        'value1' => 'nullable|string|max:255',
        'option2' => 'nullable|string|max:255',
        'value2' => 'nullable|string|max:255',
        'status' => 'sometimes|in:activated,deleted',
    ], [
        'sale_price.lte' => 'Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc.',
        'image.*.image' => 'Mỗi tệp phải là hình ảnh hợp lệ.',
        'image.*.max' => 'Kích thước ảnh không vượt quá 2MB.',
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
    }

    $data = $validator->validated();

    // Kiểm tra trùng tên trong shop (nếu đổi tên)
    if (isset($data['name'])) {
        $slug = Str::slug($data['name']);
        $exists = Product::where('shop_id', $shopId)
            ->where('slug', $slug)
            ->where('id', '!=', $product->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => false,
                'message' => 'Tên sản phẩm đã tồn tại trong cửa hàng. Vui lòng chọn tên khác.'
            ], 422);
        }

        $data['slug'] = $slug;
    }

    // Kiểm tra giá khuyến mãi < giá gốc (nếu có)
    if (isset($data['sale_price'])) {
        $price = $data['price'] ?? $product->price;
        if ($data['sale_price'] > $price) {
            return response()->json([
                'status' => false,
                'message' => 'Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc.',
            ], 422);
        }
    }

    // Xử lý ảnh mới nếu có
    if ($request->hasFile('image')) {
        $imagePaths = [];
        foreach ($request->file('image') as $image) {
            $path = $image->store('products', 'public');
            $imagePaths[] = $path;
        }

        $data['image'] = $imagePaths;
    }

    // Cập nhật sản phẩm
    $product->update($data);

    // Trả về response
    return response()->json([
        'status' => true,
        'message' => 'Cập nhật sản phẩm thành công.',
        'data' => [
            ...$product->fresh()->toArray(),
            'image' => is_string($product->image) ? json_decode($product->image) : $product->image,
        ]
    ]);
}

public function destroy(Request $request, $id)
{
    $user = $request->user();

    // Kiểm tra đăng nhập và có cửa hàng
    if (!$user || !$user->shop) {
        return response()->json([
            'status' => false,
            'message' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'
        ], 403);
    }

    $shopId = $user->shop->id;

    // Tìm sản phẩm theo id và shop_id
    $product = Product::where('id', $id)->where('shop_id', $shopId)->first();

    if (!$product) {
        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy sản phẩm trong cửa hàng của bạn.'
        ], 404);
    }

    // Xóa sản phẩm
    $product->delete();

    return response()->json([
        'status' => true,
        'message' => 'Xóa sản phẩm thành công.'
    ]);
}
    // Khôi phục sản phẩm đã xóa mềm bởi shop
public function restoreProduct(Request $request, $id)
{
    $user = $request->user();

    // Kiểm tra đăng nhập và có cửa hàng
    if (!$user || !$user->shop) {
        return response()->json([
            'status' => false,
            'message' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'
        ], 403);
    }

    $shopId = $user->shop->id;

    // Tìm sản phẩm đã bị xóa mềm theo id và shop_id
    $product = Product::onlyTrashed()
        ->where('id', $id)
        ->where('shop_id', $shopId)
        ->first();

    if (!$product) {
        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy sản phẩm bị xóa mềm trong cửa hàng của bạn.'
        ], 404);
    }

    // Khôi phục sản phẩm
    $product->restore();

    return response()->json([
        'status' => true,
        'message' => 'Khôi phục sản phẩm thành công.'
    ]);
}


}
