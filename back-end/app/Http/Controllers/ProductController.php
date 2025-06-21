<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
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
    $product = Product::with([
        'shop',
        'category.parent',    // Load category + parent
        'variants'            // Load danh sách các variant của sp
    ])
    ->where('slug', $productslug)
    ->whereHas('shop', function($query) use ($shopslug) {
        $query->where('slug', $shopslug);
    })
    ->first();

    if (!$product) {
        return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
    }

    // Chuyển json ảnh cover thành array để FE dễ dùng
    $product->image = json_decode($product->image, true);

    // Nếu trong variants có image dạng json cũng decode luôn
    foreach ($product->variants as $variant) {
        $variant->image = json_decode($variant->image, true);
    }

    return response()->json([
        'status' => true,
        'data' => $product
    ]);
}



public function getCategoryAndProductsBySlug($slug)
{
    // Lấy danh mục cha theo slug
    $category = Category::where('slug', $slug)->first();

    if (!$category) {
        return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
    }

    // Lấy tất cả ID danh mục con
    $categoryIds = $this->getAllChildCategoryIds($category);

    // Nếu bạn không muốn lấy sản phẩm trong danh mục cha, bỏ ID đó ra
    if (($key = array_search($category->id, $categoryIds)) !== false) {
        unset($categoryIds[$key]);
    }

    $categoryIds = array_map('intval', $categoryIds);

    $products = collect();

    if (!empty($categoryIds)) {
        $products = Product::with('shop')
            ->whereIn('category_id', $categoryIds)
            ->where('status', 'activated')
            ->get();
    }

    // Lấy danh sách shop duy nhất từ các sản phẩm
    $shopIds = $products->pluck('shop_id')->unique()->toArray();

    $shops =  Shop::whereIn('id', $shopIds)->get();

    // Trả về cả category, products, và shops
    return response()->json([
        'category' => $category,
        'products' => $products,
        'shops' => $shops
    ]);
}



// Hàm đệ quy lấy tất cả danh mục con
private function getAllChildCategoryIds(Category $category)
{
    $ids = [$category->id];
    $children = Category::where('parent_id', $category->id)->get();

    foreach ($children as $child) {
        $ids = array_merge($ids, $this->getAllChildCategoryIds($child));
    }

    return $ids;
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

// Lấy danh sách sản phẩm của shop
public function showShopProducts(Request $request, $slug)
{
    $shop =  Shop::where('slug', $slug)->first();

    if (!$shop) {
        return response()->json(['error' => 'Shop không tồn tại.'], 404);
    }

    $perPage = $request->query('per_page', 5);

    $products =  Product::where('shop_id', $shop->id)
        ->where('status', 'activated')
        ->with('category')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

    return response()->json([
        'shop_id'   => $shop->id,
        'shop_name' => $shop->name,
        'products'  => $products
    ]);
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

// Lấy danh sách sản phẩm theo shop của shop đã đăng nhập
public function getProductByShop(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['status' => false, 'message' => 'Shop không tồn tại.'], 403);
    }

    $products = Product::with('category') // nếu muốn có cả category
        ->where('shop_id', $user->shop->id)
        ->latest()
        ->paginate(6);

    return response()->json([
        'status' => true,
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
        'image' => 'nullable|array',
        'image.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        'variants' => 'required|array|min:1',
        'variants.*.option1' => 'nullable|string|max:255',
        'variants.*.value1' => 'nullable|string|max:255',
        'variants.*.option2' => 'nullable|string|max:255',
        'variants.*.value2' => 'nullable|string|max:255',
        'variants.*.price' => 'required|numeric|min:0',
        'variants.*.stock' => 'required|integer|min:0',
        'variants.*.image' => 'nullable|array',
        'variants.*.image.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
    ], [
        'variants.required' => 'Phải có ít nhất 1 variant.',
        'variants.*.price.required' => 'Giá variant không được để trống.',
        'variants.*.stock.required' => 'Tồn kho variant không được để trống.',
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
    }

    $user = $request->user();
    if (!$user || !$user->shop) {
        return response()->json(['status' => false, 'message' => 'Người dùng chưa có shop.'], 403);
    }

    $slug = Str::slug($request->name);

    $exists =  Product::where('shop_id', $user->shop->id)
        ->where('slug', $slug)
        ->exists();

    if ($exists) {
        return response()->json([
            'status' => false,
            'message' => 'Tên sản phẩm đã tồn tại trong cửa hàng. Vui lòng chọn tên khác.'
        ], 422);
    }

    // Upload ảnh cover
    $imagePaths = [];
    if ($request->hasFile('image')) {
        foreach ($request->file('image') as $image) {
            $path = $image->store('products', 'public');
            $imagePaths[] = $path;
        }
    }

    // Tạo sản phẩm
    $product =  Product::create([
        'shop_id' => $user->shop->id,
        'category_id' => $request->category_id,
        'name' => $request->name,
        'slug' => $slug,
        'description' => $request->description,
        'price' => 0, // Sẽ update lại từ variants bên dưới
        'sale_price' => 0,
        'stock' => 0,
        'image' => json_encode($imagePaths),
        'status' => 'activated',
    ]);

    $totalStock = 0;
    $minPrice = null;

    // Thêm variants
    foreach ($request->variants as $variantData) {

        // Upload ảnh variant (nếu có)
        $variantImagePaths = [];
        if (isset($variantData['image'])) {
            foreach ($variantData['image'] as $file) {
                $path = $file->store('product_variants', 'public');
                $variantImagePaths[] = $path;
            }
        }

        $variant =  ProductVariant::create([
            'product_id' => $product->id,
            'option1' => $variantData['option1'] ?? null,
            'value1' => $variantData['value1'] ?? null,
            'option2' => $variantData['option2'] ?? null,
            'value2' => $variantData['value2'] ?? null,
            'price' => $variantData['price'],
            'stock' => $variantData['stock'],
            'image' => json_encode($variantImagePaths),
        ]);

        // Cập nhật tồn kho tổng và giá min
        $totalStock += $variant->stock;
        if (is_null($minPrice) || $variant->price < $minPrice) {
            $minPrice = $variant->price;
        }
    }

    // Cập nhật lại product price & stock
    $product->price = $minPrice ?? 0;
    $product->stock = $totalStock;
    $product->save();

    return response()->json([
        'status' => true,
        'message' => 'Sản phẩm đã được thêm thành công.',
        'data' => [
            ...$product->toArray(),
            'image' => $imagePaths,
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
