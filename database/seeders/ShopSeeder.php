<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $userId = DB::table('users')->where('username', 'adminshop')->value('id');

        DB::table('shops')->insert([
            'user_id' => $userId,
            'name' => 'Thời Trang Sành Điệu',
            'description' => 'Cửa hàng thời trang hiện đại và phong cách.',
            'rating' => 4,
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
