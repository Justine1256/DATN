<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
DB::table('users')->insert([
    [
        'name' => 'adminshop thoitrang',
        'username' => 'adminshop',
        'password' => Hash::make('123456789'),
        'avatar' => null,
        'email' => 'adminshop@example.com',
        'phone' => '0123456789',
        'role' => 'seller',
        // 'rank' không cần thiết phải khai báo vì có default
        'status' => 'activated',
        'email_verified_at' => now(),
        'remember_token' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'name' => 'Nhân Order',
        'username' => 'nhanorder',
        'password' => Hash::make('123456789'),
        'avatar' => null,
        'email' => 'nhanorder@gmail.com',
        'phone' => '0987654321',
        'role' => 'seller',
        // 'rank' cũng không cần thiết ở đây
        'status' => 'activated',
        'email_verified_at' => now(),
        'remember_token' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ],
]);


    }
}
