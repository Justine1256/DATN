<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddressesSeeder extends Seeder
{
    public function run(): void
    {
        $user = DB::table('users')->where('username', 'baomuado')->first();

        DB::table('addresses')->insert([
            'user_id'     => $user->id,
            'full_name'   => 'Bảo Mưa Đỏ',
            'phone'       => '0987654322',
            'address'     => '123 Đường Lê Lợi',
            'ward'        => 'Phường Bến Nghé',
            'district'    => 'Quận 1',
            'city'        => 'TP.HCM',
            'province'    => 'TP.HCM',
            'note'        => 'Giao giờ hành chính',
            'is_default'  => true,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }
}
