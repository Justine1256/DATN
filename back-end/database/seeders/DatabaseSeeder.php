<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ShopSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            PhoneProductSeeder::class,
            AddressesSeeder::class,
            CartSeeder::class,
            VouchersSeeder::class,
            UserVoucherSeeder::class,
        ]);
    }
}
