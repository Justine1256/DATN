<?php

namespace App\Http\Controllers;

use App\Services\OpenAIService;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Helpers\EmbeddingHelper;

class BotController extends Controller
{
    protected $openAI;

    public function __construct(OpenAIService $openAI)
    {
        $this->openAI = $openAI;
    }

    public function ask(Request $request)
    {
        $message = $request->input('message');

        // 1. Tạo embedding cho câu hỏi khách
        $queryEmbedding = $this->openAI->embedding($message);

        // 2. Lấy tất cả sản phẩm và tính similarity
        $products = Product::whereNotNull('embedding')->get();
        $ranked = [];
        foreach ($products as $product) {
            $productEmbedding = json_decode($product->embedding, true);
            $similarity = EmbeddingHelper::cosineSimilarity($queryEmbedding, $productEmbedding);
            $ranked[] = [
                'product' => $product,
                'similarity' => $similarity
            ];
        }

        // 3. Lấy top 3 sản phẩm phù hợp nhất
        usort($ranked, fn($a, $b) => $b['similarity'] <=> $a['similarity']);
        $topProducts = array_slice($ranked, 0, 3);

        // 4. Tạo context cho GPT
        $context = [];
        if ($topProducts) {
            $contextText = "Danh sách sản phẩm phù hợp:\n";
            foreach ($topProducts as $item) {
                $p = $item['product'];
                $contextText .= "- {$p->name}, giá {$p->price} VND\n";
            }
            $context[] = ['role' => 'system', 'content' => $contextText];
        }

        // 5. Gọi GPT với context + câu hỏi
        $reply = $this->openAI->chat($message, $context);

        return response()->json([
            'message' => $message,
            'reply' => $reply,
            'products' => array_map(fn($item) => [
                'id' => $item['product']->id,
                'name' => $item['product']->name,
                'price' => $item['product']->price,
                'slug'  => $item['product']->slug,
                'image' => $item['product']->image,
                'similarity' => $item['similarity'],
                'shop' => [
                    'id'   => $item['product']->shop->id ?? null,
                    'name' => $item['product']->shop->name ?? null,
                    'slug' => $item['product']->shop->slug ?? null,
                    'logo' => $item['product']->shop->logo ?? null,
                ],
            ], $topProducts),

        ]);
    }
}
