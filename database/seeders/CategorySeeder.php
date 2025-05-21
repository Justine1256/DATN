<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Danh mục Thời Trang và các danh mục con
        $parentFashionId = DB::table('categories')->insertGetId([
            'name' => 'Thời Trang',
            'description' => 'Danh mục thời trang tổng hợp',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fashionSubCategories = ['Áo', 'Quần', 'Giày Dép', 'Phụ Kiện', 'Váy'];

        foreach ($fashionSubCategories as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Thời Trang',
                'parent_id' => $parentFashionId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Danh mục Đồ Công Nghệ và các danh mục con
        $parentTechId = DB::table('categories')->insertGetId([
            'name' => 'Đồ công nghệ',
            'description' => 'Tổng hợp các sản phẩm công nghệ hiện đại.',
            'image' => 'https://example.com/images/do-cong-nghe.jpg',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $techSubCategories = ['Điện thoại', 'Laptop'];

        foreach ($techSubCategories as $name) {
            $imageUrl = match ($name) {
                'Điện thoại' => 'https://example.com/images/dien-thoai.jpg',
                'Laptop' => 'https://example.com/images/laptop.jpg',
                default => null,
            };

            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Các dòng ' . strtolower($name) . ' phổ biến',
                'parent_id' => $parentTechId,
                'image' => $imageUrl,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Danh mục Điện Thoại và các danh mục con (nếu bạn vẫn muốn tách riêng)
        /*
        $parentPhoneId = DB::table('categories')->insertGetId([
            'name' => 'Điện Thoại',
            'description' => 'Danh mục điện thoại và thiết bị di động',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $phoneSubCategories = ['Smartphone', 'Phụ kiện điện thoại', 'Sim thẻ', 'Sạc & Cáp'];

        foreach ($phoneSubCategories as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Điện Thoại',
                'parent_id' => $parentPhoneId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        */
    }
}
