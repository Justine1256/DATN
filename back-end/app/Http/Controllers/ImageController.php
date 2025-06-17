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

    public function store($request){
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
}
