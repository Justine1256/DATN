<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $parentId = DB::table('categories')->insertGetId([
            'name' => 'Thời Trang',
            'description' => 'Danh mục thời trang tổng hợp',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $subCategories = ['Áo', 'Quần', 'Giày Dép', 'Phụ Kiện', 'Váy'];

        foreach ($subCategories as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Thời Trang',
                'parent_id' => $parentId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
