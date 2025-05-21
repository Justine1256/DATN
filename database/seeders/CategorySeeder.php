<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Danh mục Thời Trang và các danh mục con
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

        // Danh mục Điện Thoại và các danh mục con
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
    }
}
