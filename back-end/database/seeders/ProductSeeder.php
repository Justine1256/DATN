<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                "shop_id" => 1,
                "category_id" => 2,
                "name" => "Áo Thun Nam Basic",
                "description" => "Áo thun cotton thoáng mát, dễ phối đồ.",
                "price" => 150000,
                "stock" => 20,
                "sold" => 5,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Trắng",
                "option2" => "Size",
                "value2" => "M",
                "status" => "activated",
            ],
            [
                "shop_id" => 1,
                "category_id" => 3,
                "name" => "Áo Sơ Mi Trắng Nữ",
                "description" => "Sơ mi công sở thanh lịch, chất liệu mát.",
                "price" => 200000,
                "stock" => 25,
                "sold" => 6,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Trắng",
                "option2" => "Size",
                "value2" => "S",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
            [
                "shop_id" => 1,
                "category_id" => 4,
                "name" => "Quần Kaki Nam",
                "description" => "Quần kaki ống đứng, lịch sự.",
                "price" => 250000,
                "stock" => 18,
                "sold" => 3,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Be",
                "option2" => "Size",
                "value2" => "XL",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
            [
                "shop_id" => 1,
                "category_id" => 3,
                "name" => "Váy Suông Công Sở",
                "description" => "Váy liền nữ thanh lịch, vải mịn thoáng.",
                "price" => 300000,
                "stock" => 10,
                "sold" => 1,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Hồng",
                "option2" => "Size",
                "value2" => "M",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
        ];

        foreach ($products as $product) {
            Product::create($product); // slug sẽ tự sinh ở model
        }
    }
}
