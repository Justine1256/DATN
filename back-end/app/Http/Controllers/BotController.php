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
    $message     = (string) $request->input('message', '');
    $sort        = $request->input('sort', 'rating'); // rating|sold|new
    $categoryId  = $request->input('category_id');    // optional
    $topN        = (int) ($request->input('limit', 3));

    // 1) Tạo embedding câu hỏi
    $queryEmbedding = $this->openAI->embedding($message);

    // 2) Base query: chỉ lấy product & category đang activated
    $base = Product::query()
        ->active()
        ->inActiveCategory()
        ->whereNotNull('embedding');

    if ($categoryId) {
        $base->inCategory((int)$categoryId);
    }

    // 2b) Áp sort business theo yêu cầu
    if ($sort === 'sold') {
        $base->bestSelling();
    } elseif ($sort === 'new') {
        $base->newest();
    } else {
        $base->topRated(); // default
    }

    // 2c) Lấy danh sách để tính similarity
    $products = $base->limit(200)->get(); // hạn chế để nhanh

    // 3) Tính similarity
    $ranked = [];
    foreach ($products as $product) {
        $productEmbedding = json_decode($product->embedding, true);
        if (!is_array($productEmbedding)) continue;

        $sim = EmbeddingHelper::cosineSimilarity($queryEmbedding, $productEmbedding);

        // (tuỳ chọn) blend thêm trọng số business:
        // rating boost, sold boost, new boost
        $business = 0.0;
        if ($sort === 'rating') {
            $business += min(1.0, (float)$product->rating / 5.0) * 0.2;
        } elseif ($sort === 'sold') {
            $business += (log(1 + (int)$product->sold) / 10.0); // nhẹ thôi
        } elseif ($sort === 'new') {
            $business += 0.15; // ưu tiên nhẹ cho "new" đã được orderBy
        }

        $score = $sim + $business;

        $ranked[] = ['product' => $product, 'similarity' => $score];
    }

    // 4) Top N
    usort($ranked, fn($a, $b) => $b['similarity'] <=> $a['similarity']);
    $topProducts = array_slice($ranked, 0, max(1, $topN));

    // 5) Context cho GPT
    $context = [];
    if ($topProducts) {
        $contextText = "Danh sách sản phẩm phù hợp:\n";
        foreach ($topProducts as $item) {
            $p = $item['product'];
            $contextText .= "- {$p->name}, giá {$p->price} VND, rating {$p->rating}, bán {$p->sold}\n";
        }
        $context[] = ['role' => 'system', 'content' => $contextText];
    }

    // 6) Chat
    $reply = $this->openAI->chat($message, $context);

    return response()->json([
        'message'  => $message,
        'sort'     => $sort,
        'category' => $categoryId,
        'reply'    => $reply,
        'products' => array_map(fn($item) => [
            'id'         => $item['product']->id,
            'name'       => $item['product']->name,
            'price'      => $item['product']->price,
            'slug'       => $item['product']->slug,
            'image'      => $item['product']->image,
            'rating'     => $item['product']->rating,
            'sold'       => $item['product']->sold,
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
