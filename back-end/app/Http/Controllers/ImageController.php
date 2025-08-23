<?php

namespace App\Http\Controllers;

use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    public function index()
    {
        $folder = public_path('storage/products');

        if (!File::exists($folder)) {
            return response()->json(['error' => 'Thư mục không tồn tại'], 404);
        }

        $files = File::files($folder);

        $data = [];

        foreach ($files as $file) {
            $data[] = [
                'filename' => $file->getFilename(),
                'url' => url('storage/products/' . $file->getFilename())
            ];
        }

        return response()->json($data);
    }
    public function show($path)
    {
        $filePath = public_path("storage/" . $path);
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File không tồn tại'], 404);
        }
        return response()->file($filePath);
    }
    public function uploadProductImage(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file provided'], 400);
        }

        $file = $request->file('file');

        if (!$file->isValid()) {
            return response()->json(['error' => 'Invalid file upload'], 400);
        }

        // Lưu file vào thư mục public/storage/products
        $path = $file->store('products', 'public'); // returns "products/filename.ext"

        // ✅ Trả về chỉ đường dẫn nội bộ
        return response()->json(['path' => $path]);
    }



    public function store(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['error' => 'No file provided'], 400);
        }

        $file = $request->file('file');

        if (!$file->isValid()) {
            return response()->json(['error' => 'Invalid file upload'], 400);
        }

        // Lưu file vào thư mục public/storage/uploads
        $path = $file->store('uploads', 'public');

        // Trả về url file vừa lưu (dùng asset helper hoặc Storage facade)
        $url = asset('storage/' . $path);

        return response()->json(['url' => $url]);
    }
public function uploadReviewImage(Request $request)
{
    $request->validate([
        'image' => 'required|image|mimes:jpg,jpeg,png,gif|max:2048',
    ]);

    $file = $request->file('image');
    $path = $file->store('reviews', 'public'); // lưu vào storage/app/public/reviews

    $url = asset('storage/' . $path); // ✅ public path

    return response()->json([
        'message' => 'Tải ảnh review thành công',
        'images' => [$url]
    ], 201);
}
public function uploadShopLogo(Request $request)
{
    $request->validate([
        'image' => 'required|image|mimes:jpg,jpeg,png,gif|max:2048',
    ]);

    $file = $request->file('image');

    // Lưu vào thư mục storage/app/public/shops
    $path = $file->store('shops', 'public');

    // Trả về đường dẫn public
    $url = asset('storage/' . $path);

    return response()->json([
        'message' => 'Tải logo thành công',
        'logo' => [$url] // trả về mảng
    ], 201);
}
public function uploadRefundImage(Request $request) {
  $request->validate([
    'image' => 'required|image|mimes:jpg,jpeg,png,gif|max:5120', // 5MB khớp UI
  ]);
  $path = $request->file('image')->store('Refund_photos', 'public');
  $url  = Storage::url($path); // -> /storage/Refund_photos/xxx.jpg

  return response()->json(['image' => $url], 201);
}

}
