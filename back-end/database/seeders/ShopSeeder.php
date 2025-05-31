<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Str;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $user1 = User::find(1);
        $user2 = User::find(2);

        DB::table('shops')->insert([
            [
                'user_id' => 1,
                'name' => 'Thời Trang Sành Điệu',
                'slug' => Str::slug('Thời Trang Sành Điệu'),
                'description' => 'Cửa hàng thời trang hiện đại và phong cách.',
                'logo' => $user1 ? $user1->avatar : 'uploads/users/default-avatar.png',
                'phone' => '0909123456',
                'email' => 'thoitrangsanhdieu@example.com',
                'total_sales' => 120,
                'rating' => 4.5,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => 2,
                'name' => 'Cửa hàng điện thoại',
                'slug' => Str::slug('Cửa hàng điện thoại'),
                'description' => 'Điện thoại chất lượng và uy tín.',
                'logo' => $user2 ? $user2->avatar : 'uploads/users/default-avatar.png',
                'phone' => '0988765432',
                'email' => 'dienthoai@example.com',
                'total_sales' => 250,
                'rating' => 4.2,
                'status' => 'activated',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
