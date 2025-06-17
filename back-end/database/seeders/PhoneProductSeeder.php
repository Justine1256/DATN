<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class PhoneProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                "shop_id" => 2,
                "category_id" => 8,
                "name" => "iPhone 14 Pro Max",
                "description" => "Apple iPhone 14 Pro Max, màn hình 6.7 inch, chip A16 Bionic.",
                "price" => 32000000,
                "sale_price" => 1900000,
                "stock" => 15,
                "sold" => 4,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Đen",
                "option2" => "Bộ nhớ",
                "value2" => "256GB",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
            [
                "shop_id" => 2,
                "category_id" => 8,
                "name" => "Samsung Galaxy S23 Ultra",
                "description" => "Samsung Galaxy S23 Ultra, màn hình 6.8 inch, camera 200MP.",
                "price" => 30000000,
                "sale_price" => 1900000,
                "stock" => 12,
                "sold" => 5,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Xanh",
                "option2" => "Bộ nhớ",
                "value2" => "512GB",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
            [
                "shop_id" => 2,
                "category_id" => 8,
                "name" => "Xiaomi Mi 13 Pro",
                "description" => "Xiaomi Mi 13 Pro, màn hình 6.73 inch, chip Snapdragon 8 Gen 2.",
                "price" => 22000000,
                "sale_price" => 1900000,
                "stock" => 20,
                "sold" => 7,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Trắng",
                "option2" => "Bộ nhớ",
                "value2" => "256GB",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
            [
                "shop_id" => 2,
                "category_id" => 8,
                "name" => "Google Pixel 7 Pro",
                "description" => "Google Pixel 7 Pro, màn hình 6.7 inch, chip Google Tensor G2.",
                "price" => 19000000,
                "sale_price" => 1800000,
                "stock" => 10,
                "sold" => 3,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Đen",
                "option2" => "Bộ nhớ",
                "value2" => "128GB",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
            [
                "shop_id" => 2,
                "category_id" => 8,
                "name" => "OnePlus 11",
                "description" => "OnePlus 11, màn hình 6.7 inch, Snapdragon 8 Gen 2, pin 5000mAh.",
                "price" => 18000000,
                "sale_price" => 1700000,
                "stock" => 18,
                "sold" => 6,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Đỏ",
                "option2" => "Bộ nhớ",
                "value2" => "256GB",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ],
        ];

        for ($i = count($products); $i < 20; $i++) {
            $products[] = [
                "shop_id" => 2,
                "category_id" => 8,
                "name" => "Điện thoại mẫu $i",
                "description" => "Mô tả cho điện thoại mẫu số $i.",
                "price" => 10000000 + $i * 500000,
                "sale_price" => 1000000 + $i * 50000,
                "stock" => 10 + $i,
                "sold" => $i,
                "image" => "products/sample-product.png",
                "option1" => "Màu sắc",
                "value1" => "Đen",
                "option2" => "Bộ nhớ",
                "value2" => "128GB",
                "status" => "activated",
                "created_at" => now(),
                "updated_at" => now(),
            ];
        }

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
