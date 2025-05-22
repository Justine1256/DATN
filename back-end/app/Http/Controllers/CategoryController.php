<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

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
}
