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
        $products = [
            [
                'name' => 'Điện thoại iPhone 15 Pro Max',
                'category_id' => 2,
                'price' => 35000000,
                'sale_price' => 33000000,
                'images' => [
                    'products/iphone15-1.jpg',
                    'products/iphone15-2.jpg',
                ],
                'variants' => [
                    [
                        'option1' => 'Dung lượng',
                        'value1' => '256GB',
                        'option2' => 'Màu sắc',
                        'value2' => 'Titan Xám',
                        'price' => 33000000,
                        'stock' => 10,
                        'image' => [
                            'products/variants/iphone15-256-titan.jpg',
                        ],
                    ],
                    [
                        'option1' => 'Dung lượng',
                        'value1' => '512GB',
                        'option2' => 'Màu sắc',
                        'value2' => 'Titan Xanh',
                        'price' => 36000000,
                        'stock' => 5,
                        'image' => [
                            'products/variants/iphone15-512-xanh.jpg',
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Laptop Dell XPS 13',
                'category_id' => 3,
                'price' => 42000000,
                'sale_price' => 40000000,
                'images' => [
                    'products/dellxps-1.jpg',
                    'products/dellxps-2.jpg',
                ],
                'variants' => [
                    [
                        'option1' => 'RAM',
                        'value1' => '16GB',
                        'option2' => 'SSD',
                        'value2' => '512GB',
                        'price' => 40000000,
                        'stock' => 8,
                        'image' => [
                            'products/variants/dellxps-16-512.jpg',
                        ],
                    ],
                    [
                        'option1' => 'RAM',
                        'value1' => '32GB',
                        'option2' => 'SSD',
                        'value2' => '1TB',
                        'price' => 45000000,
                        'stock' => 4,
                        'image' => [
                            'products/variants/dellxps-32-1tb.jpg',
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Tai nghe Sony WH-1000XM5',
                'category_id' => 4,
                'price' => 9990000,
                'sale_price' => 8990000,
                'images' => [
                    'products/sony1000xm5-1.jpg',
                    'products/sony1000xm5-2.jpg',
                ],
                'variants' => [
                    [
                        'option1' => 'Màu sắc',
                        'value1' => 'Đen',
                        'option2' => null,
                        'value2' => null,
                        'price' => 8990000,
                        'stock' => 20,
                        'image' => [
                            'products/variants/sony1000xm5-black.jpg',
                        ],
                    ],
                    [
                        'option1' => 'Màu sắc',
                        'value1' => 'Trắng',
                        'option2' => null,
                        'value2' => null,
                        'price' => 8990000,
                        'stock' => 15,
                        'image' => [
                            'products/variants/sony1000xm5-white.jpg',
                        ],
                    ],
                ],
            ],
            // Bạn có thể tự thêm tiếp sản phẩm 4 → 15 theo ý bạn
        ];

        foreach ($products as $item) {

            $slug = Str::slug($item['name']); // Không thêm -1 -2

            $product = Product::create([
                'shop_id' => 1,
                'category_id' => $item['category_id'],
                'name' => $item['name'],
                'slug' => $slug,
                'description' => "Mô tả sản phẩm {$item['name']}",
                'price' => $item['price'],
                'sale_price' => $item['sale_price'],
                'stock' => 0, // sẽ cập nhật sau khi thêm variants
                'sold' => rand(0, 20),
                'image' => json_encode($item['images']),
                'option1' => null,
                'value1' => null,
                'option2' => null,
                'value2' => null,
                'status' => 'activated',
            ]);

            $totalStock = 0;

            foreach ($item['variants'] as $variant) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'option1' => $variant['option1'],
                    'value1' => $variant['value1'],
                    'option2' => $variant['option2'],
                    'value2' => $variant['value2'],
                    'price' => $variant['price'],
                    'stock' => $variant['stock'],
                    'image' => json_encode($variant['image']),
                ]);

                $totalStock += $variant['stock'];
            }

            // Cập nhật stock tổng
            $product->stock = $totalStock;
            $product->save();
        }
    }
}
