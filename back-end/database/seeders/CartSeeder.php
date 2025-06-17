<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        $user = DB::table('users')->where('username', 'baomuado')->first();
        $product = DB::table('products')->first();

        DB::table('carts')->insert([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
