<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Danh Mục Sản Phẩm</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
        h1 { color: #333; }
        .category { margin-bottom: 20px; }
        .parent { font-weight: bold; font-size: 18px; margin-bottom: 5px; color: #000; }
        .child { margin-left: 20px; color: #666; }
    </style>
</head>
<body>
    <h1>📦 Danh Mục Sản Phẩm</h1>

    @foreach($categories as $category)
        <div class="category">
            <div class="parent">📂 {{ $category->name }}</div>
            @foreach($category->children as $child)
                <div class="child">↳ {{ $child->name }}</div>
            @endforeach
        </div>
    @endforeach

</body>
</html>
