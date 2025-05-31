<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::whereNull('parent_id')->with('children')->get();
        return response()->json($categories);
    }

    // Xem một danh mục + danh mục con
    public function show($id)
    {
        $category = Category::with('children')->find($id);
        if (!$category) {
            return response()->json(['message' => 'Danh mục không tồn tại'], 404);
        }
        return response()->json($category);
    }

    // Thêm danh mục mới (cha hoặc con)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'status' => 'in:activated,deleted',
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image' => $validated['image'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'status' => $validated['status'] ?? 'activated',
        ]);

        return response()->json([
            'message' => 'Thêm danh mục thành công!',
            'category' => $category
        ], 201);
    }

    // Cập nhật danh mục
    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Danh mục không tồn tại'], 404);
        }

        $category->update($request->only([
            'name', 'description', 'image', 'parent_id', 'status'
        ]));

        return response()->json([
            'message' => 'Cập nhật thành công!',
            'category' => $category
        ]);
    }

    // Xoá danh mục và con của nó
    public function delete($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Danh mục không tồn tại'], 404);
        }

        // Xoá danh mục con trước
        $category->children()->delete();
        $category->delete();

        return response()->json(['message' => 'Xoá danh mục thành công']);
    }
    public function viewList()
{
    $categories = Category::whereNull('parent_id')->with('children')->get();
    return view('categories.index', compact('categories'));
}
// Lấy danh mục của shop
    public function getShopCategories(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['error' => 'User chưa có shop.'], 403);
    }

    $shopId = $user->shop->id;

    // Lấy các category do shop tạo, liên kết với category admin (parent)
    $categories = Category::where('shop_id', $shopId)
        ->where('status', 'activated')
        ->with(['parent' => function ($query) {
            $query->whereNull('shop_id'); // chỉ lấy parent do admin tạo
        }])
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json([
        'shop_id' => $shopId,
        'categories' => $categories
    ]);
}
// Thêm danh mục của shop
public function addCategoryByShop(Request $request)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['error' => 'User chưa có shop.'], 403);
    }

    $validator = Validator::make($request->all(), [
        'parent_id' => 'required|exists:categories,id',
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'image' => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Chỉ chấp nhận danh mục cha từ admin
    $parent = Category::where('id', $request->parent_id)
        ->whereNull('shop_id')
        ->first();

    if (!$parent) {
        return response()->json(['error' => 'Danh mục cha không hợp lệ hoặc không phải của admin.'], 400);
    }

    // Kiểm tra tên trùng trong cùng shop
    $existing = Category::where('shop_id', $user->shop->id)
        ->where('name', $request->name)
        ->exists();

    if ($existing) {
        return response()->json(['error' => 'Tên danh mục đã tồn tại trong shop của bạn.'], 422);
    }

    $category = Category::create([
        'name' => $request->name,
        'description' => $request->description,
        'image' => $request->image,
        'parent_id' => $parent->id,
        'shop_id' => $user->shop->id,
        'status' => 'activated',
    ]);

    return response()->json([
        'message' => 'Tạo danh mục thành công.',
        'category' => $category
    ], 201);
}

// Cập nhật danh mục của shop
public function updateCategoryByShop(Request $request, $id)
{
    $user = $request->user();

    if (!$user || !$user->shop) {
        return response()->json(['status' => false, 'message' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'], 403);
    }

    $shopId = $user->shop->id;

    // Lấy danh mục thuộc shop của user
    $category = Category::where('id', $id)->where('shop_id', $shopId)->first();

    if (!$category) {
        return response()->json(['status' => false, 'message' => 'Không tìm thấy danh mục trong cửa hàng của bạn.'], 404);
    }

    // Validation
    $validator = Validator::make($request->all(), [
        'name' => 'sometimes|string|max:255',
        'description' => 'nullable|string',
        'image' => 'nullable|string',
        'status' => 'sometimes|in:activated,deleted',
    ]);

    if ($validator->fails()) {
        return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
    }

    $data = $validator->validated();

    // Kiểm tra trùng tên nếu có thay đổi
    if (isset($data['name']) && $data['name'] !== $category->name) {
        $exists = Category::where('shop_id', $shopId)
            ->where('name', $data['name'])
            ->where('id', '!=', $category->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => false,
                'message' => 'Tên danh mục đã tồn tại trong shop của bạn.'
            ], 422);
        }
    }

    // Cập nhật danh mục
    $category->update($data);

    return response()->json([
        'status' => true,
        'message' => 'Cập nhật danh mục thành công.',
        'data' => $category->fresh()
    ]);
}
// Xóa danh mục của shop
public function destroyCategoryByShop(Request $request, $id)
{
    $user = $request->user();

    // Kiểm tra đăng nhập và có shop
    if (!$user || !$user->shop) {
        return response()->json([
            'status' => false,
            'message' => 'Bạn chưa đăng nhập hoặc chưa có cửa hàng.'
        ], 403);
    }

    $shopId = $user->shop->id;

    // Tìm danh mục theo id và shop_id
    $category = Category::where('id', $id)
        ->where('shop_id', $shopId)
        ->first();

    if (!$category) {
        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy danh mục trong cửa hàng của bạn.'
        ], 404);
    }

    // Xóa mềm (soft delete) nếu model có dùng SoftDeletes, nếu không thì cập nhật status
    if (in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses($category))) {
        $category->delete(); // Soft delete
    } else {
        $category->status = 'deleted';
        $category->save();
    }

    return response()->json([
        'status' => true,
        'message' => 'Xóa danh mục thành công.'
    ]);
}
// khôi phục danh mục của shop
public function restoreCategory(Request $request, $id)
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

    // Tìm danh mục đã bị xóa mềm theo id và shop_id
    $category = Category::onlyTrashed()
        ->where('id', $id)
        ->where('shop_id', $shopId)
        ->first();

    if (!$category) {
        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy danh mục bị xóa mềm trong cửa hàng của bạn.'
        ], 404);
    }

    // Khôi phục danh mục
    $category->restore();

    return response()->json([
        'status' => true,
        'message' => 'Khôi phục danh mục thành công.'
    ]);
}

}
