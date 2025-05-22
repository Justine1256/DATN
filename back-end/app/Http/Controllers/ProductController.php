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
            'stock' => 'nullable|integer|min:0',
            'sold' => 'nullable|integer|min:0',
            'image' => 'nullable|string',
            'option1' => 'nullable|string|max:255',
            'value1' => 'nullable|string|max:255',
            'option2' => 'nullable|string|max:255',
            'value2' => 'nullable|string|max:255',
            'status' => 'in:activated,deleted',
        ]);

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    // Cập nhật sản phẩm
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'shop_id' => 'sometimes|exists:shops,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'sold' => 'nullable|integer|min:0',
            'image' => 'nullable|string',
            'option1' => 'nullable|string|max:255',
            'value1' => 'nullable|string|max:255',
            'option2' => 'nullable|string|max:255',
            'value2' => 'nullable|string|max:255',
            'status' => 'in:activated,deleted',
        ]);

        $product->update($validated);
        return response()->json($product);
    }

    // Xóa sản phẩm (soft delete)
    public function delete($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        $product->delete();
        return response()->json(['message' => 'Đã xóa sản phẩm']);
    }
}
