<?php
// app/Console/Commands/ExpireProductSales.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;

class ExpireProductSales extends Command
{
    protected $signature = 'sales:expire';
    protected $description = 'Clear expired product sales (optional denormalization cleanup)';

    public function handle(): int
    {
        $now = now();
        $affected = Product::query()
            ->whereNotNull('sale_price')
            ->whereNotNull('sale_ends_at')
            ->where('sale_ends_at', '<', $now)
            ->update([
                'sale_price' => null,
                'sale_starts_at' => null,
                'sale_ends_at' => null,
                'sale_source' => null,
                'sale_priority' => 0,
                'updated_at' => now(),
            ]);

        $this->info("Expired sales cleared: {$affected}");
        return self::SUCCESS;
    }
}
