<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShopSeeder extends Seeder
{
    public function run(): void
    {

        DB::table('shops')->insert([
            [
                'user_id' => 1,
                'name' => 'Thời Trang Sành Điệu',
                'description' => 'Cửa hàng thời trang hiện đại và phong cách.',
                'rating' => 4,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 2,
                'name' => 'Cửa hàng điện thoại',
                'description' => 'Cửa hàng điện thoại.',
                'rating' => 4,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
