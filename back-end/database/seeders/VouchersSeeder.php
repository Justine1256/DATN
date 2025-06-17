<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VouchersSeeder extends Seeder
{
    public function run(): void
    {
        $user = DB::table('users')->where('username', 'baomuado')->first();

        // Voucher công khai
        DB::table('vouchers')->insert([
            'code' => 'FREESHIPALL',
            'discount_value' => 20,
            'discount_type' => 'percent',
            'max_discount_value' => 50000,
            'min_order_value' => 100000,
            'usage_limit' => 100,
            'usage_count' => 0,
            'is_free_shipping' => false,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(30),
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Voucher riêng
        DB::table('vouchers')->insert([
            'code' => 'USERONLY123',
            'discount_value' => 30000,
            'discount_type' => 'fixed',
            'max_discount_value' => null,
            'min_order_value' => 50000,
            'usage_limit' => 10,
            'usage_count' => 0,
            'is_free_shipping' => false,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(30),
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('vouchers')->insert([
            'code' => 'FREESHIP50K',
            'discount_value' => 0,
            'discount_type' => 'fixed',
            'max_discount_value' => null,
            'min_order_value' => 100000,
            'usage_limit' => 200,
            'usage_count' => 0,
            'is_free_shipping' => true,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(30),
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('vouchers')->insert([
            'code' => 'FREESHIPVIP',
            'discount_value' => 15000,
            'discount_type' => 'fixed',
            'max_discount_value' => 15000,
            'min_order_value' => 50000,
            'usage_limit' => 50,
            'usage_count' => 0,
            'is_free_shipping' => true,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDays(15),
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
