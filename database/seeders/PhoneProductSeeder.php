<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhoneProductSeeder extends Seeder
{
    public function run(): void
    {
        $shopId = 2;

        // Lấy ID danh mục điện thoại (thay đổi tên cho đúng)
        $phoneCategoryId = DB::table('categories')->where('name', 'Điện Thoại')->value('id');

        if (!$phoneCategoryId) {
            // Nếu chưa có danh mục điện thoại thì tạo mới
            $phoneCategoryId = DB::table('categories')->insertGetId([
                'name' => 'Điện Thoại',
                'description' => 'Danh mục điện thoại',
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Tạo danh mục con "Phụ kiện" dưới "Điện Thoại"
        $accessoryCategoryId = DB::table('categories')->where('name', 'Phụ kiện')->where('parent_id', $phoneCategoryId)->value('id');
        if (!$accessoryCategoryId) {
            $accessoryCategoryId = DB::table('categories')->insertGetId([
                'name' => 'Phụ kiện',
                'description' => 'Danh mục phụ kiện điện thoại gồm cáp sạc, sim,...',
                'parent_id' => $phoneCategoryId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Tạo 20 sản phẩm điện thoại
        $phoneProducts = [];
        for ($i = 1; $i <= 20; $i++) {
            $phoneProducts[] = [
                'shop_id' => $shopId,
                'category_id' => $phoneCategoryId,
                'name' => "Điện thoại mẫu $i",
                'description' => "Mô tả sản phẩm điện thoại mẫu số $i",
                'price' => rand(3000000, 15000000),
                'stock' => rand(10, 100),
                'sold' => rand(0, 50),
                'image' => "phone_sample_$i.jpg",
                'option1' => "Màu sắc",
                'value1' => ["Đen", "Trắng", "Xanh", "Đỏ"][array_rand(["Đen", "Trắng", "Xanh", "Đỏ"])],
                'option2' => "Dung lượng",
                'value2' => ["64GB", "128GB", "256GB"][array_rand(["64GB", "128GB", "256GB"])],
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('products')->insert($phoneProducts);

        // Tạo 20 sản phẩm phụ kiện (cáp sạc + sim)
        $accessories = ['Cáp sạc', 'Sim'];
        $accessoryProducts = [];
        for ($i = 1; $i <= 20; $i++) {
            $name = $accessories[array_rand($accessories)] . " mẫu $i";
            $accessoryProducts[] = [
                'shop_id' => $shopId,
                'category_id' => $accessoryCategoryId,
                'name' => $name,
                'description' => "Sản phẩm $name chất lượng cao",
                'price' => rand(100000, 500000),
                'stock' => rand(20, 100),
                'sold' => rand(0, 50),
                'image' => strtolower(str_replace(' ', '_', $name)) . ".jpg",
                'option1' => '',
                'value1' => '',
                'option2' => '',
                'value2' => '',
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('products')->insert($accessoryProducts);
    }
}
