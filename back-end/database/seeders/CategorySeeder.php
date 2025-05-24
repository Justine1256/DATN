<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
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

        $parentTechId = DB::table('categories')->insertGetId([
            'name' => 'Đồ công nghệ',
            'description' => 'Tổng hợp các sản phẩm công nghệ hiện đại.',
            'image' => 'https://example.com/images/do-cong-nghe.jpg',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $techSubCategories = ['Điện thoại', 'Laptop'];

        foreach ($techSubCategories as $name) {
            $imageUrl = match ($name) {
                'Điện thoại' => 'https://example.com/images/dien-thoai.jpg',
                'Laptop' => 'https://example.com/images/laptop.jpg',
                default => null,
            };

            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Các dòng ' . strtolower($name) . ' phổ biến',
                'parent_id' => $parentTechId,
                'image' => $imageUrl,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $healthBeautyId = DB::table('categories')->insertGetId([
            'name' => 'Sức Khỏe & Làm Đẹp',
            'description' => 'Các sản phẩm mỹ phẩm, chăm sóc sức khỏe và làm đẹp',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $healthBeautySubs = [
            'Mỹ phẩm, skincare, đồ trang điểm',
            'Thực phẩm chức năng',
            'Nước hoa',
            'Dụng cụ làm đẹp: máy rửa mặt, máy uốn tóc,...'
        ];

        foreach ($healthBeautySubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Sức Khỏe & Làm Đẹp',
                'parent_id' => $healthBeautyId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $homeLivingId = DB::table('categories')->insertGetId([
            'name' => 'Nhà Cửa & Đời Sống',
            'description' => 'Các sản phẩm cho gia đình và không gian sống',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $homeLivingSubs = [
            'Đồ gia dụng: nồi cơm, máy hút bụi, bếp gas',
            'Đồ trang trí nhà cửa',
            'Nội thất: bàn, ghế, giường, tủ',
            'Vật dụng nhà bếp, đồ phòng tắm'
        ];

        foreach ($homeLivingSubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Nhà Cửa & Đời Sống',
                'parent_id' => $homeLivingId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $momBabyId = DB::table('categories')->insertGetId([
            'name' => 'Mẹ & Bé',
            'description' => 'Sản phẩm cho mẹ và bé',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $momBabySubs = [
            'Tã bỉm, sữa, thực phẩm dinh dưỡng',
            'Quần áo trẻ em',
            'Đồ chơi trẻ em',
            'Dụng cụ ăn dặm, xe đẩy, nôi,...'
        ];

        foreach ($momBabySubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Mẹ & Bé',
                'parent_id' => $momBabyId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $phoneAccessoryId = DB::table('categories')->insertGetId([
            'name' => 'Điện Thoại & Phụ Kiện',
            'description' => 'Các loại điện thoại và phụ kiện đi kèm',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $phoneAccessorySubs = [
            'Điện thoại các hãng (Apple, Samsung, Xiaomi,...)',
            'Ốp lưng, tai nghe, sạc dự phòng, cáp sạc',
            'Đồng hồ thông minh'
        ];

        foreach ($phoneAccessorySubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Điện Thoại & Phụ Kiện',
                'parent_id' => $phoneAccessoryId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $electronicsId = DB::table('categories')->insertGetId([
            'name' => 'Thiết Bị Điện Tử',
            'description' => 'Các thiết bị công nghệ và điện tử',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $electronicsSubs = [
            'Màn hình, bàn phím, chuột',
            'Máy in, thiết bị văn phòng'
        ];

        foreach ($electronicsSubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Thiết Bị Điện Tử',
                'parent_id' => $electronicsId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $homeAppliancesId = DB::table('categories')->insertGetId([
            'name' => 'Điện Gia Dụng',
            'description' => 'Các thiết bị điện cho gia đình',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $homeAppliancesSubs = [
            'Máy lạnh, máy giặt, tủ lạnh',
            'Máy hút bụi, nồi chiên không dầu',
            'Máy nước nóng, quạt điện'
        ];

        foreach ($homeAppliancesSubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Điện Gia Dụng',
                'parent_id' => $homeAppliancesId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $booksGiftsId = DB::table('categories')->insertGetId([
            'name' => 'Sách, Văn Phòng Phẩm & Quà Tặng',
            'description' => 'Các loại sách, đồ dùng học tập và quà tặng',
            'status' => 'activated',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $booksGiftsSubs = [
            'Sách giáo khoa, sách kỹ năng, tiểu thuyết',
            'Bút, sổ tay, đồ dùng học tập',
            'Quà lưu niệm, thiệp, hộp quà'
        ];

        foreach ($booksGiftsSubs as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'description' => 'Danh mục con của Sách, Văn Phòng Phẩm & Quà Tặng',
                'parent_id' => $booksGiftsId,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
