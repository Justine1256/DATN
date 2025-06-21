<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Áo Thun Nam Basic',
            'Quần Jean Rách',
            'Giày Sneaker Trắng',
            'Áo Sơ Mi Công Sở',
            'Váy Nữ Dáng Dài',
            'Áo Khoác Hoodie',
            'Quần Jogger Thể Thao',
            'Balo Laptop Chống Nước',
            'Túi Xách Nữ Thời Trang',
            'Mũ Lưỡi Trai',
            'Kính Mát Nam',
            'Đồng Hồ Cặp Đôi',
            'Áo Len Cổ Lọ',
            'Giày Cao Gót 7cm',
            'Áo Polo Nam Cao Cấp',
        ];

        foreach ($names as $index => $name) {
            $price = rand(200000, 500000);
            $sale_price = $price - rand(20000, 50000);

            $product = Product::create([
                'shop_id' => 1,
                'category_id' => 1,
                'name' => $name,
                'slug' => Str::slug($name) . '-' . ($index + 1),
                'description' => "Đây là mô tả cho sản phẩm $name.",
                'price' => $price,
                'sale_price' => $sale_price,
                'stock' => 100,
                'sold' => rand(0, 20),
                'image' => json_encode([
                    "products/" . Str::slug($name) . "-1.jpg",
                    "products/" . Str::slug($name) . "-2.jpg",
                ]),
                'option1' => 'Size',
                'value1' => 'M',
                'option2' => 'Color',
                'value2' => 'Đen',
                'status' => 'activated',
            ]);

            // Tạo 2 variant cho mỗi sản phẩm
            $variants = [
                [
                    'option1' => 'Size',
                    'value1' => 'M',
                    'option2' => 'Color',
                    'value2' => 'Đen',
                    'price' => $sale_price,
                    'stock' => 10,
                    'image' => json_encode([
                        "products/variants/" . Str::slug($name) . "-m-black.jpg"
                    ]),
                ],
                [
                    'option1' => 'Size',
                    'value1' => 'L',
                    'option2' => 'Color',
                    'value2' => 'Trắng',
                    'price' => $sale_price + 10000,
                    'stock' => 15,
                    'image' => json_encode([
                        "products/variants/" . Str::slug($name) . "-l-white.jpg"
                    ]),
                ],
            ];

            foreach ($variants as $variant) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'option1' => $variant['option1'],
                    'value1' => $variant['value1'],
                    'option2' => $variant['option2'],
                    'value2' => $variant['value2'],
                    'price' => $variant['price'],
                    'stock' => $variant['stock'],
                    'image' => $variant['image'],
                ]);
            }
        }
    }
}
