<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserVoucherSeeder extends Seeder
{
    public function run(): void
    {
        $user = DB::table('users')->where('username', 'baomuado')->first();
        $voucher = DB::table('vouchers')->where('code', 'USERONLY123')->first();

        DB::table('voucher_users')->insert([
            'user_id' => $user->id,
            'voucher_id' => $voucher->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
