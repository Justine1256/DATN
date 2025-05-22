<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PhoneProductSeeder extends Seeder
{
    public function run(): void
    {
        $shopId = 2;

        // Lấy ID danh mục cha "Đồ công nghệ"
        $parentTechId = DB::table('categories')->where('name', 'Đồ công nghệ')->value('id');

        if (!$parentTechId) {
            throw new \Exception('Danh mục "Đồ công nghệ" chưa được tạo. Hãy chạy CategorySeeder trước.');
        }

        // Lấy ID danh mục con "Điện thoại" trong "Đồ công nghệ"
        $phoneCategoryId = DB::table('categories')
            ->where('name', 'Điện thoại')
            ->where('parent_id', $parentTechId)
            ->value('id');

        if (!$phoneCategoryId) {
            throw new \Exception('Danh mục "Điện thoại" con của "Đồ công nghệ" chưa tồn tại.');
        }

        // Tạo danh mục con "Phụ kiện" (con của "Điện thoại" hoặc của "Đồ công nghệ", tùy bạn chọn)
        $accessoryCategoryId = DB::table('categories')
            ->where('name', 'Phụ kiện điện thoại')
            ->where('parent_id', $phoneCategoryId)
            ->value('id');

        if (!$accessoryCategoryId) {
            $accessoryCategoryId = DB::table('categories')->insertGetId([
                'name' => 'Phụ kiện điện thoại',
                'description' => 'Danh mục phụ kiện điện thoại gồm cáp sạc, sim,...',
                'parent_id' => $phoneCategoryId, // hoặc dùng $parentTechId nếu muốn cùng cấp với "Điện thoại"
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
                'sale_price' => rand(3000000, 15000000),
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
                'sale_price' => rand(100000, 500000),
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
