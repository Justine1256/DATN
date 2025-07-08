<?php

namespace App\Http\Controllers;

use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Validator;

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



public function store(Request $request){
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

    // Lưu file vào storage/app/public/reviews
    $path = $file->store('reviews', 'public'); // kết quả: reviews/abc.jpg

    // Build URL đúng với hạ tầng server
    $url = 'https://files.marketo.info.vn/files/public/' . $path;

    return response()->json([
        'message' => 'Tải ảnh review thành công',
        'images' => [$url] // trả về dạng mảng
    ], 201);
}



}
