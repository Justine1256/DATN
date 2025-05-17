<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('products')->insert([
            [
                "shop_id" => 1,
                "category_id" => 2,
                "name" => "Áo Thun Nam Basic",
                "description" => "Áo thun cotton thoáng mát, dễ phối đồ.",
                "price" => 150000,
                "stock" => 20,
                "sold" => 5,
                "image" => "aothun1.jpg",
                "option1" => "Màu sắc",
                "value1" => "Trắng",
                "option2" => "Size",
                "value2" => "M",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
        ]);
    }
}
