<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Services\OpenAIService;

class GenerateProductEmbeddings extends Command
{
    protected $signature = 'products:generate-embeddings';
    protected $description = 'Tạo embeddings cho tất cả sản phẩm chưa có';

    public function handle(OpenAIService $openAI)
{
    $this->info("Đang tạo embeddings cho sản phẩm...");

    $products = Product::whereNull('embedding')->get();

    foreach ($products as $product) {
        $text = $product->name . ' ' . $product->description;

        // gọi service qua biến $openAI thay vì $this->openAI
        $embedding = $openAI->embedding($text);

        $product->embedding = json_encode($embedding);
        $product->save();

        $this->info("✔ Đã tạo embedding cho sản phẩm ID {$product->id}");
        sleep(1); // tránh gọi API quá nhanh
    }

    $this->info("Hoàn thành!");
}

}
