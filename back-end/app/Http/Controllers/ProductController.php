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
            ->whereHas('shop', function ($query) use ($shopslug) {
                $query->where('slug', $shopslug);
            })
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        // Nếu trong variants có image dạng json cũng decode luôn
        // foreach ($product->variants as $variant) {
        //     $variant->image = json_decode($variant->image, true);
        // }

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
public function getShopProductsByCategorySlug($slug, $category_slug)
{
    $shop = Shop::where('slug', $slug)->first();
    if (!$shop) {
        return response()->json(['message' => 'Không tìm thấy shop'], 404);
    }

    $category = Category::where('slug', $category_slug)->first();
    if (!$category) {
        return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
    }

    $categoryIds = $this->getAllChildCategoryIds($category);
    $categoryIds = array_map('intval', $categoryIds);

    $products = Product::with('shop')
        ->where('shop_id', $shop->id)
        ->whereIn('category_id', $categoryIds)
        ->where('status', 'activated')
        ->get();

    return response()->json([
        'category' => $category,
        'shop' => $shop,
        'products' => $products,
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


// Tạo mới sản phẩm (Admin hoặc Seller)
public function store(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['error' => 'User chưa có shop.'], 403);
    }

    $validator = Validator::make($request->all(), [
        'category_id' => 'required|exists:categories,id',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'price' => 'required|numeric|min:0',
        'sale_price' => 'nullable|numeric|min:0|lt:price',
        'stock' => 'required|integer|min:0',
        'image' => 'nullable|array|min:1',
        'image.*' => 'string',
        'option1' => 'nullable|string|max:50',
        'value1' => 'nullable|string|max:255',
        'option2' => 'nullable|string|max:50',
        'value2' => 'nullable|string|max:255',
        'variants' => 'nullable|array',
        'variants.*.value1' => 'required_with:variants|string|max:255',
        'variants.*.value2' => 'nullable|string|max:255',
        'variants.*.price' => 'required_with:variants|numeric|min:0',
        'variants.*.sale_price' => 'nullable|numeric|min:0|lt:variants.*.price',
        'variants.*.stock' => 'required_with:variants|integer|min:0',
        'variants.*.image' => 'nullable|array',
        'variants.*.image.*' => 'string'
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Nếu nhập option thì phải có value tương ứng
    if (($request->filled('option1') && !$request->filled('value1')) ||
        ($request->filled('option2') && !$request->filled('value2'))
    ) {
        return response()->json(['error' => 'Nếu nhập option thì phải nhập value tương ứng.'], 422);
    }

    // Nếu có variants thì phải có ít nhất một variant trùng value với sản phẩm gốc (nếu có option)
    if ($request->filled('variants')) {
        if (!$request->filled('option1') && !$request->filled('option2')) {
            return response()->json(['error' => 'Phải có option nếu muốn thêm biến thể.'], 422);
        }

        $matchFound = collect($request->variants)->contains(function ($variant) use ($request) {
            return ($request->value1 && $variant['value1'] === $request->value1) ||
                   ($request->value2 && isset($variant['value2']) && $variant['value2'] === $request->value2);
        });

        if (!$matchFound) {
            return response()->json(['error' => 'Phải có ít nhất một biến thể trùng giá trị với sản phẩm gốc.'], 422);
        }
    }

    // Tạo sản phẩm gốc
    $product = Product::create([
        'shop_id' => $user->shop->id,
        'category_id' => $request->category_id,
        'name' => $request->name,
        'slug' => Str::slug($request->name),
        'description' => $request->description,
        'price' => $request->price,
        'sale_price' => $request->sale_price,
        'stock' => $request->stock,
        'image' => $request->image,
        'option1' => $request->option1,
        'value1' => $request->value1,
        'option2' => $request->option2,
        'value2' => $request->value2,
        'status' => 'activated',
    ]);

    // Nếu có biến thể thì tạo biến thể
    if ($request->filled('variants')) {
        foreach ($request->variants as $v) {
            $product->variants()->create([
                'value1' => $v['value1'],
                'value2' => $v['value2'] ?? null,
                'price' => $v['price'],
                'sale_price' => $v['sale_price'] ?? null,
                'stock' => $v['stock'],
                'image' => $v['image'] ?? [],
            ]);
        }
    }

    return response()->json([
        'message' => 'Thêm sản phẩm thành công.',
        'product' => $product->load('variants')
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
public function getProductByShop($shop_id)
{
    if (!$shop_id) {
        return response()->json(['status' => false, 'message' => 'Thiếu shop_id.'], 400);
    }

    $shop = Shop::find($shop_id);

    if (!$shop) {
        return response()->json(['status' => false, 'message' => 'Shop không tồn tại.'], 404);
    }

    $products = Product::with('category')
        ->where('shop_id', $shop_id)
        ->latest()
        ->paginate(6);

    return response()->json([
        'status' => true,
        'products' => $products,
    ]);
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
public function search(Request $request)
{
    $query = $request->query('query');

    if (!$query) {
        return response()->json(['message' => 'Thiếu từ khóa tìm kiếm'], 400);
    }

    $products = Product::with('category', 'shop')
        ->where('status', 1)
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', '%' . $query . '%')
              ->orWhere('description', 'like', '%' . $query . '%')
              ->orWhere('slug', 'like', '%' . $query . '%');
        })
        ->orderBy('created_at', 'desc')
        ->limit(20)
        ->get();

    // Rút gọn dữ liệu trả về
    return response()->json($products->map(function ($product) {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'image' => $product->image,
            'price' => $product->price,
            'sale_price' => $product->sale_price,
            'category' => $product->category->name ?? null,
            'shop' => $product->shop->name ?? null,
        ];
    }));

}
}
