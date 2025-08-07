<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
class BannerController extends Controller
{
    // GET: Danh sách banner
public function index()
{
    $today = now()->toDateString(); // Lấy ngày hiện tại (YYYY-MM-DD)

    $banners = Banner::whereNull('deleted_at')
        ->where('status', 1)
        ->where(function ($query) use ($today) {
            $query->whereNull('start_date')->orWhere('start_date', '<=', $today);
        })
        ->where(function ($query) use ($today) {
            $query->whereNull('end_date')->orWhere('end_date', '>=', $today);
        })
        ->get();

    return response()->json($banners);
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
        public function uploadBanner(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'Không có file'], 400);
        }

        $file = $request->file('file');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();

        // Tạo tên file sạch + unique nếu cần
        $filename = Str::slug($originalName) . '-' . time() . '.' . $extension;

        // Lưu file vào thư mục 'banners' trong disk 'public'
        $path = $file->storeAs('banners', $filename, 'public');

        return response()->json([
            'url' => $path, // Trả về: banners/abc.jpg
        ]);
    }
    // DELETE: Xóa mềm banner
    public function destroy($id)
    {
        $banner = Banner::findOrFail($id);
        $banner->delete();

        return response()->json(['message' => 'Banner đã được xóa mềm']);
    }
}
