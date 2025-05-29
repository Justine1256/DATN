<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        // Lấy ID danh mục con "Điện thoại"
        $phoneCategoryId = DB::table('categories')
            ->where('name', 'Điện thoại')
            ->where('parent_id', $parentTechId)
            ->value('id');

        if (!$phoneCategoryId) {
            throw new \Exception('Danh mục "Điện thoại" con của "Đồ công nghệ" chưa tồn tại.');
        }

        // Lấy hoặc tạo danh mục "Phụ kiện điện thoại"
        $accessoryCategoryId = DB::table('categories')
            ->where('name', 'Phụ kiện điện thoại')
            ->where('parent_id', $phoneCategoryId)
            ->value('id');

        if (!$accessoryCategoryId) {
            $accessoryCategoryId = DB::table('categories')->insertGetId([
                'name' => 'Phụ kiện điện thoại',
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
            $name = "Điện thoại mẫu $i";
            $value1 = ["Đen", "Trắng", "Xanh", "Đỏ"][array_rand(["Đen", "Trắng", "Xanh", "Đỏ"])];
            $value2 = ["64GB", "128GB", "256GB"][array_rand(["64GB", "128GB", "256GB"])];

            $phoneProducts[] = [
                'shop_id' => $shopId,
                'category_id' => $phoneCategoryId,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => "Mô tả sản phẩm điện thoại mẫu số $i",
                'price' => rand(3000000, 15000000),
                'sale_price' => rand(3000000, 15000000),
                'stock' => rand(10, 100),
                'sold' => rand(0, 50),
                'image' => "phone_sample_$i.jpg",
                'option1' => "Màu sắc",
                'value1' => $value1,
                'option2' => "Dung lượng",
                'value2' => $value2,
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
            $type = $accessories[array_rand($accessories)];
            $name = "$type mẫu $i";
            $imageName = strtolower(str_replace(' ', '_', $name)) . ".jpg";

            $accessoryProducts[] = [
                'shop_id' => $shopId,
                'category_id' => $accessoryCategoryId,
                'name' => $name,
                'slug' => Str::slug($name),
                'description' => "Sản phẩm $name chất lượng cao",
                'price' => rand(100000, 500000),
                'sale_price' => rand(100000, 500000),
                'stock' => rand(20, 100),
                'sold' => rand(0, 50),
                'image' => $imageName,
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
