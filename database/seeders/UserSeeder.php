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
            'name' => 'adminshop thoitrang',
            'username' => 'adminshop',
            'password' => Hash::make('123456789'), // Mật khẩu: password123
            'avatar' => null,
            'email' => 'adminshop@example.com',
            'phone' => '0123456789',
            'role' => 'seller',
            'rank' => 'diamond',
            'status' => 'activated',
            'email_verified_at' => now(),
            'remember_token' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
