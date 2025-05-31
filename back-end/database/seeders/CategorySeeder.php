<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Thời Trang',
                'description' => 'Danh mục thời trang tổng hợp',
                'status' => 'activated',
                'subs' => ['Áo', 'Quần', 'Giày Dép', 'Phụ Kiện', 'Váy'],
            ],
            [
                'name' => 'Đồ công nghệ',
                'description' => 'Tổng hợp các sản phẩm công nghệ hiện đại.',
                'image' => 'https://example.com/images/do-cong-nghe.jpg',
                'status' => 'activated',
                'subs' => [
                    ['name' => 'Điện thoại', 'description' => 'Các dòng điện thoại phổ biến', 'image' => 'https://example.com/images/dien-thoai.jpg'],
                    ['name' => 'Laptop', 'description' => 'Các dòng laptop phổ biến', 'image' => 'https://example.com/images/laptop.jpg'],
                ],
            ],
            [
                'name' => 'Sức Khỏe & Làm Đẹp',
                'description' => 'Các sản phẩm mỹ phẩm, chăm sóc sức khỏe và làm đẹp',
                'status' => 'activated',
                'subs' => [
                    'Mỹ phẩm, skincare, đồ trang điểm',
                    'Thực phẩm chức năng',
                    'Nước hoa',
                    'Dụng cụ làm đẹp: máy rửa mặt, máy uốn tóc,...',
                ],
            ],
            // Thêm các category khác tương tự
        ];

        foreach ($categories as $cat) {
            $subs = $cat['subs'] ?? [];
            unset($cat['subs']); // xóa key subs để tạo category cha trước
            $parent = Category::create($cat);

            foreach ($subs as $sub) {
                if (is_string($sub)) {
                    // Nếu sub là string thì dùng mặc định mô tả
                    Category::create([
                        'name' => $sub,
                        'description' => 'Danh mục con của ' . $parent->name,
                        'parent_id' => $parent->id,
                        'shop_id' => 2,
                        'status' => 'activated',
                    ]);
                } else if (is_array($sub)) {
                    // Nếu sub là mảng chứa nhiều info
                    Category::create([
                        'name' => $sub['name'],
                        'description' => $sub['description'] ?? ('Danh mục con của ' . $parent->name),
                        'parent_id' => $parent->id,
                        'shop_id' => 2,
                        'image' => $sub['image'] ?? null,
                        'status' => $sub['status'] ?? 'activated',
                    ]);
                }
            }
        }
    }
}
