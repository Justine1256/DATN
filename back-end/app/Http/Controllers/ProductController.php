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
use App\Models\Review;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class ProductController extends Controller
{
    // Danh sách sản phẩm
    public function index()
    {
        $products = Product::with('category', 'shop')
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
            ->where('status', 'activated')
            ->get();

        return response()->json($products);
    }

public function show($shopslug, $productslug, Request $request)
{
    // Lấy sản phẩm theo shopslug + productslug
    $product = Product::with([
        'shop',
        'category.parent',    // Load category + parent
        'variants'            // Load danh sách các variant
    ])
        ->where('slug', $productslug)
        ->whereHas('shop', function ($query) use ($shopslug) {
            $query->where('slug', $shopslug);
        })
        ->first();

    if (!$product) {
        return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
    }

    // Lấy thống kê đánh giá (rating + số lượng review)
    $reviewStats = DB::table('reviews')
        ->join('order_details', 'reviews.order_detail_id', '=', 'order_details.id')
        ->where('order_details.product_id', $product->id)
        ->where('reviews.status', 'approved')
        ->selectRaw('AVG(reviews.rating) as avg_rating, COUNT(reviews.id) as total_reviews')
        ->first();

    $product->rating_avg = round($reviewStats->avg_rating ?? 0, 1); // Ví dụ: 4.5
    $product->review_count = $reviewStats->total_reviews ?? 0;

    // ✅ Ghi lịch sử xem nếu user đăng nhập
    $user = $request->user();
    if ($user) {
        DB::table('user_view')->updateOrInsert(
            ['user_id' => $user->id, 'product_id' => $product->id],
            ['view_date' => now()]
        );
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
                ->withCount(['approvedReviews as review_count'])
                ->withAvg(['approvedReviews as rating_avg'], 'rating')
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
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
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

        // Nếu có biến thể thì phải có option và ít nhất một variant khớp value
        if (is_array($request->variants) && count($request->variants) > 0) {
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

        // Tạo sản phẩm
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

        // Nếu có biến thể thì lưu
        if (is_array($request->variants) && count($request->variants) > 0) {
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

        $perPage = $request->query('per_page', 15);

        $products =  Product::where('shop_id', $shop->id)
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
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

        $products = Product::with(['shop:id,slug'])
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
            ->where('status', 'activated')
            ->orderByDesc('sold')
            ->take($limit)
            ->get();

        $products->each(function ($product) {
            $product->shop_slug = $product->shop->slug ?? null;
            unset($product->shop);
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

        $products = Product::with('shop')
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
            ->whereNotNull('sale_price')
            ->whereColumn('sale_price', '<', 'price')
            ->where('status', 'activated')
            ->get()
            ->sortByDesc(function ($product) {
                return (($product->price - $product->sale_price) / $product->price) * 100;
            })
            ->take($limit)
            ->values();

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

        $products = Product::with('shop')
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
            ->where('status', 'activated')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

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
            ->withCount(['approvedReviews as review_count'])
            ->withAvg(['approvedReviews as rating_avg'], 'rating')
            ->where('shop_id', $shop_id)
            ->latest()
            ->paginate(6);

        return response()->json([
            'status' => true,
            'products' => $products,
        ]);
    }
public function getProductByIdShop($id)
{
    $user = Auth::user();

    if (!$user) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    $shop = $user->shop; // lấy shop qua quan hệ

    if (!$shop) {
        return response()->json(['message' => 'User has no shop'], 403);
    }

    $shopId = $shop->id;

    $product = Product::where('id', $id)
        ->where('shop_id', $shopId)
        ->with(['category', 'variants'])
        ->withCount(['approvedReviews as review_count'])
        ->withAvg(['approvedReviews as rating_avg'], 'rating')
        ->first();

    if (!$product) {
        return response()->json(['message' => 'Product not found or not authorized'], 404);
    }

    return response()->json([
        'status' => true,
        'product' => $product,
    ]);
}



    // Cập nhật sản phẩm bởi shop
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !$user->shop) {
            return response()->json(['error' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'], 403);
        }

        $product = Product::where('id', $id)
            ->where('shop_id', $user->shop->id)
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Không tìm thấy sản phẩm trong cửa hàng của bạn.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0|lte:price',
            'stock' => 'nullable|integer|min:0',
            'image' => 'nullable|array|min:1',
            'image.*' => 'string',
            'option1' => 'nullable|string|max:50',
            'value1' => 'nullable|string|max:255',
            'option2' => 'nullable|string|max:50',
            'value2' => 'nullable|string|max:255',
            'status' => 'sometimes|in:activated,deleted',

            'variants' => 'nullable|array',
            'variants.*.value1' => 'required_with:variants|string|max:255',
            'variants.*.value2' => 'nullable|string|max:255',
            'variants.*.price' => 'required_with:variants|numeric|min:0',
            'variants.*.sale_price' => 'nullable|numeric|min:0|lte:variants.*.price',
            'variants.*.stock' => 'required_with:variants|integer|min:0',
            'variants.*.image' => 'nullable|array',
            'variants.*.image.*' => 'string',
        ], [
            'sale_price.lte' => 'Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc.',
            'variants.*.sale_price.lte' => 'Giá khuyến mãi của biến thể phải nhỏ hơn hoặc bằng giá gốc.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // Ràng buộc nếu nhập option thì phải có value
        if (($request->filled('option1') && !$request->filled('value1')) ||
            ($request->filled('option2') && !$request->filled('value2'))
        ) {
            return response()->json(['error' => 'Nếu nhập option thì phải nhập value tương ứng.'], 422);
        }

        // Nếu có biến thể thì phải có option
        if ($request->filled('variants')) {
            if (!$request->filled('option1') && !$request->filled('option2')) {
                return response()->json(['error' => 'Phải có option nếu muốn thêm biến thể.'], 422);
            }

            // Biến thể phải có ít nhất 1 trùng value với sản phẩm gốc
            $matchFound = collect($request->variants)->contains(function ($variant) use ($request) {
                return ($request->value1 && $variant['value1'] === $request->value1) ||
                    ($request->value2 && isset($variant['value2']) && $variant['value2'] === $request->value2);
            });

            if (!$matchFound) {
                return response()->json(['error' => 'Phải có ít nhất một biến thể trùng giá trị với sản phẩm gốc.'], 422);
            }
        }

        // Slug mới nếu đổi tên
        if (isset($data['name'])) {
            $slug = Str::slug($data['name']);
            $exists = Product::where('shop_id', $user->shop->id)
                ->where('slug', $slug)
                ->where('id', '!=', $product->id)
                ->exists();

            if ($exists) {
                return response()->json(['error' => 'Tên sản phẩm đã tồn tại trong cửa hàng.'], 422);
            }

            $data['slug'] = $slug;
        }

        // ✅ Cập nhật sản phẩm (bao gồm image dạng mảng)
        $product->fill($data);

        if (isset($data['image'])) {
            $product->image = $data['image']; // ["products/abc.webp", ...]
        }

        $product->save();

        // ✅ Cập nhật biến thể nếu có
        if ($request->filled('variants')) {
            $product->variants()->delete();

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
            'message' => 'Cập nhật sản phẩm thành công.',
            'product' => $product->load('variants')
        ]);
    }

    public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status' => 'required|in:deleted,activated',
    ]);

    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['error' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'], 403);
    }

    $product = Product::where('id', $id)
        ->where('shop_id', $user->shop->id)
        ->first();

    if (!$product) {
        return response()->json(['error' => 'Không tìm thấy sản phẩm.'], 404);
    }

    $product->status = $request->status;
    $product->save();

    return response()->json(['message' => 'Cập nhật trạng thái sản phẩm thành công.']);
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

        public function destroyVariant($id)
    {
        $user = Auth::user();
        if (!$user || !$user->shop) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $variant = ProductVariant::find($id);

        if (!$variant) {
            return response()->json(['message' => 'Variant not found'], 404);
        }

        // Chỉ xóa nếu biến thể thuộc về shop của user
        if ($variant->product->shop_id !== $user->shop->id) {
            return response()->json(['message' => 'Not authorized to delete this variant'], 403);
        }

        $variant->delete(); // soft delete nếu dùng SoftDeletes

        return response()->json(['message' => 'Variant deleted successfully']);
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
    // Lấy danh sách sản phẩm có stock = 0 hoặc < 5
    public function getLowStockProducts(Request $request)
{
    $user = $request->user();
    $shopId = $user->shop->id ?? null;

    if (!$shopId) {
        return response()->json(['error' => 'Shop not found for user'], 403);
    }

    // Lấy toàn bộ sản phẩm, sắp xếp theo stock tăng dần
    $products = Product::where('shop_id', $shopId)
        ->orderBy('stock', 'asc')
        ->get()

        ->map(function ($product) {
            if ($product->stock == 0) {
                $status = 'Hết hàng';
            }
            elseif($product->stock <=10){
                $status = 'Cần bổ sung';
            }
                else {
                $status = 'Còn hàng';
            }

            return [
                'id'     => $product->id,
                'name'   => $product->name,
                'stock'  => $product->stock,
                'status' => $status,
            ];
        })
        ->values(); // reset index về 0,1,2...

    return response()->json([
        'products' => $products,
    ], 200);
}
    // Nhập kho sản phẩm
    public function importStock(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1',
        ]);

        $user = $request->user();
        $shopId = $user->shop->id ?? null;

        if (!$shopId) {
            return response()->json(['error' => 'Shop not found for user'], 403);
        }

        $product = Product::where('id', $request->product_id)
                          ->where('shop_id', $shopId)
                          ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found or not owned by your shop'], 404);
        }

        // Update stock
        $product->stock += $request->quantity;
        $product->save();

        return response()->json([
            'message' => 'Stock updated successfully',
            'product' => $product
        ], 200);
    }
    public function search(Request $request)
    {
        $keyword = $request->get('q');

        if (!$keyword) {
            return response()->json(['error' => 'Keyword is required'], 400);
        }

        $products = Product::search($keyword)->take(50)->get();

        return response()->json($products);
    }
public function recommended(Request $request)
{
    $user = $request->user();
    $userId = optional($user)->id;
    $sessionId = $request->cookie('session_id') ?? session()->getId();

    if (!$request->cookie('session_id')) {
        cookie()->queue(cookie('session_id', $sessionId, 60 * 24 * 30));
    }

    $recommended = collect();
    $limit = 20;

    /** -------------------
     * 1. Lấy category từ lịch sử xem
     * ------------------- */
    $viewedProductIds = DB::table('user_view')
        ->where(function ($q) use ($userId, $sessionId) {
            $userId ? $q->where('user_id', $userId)
                    : $q->whereNull('user_id')->where('session_id', $sessionId);
        })
        ->orderByDesc('view_date')
        ->limit(10)
        ->pluck('product_id');

    $recentCategoryIds = [];
    if ($viewedProductIds->isNotEmpty()) {
        $recentCategoryIds = DB::table('products')
            ->whereIn('id', $viewedProductIds)
            ->pluck('category_id');
    }

    if (!empty($recentCategoryIds)) {
        $productsFromViews = Product::whereIn('category_id', $recentCategoryIds)
            ->whereHas('category', fn($q) => $q->where('status', 'activated'))
            ->orderBy('sold', 'desc') // hoặc 'created_at' để ưu tiên mới
            ->take(10)
            ->get();
        $recommended = $recommended->merge($productsFromViews);
    }

    /** -------------------
     * 2. Gợi ý từ lịch sử mua
     * ------------------- */
    if ($recommended->count() < $limit && $userId) {
        $orderCategoryIds = DB::table('products')
            ->whereIn('id', function ($query) use ($userId) {
                $query->select('product_id')->from('orders')->where('user_id', $userId);
            })
            ->pluck('category_id');

        if ($orderCategoryIds->isNotEmpty()) {
            $productsFromOrders = Product::whereIn('category_id', $orderCategoryIds)
                ->whereHas('category', fn($q) => $q->where('status', 'activated'))
                ->whereNotIn('id', $recommended->pluck('id'))
                ->orderBy('sold', 'desc')
                ->take(6)
                ->get();
            $recommended = $recommended->merge($productsFromOrders);
        }
    }

    /** -------------------
     * 3. Fallback: trending
     * ------------------- */
    // if ($recommended->count() < $limit) {
    //     $trending = Product::whereHas('category', fn($q) => $q->where('status', 'activated'))
    //         ->whereNotIn('id', $recommended->pluck('id'))
    //         ->orderBy('sold', 'desc')
    //         ->take($limit - $recommended->count())
    //         ->get();
    //     $recommended = $recommended->merge($trending);
    // }

    return response()->json([
        'status' => 'success',
        'data' => $recommended->take($limit)->values()

    ]);
}
public function storeHistory(Request $request)
{
    $request->validate([
        'product_id' => 'required|integer|exists:products,id'
    ]);

    $userId = null;
    $token = $request->bearerToken();

    if ($token) {
        $accessToken = PersonalAccessToken::findToken($token);
        if ($accessToken) {
            $userId = $accessToken->tokenable_id; // ID user nếu đã đăng nhập
        }
    }

    // Xử lý session_id cho guest
    $sessionId = $request->cookie('session_id') ?? session()->getId();
    if (!$request->cookie('session_id')) {
        Cookie::queue('session_id', $sessionId, 60 * 24 * 30); // Lưu cookie 30 ngày
    }

    // Nếu user đã đăng nhập => merge lịch sử guest (nếu có)
    if ($userId) {
        DB::table('user_view')
            ->whereNull('user_id')
            ->where('session_id', $sessionId)
            ->update(['user_id' => $userId]);
    }

    // Lưu hoặc update lịch sử xem
    DB::table('user_view')->updateOrInsert(
        [
            'user_id' => $userId, // null nếu guest
            'session_id' => $sessionId,
            'product_id' => $request->product_id
        ],
        [
            'view_date' => now()
        ]
    );

    return response()->json(['status' => 'success']);
}


}
