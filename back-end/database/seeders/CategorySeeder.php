<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Thời Trang',
                'description' => 'Danh mục thời trang tổng hợp',
                'image' => 'fa-solid fa-shirt',
                'status' => 'activated',
                'subs' => ['Áo', 'Quần', 'Giày Dép', 'Phụ Kiện', 'Váy'],
            ],
            [
                'name' => 'Đồ công nghệ',
                'description' => 'Tổng hợp các sản phẩm công nghệ hiện đại.',
                'image' => 'fa-solid fa-laptop',
                'status' => 'activated',
                'subs' => [
                    ['name' => 'Điện thoại', 'description' => 'Các dòng điện thoại phổ biến', 'image' => 'fa-solid fa-mobile'],
                    ['name' => 'Laptop', 'description' => 'Các dòng laptop phổ biến', 'image' => 'fa-solid fa-laptop-code'],
                ],
            ],
            [
                'name' => 'Sức Khỏe & Làm Đẹp',
                'description' => 'Các sản phẩm mỹ phẩm, chăm sóc sức khỏe và làm đẹp',
                'image' => 'fa-solid fa-heart',
                'status' => 'activated',
                'subs' => [
                    'Mỹ phẩm, skincare, đồ trang điểm',
                    'Thực phẩm chức năng',
                    'Nước hoa',
                    'Dụng cụ làm đẹp: máy rửa mặt, máy uốn tóc,...',
                ],
            ],
            [
                'name' => 'Điện Gia Dụng',
                'description' => 'Các thiết bị và đồ dùng điện gia đình hiện đại',
                'image' => 'fa-solid fa-blender',
                'status' => 'activated',
                'subs' => ['Tivi', 'Tủ lạnh', 'Máy giặt', 'Lò vi sóng', 'Quạt điện'],
            ],
            [
                'name' => 'Mẹ & Bé',
                'description' => 'Sản phẩm dành cho mẹ và bé từ sơ sinh đến tuổi thiếu nhi',
                'image' => 'fa-solid fa-baby',
                'status' => 'activated',
                'subs' => ['Sữa bột', 'Tã giấy', 'Đồ chơi trẻ em', 'Quần áo trẻ em', 'Dụng cụ ăn uống'],
            ],
            [
                'name' => 'Thể Thao & Dã Ngoại',
                'description' => 'Trang thiết bị và phụ kiện thể thao, đồ dùng dã ngoại',
                'image' => 'fa-solid fa-dumbbell',
                'status' => 'activated',
                'subs' => ['Quần áo thể thao', 'Giày thể thao', 'Thiết bị tập gym', 'Dụng cụ cắm trại'],
            ],
            [
                'name' => 'Ô Tô, Xe Máy & Xe Đạp',
                'description' => 'Phụ kiện, thiết bị và xe cho ô tô, xe máy, xe đạp',
                'image' => 'fa-solid fa-car',
                'status' => 'activated',
                'subs' => ['Phụ kiện ô tô', 'Phụ tùng xe máy', 'Xe đạp thể thao', 'Thiết bị an toàn'],
            ],
            [
                'name' => 'Nhà Cửa & Đời Sống',
                'description' => 'Đồ dùng trang trí, nội thất và các vật dụng trong nhà',
                'image' => 'fa-solid fa-couch',
                'status' => 'activated',
                'subs' => ['Nội thất', 'Đèn chiếu sáng', 'Đồ trang trí', 'Dụng cụ nhà bếp'],
            ],
            [
                'name' => 'Sách & Văn Phòng Phẩm',
                'description' => 'Sách, dụng cụ học tập và văn phòng phẩm đa dạng',
                'image' => 'fa-solid fa-book',
                'status' => 'activated',
                'subs' => ['Sách giáo khoa', 'Sách kỹ năng', 'Dụng cụ văn phòng', 'Bút, giấy'],
            ],
            [
                'name' => 'Thực Phẩm & Đồ Uống',
                'description' => 'Thực phẩm tươi sống, đồ khô và các loại đồ uống',
                'image' => 'fa-solid fa-apple-whole',
                'status' => 'activated',
                'subs' => ['Thực phẩm tươi', 'Thực phẩm khô', 'Đồ uống có cồn', 'Đồ uống không cồn'],
            ],
            [
                'name' => 'Dịch Vụ & Vé Máy Bay',
                'description' => 'Các dịch vụ online và đặt vé máy bay tiện lợi',
                'image' => 'fa-solid fa-plane',
                'status' => 'activated',
                'subs' => ['Đặt vé máy bay', 'Tour du lịch', 'Dịch vụ chuyển phát', 'Dịch vụ tài chính'],
            ],
        ];

        foreach ($categories as $cat) {
            $subs = $cat['subs'] ?? [];
            unset($cat['subs']); // xóa key subs để tạo category cha trước
            $parent = Category::create($cat);

            foreach ($subs as $sub) {
                if (is_string($sub)) {
                    Category::create([
                        'name' => $sub,
                        'description' => 'Danh mục con của ' . $parent->name,
                        'parent_id' => $parent->id,
                        'shop_id' => 2,
                        'status' => 'activated',
                    ]);
                } else if (is_array($sub)) {
                    Category::create([
                        'name' => $sub['name'],
                        'description' => $sub['description'] ?? ('Danh mục con của ' . $parent->name),
                        'parent_id' => $parent->id,
                        'shop_id' => 2,
                        'image' => $sub['image'] ?? null,
                        'status' => $sub['status'] ?? 'activated',
                    ]);
                }
            }
        }
    }
}
