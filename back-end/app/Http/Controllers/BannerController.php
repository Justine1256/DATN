<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    // GET: Danh sách banner
    public function index()
    {
        return response()->json(Banner::whereNull('deleted_at')->get());
    }

    // POST: Thêm mới banner
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'image' => 'required|string', // đường dẫn ảnh (ví dụ: banners/banner1.png)
            'link' => 'nullable|string',
            'status' => 'required|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $banner = Banner::create($data);

        return response()->json($banner, 201);
    }

    // PUT: Cập nhật banner
    public function update(Request $request, $id)
    {
        $banner = Banner::findOrFail($id);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'image' => 'sometimes|string',
            'link' => 'nullable|string',
            'status' => 'sometimes|boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $banner->update($data);

        return response()->json($banner);
    }

    // DELETE: Xóa mềm banner
    public function destroy($id)
    {
        $banner = Banner::findOrFail($id);
        $banner->delete();

        return response()->json(['message' => 'Banner đã được xóa mềm']);
    }
}
