<?php

namespace App\Http\Controllers;

use App\Services\OpenAIService;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Helpers\EmbeddingHelper;
use App\Models\Category;

class BotController extends Controller
{
    protected $openAI;

    public function __construct(OpenAIService $openAI)
    {
        $this->openAI = $openAI;
    }

public function ask(Request $request)
{
    $message     = trim((string)$request->input('message', ''));
    $categoryId  = $request->input('category_id');   // optional
    $limit       = (int)($request->input('limit', 3));
    $limit       = max(1, min($limit, 10));          // tránh quá lớn

    // --- Helper: nhận diện chào & ý định mua ---
    $isGreeting = $this->isGreeting($message);
    $hasIntent  = $this->hasIntent($message); // có từ khoá “mua/tìm/giá/so sánh...” hay mô tả rõ

    // Nếu chỉ chào hoặc chưa có intent -> KHÔNG gợi ý sản phẩm, chỉ chào lại & hỏi nhu cầu
    if ($isGreeting || !$hasIntent) {
        // (tuỳ chọn) Gợi ý vài danh mục đang kích hoạt để user bấm
        $suggestedCategories = Category::where('status', 'activated')
            ->orderByDesc('id')
            ->limit(6)
            ->get(['id', 'name', 'slug']);

        $reply = $this->openAI->chat(
            $message,
            [] // không đưa context sản phẩm vào để LLM không gợi ý sớm
        );

        return response()->json([
            'message' => $message,
            'reply'   => $reply,          // sẽ là: chào lại + hỏi nhu cầu cần gì
            'products' => [],             // không trả sản phẩm ở bước này
            'suggested_categories' => $suggestedCategories,
        ]);
    }

    // --- Có intent -> mới chạy embedding & đề xuất ---
    // 1) Tạo embedding câu hỏi
    $queryEmbedding = $this->openAI->embedding($message);

    // 2) Lấy sản phẩm “đang kích hoạt” + category “đang kích hoạt” + có embedding
    $productsQuery = Product::query()
        ->where('products.status', 'activated')
        ->whereNotNull('embedding')
        ->whereHas('category', fn($q) => $q->where('status', 'activated'));

    if (!empty($categoryId)) {
        $productsQuery->where('products.category_id', (int)$categoryId);
    }

    // (tuỳ chọn) hạn chế 1 batch để tính nhanh (có thể paging/ANN sau)
    $products = $productsQuery->limit(200)->get();

    // 3) Similarity
    $ranked = [];
    foreach ($products as $product) {
        $productEmbedding = json_decode($product->embedding, true);
        if (!is_array($productEmbedding)) continue;

        $similarity = EmbeddingHelper::cosineSimilarity($queryEmbedding, $productEmbedding);
        $ranked[] = ['product' => $product, 'similarity' => $similarity];
    }

    // 4) Lấy top N
    usort($ranked, fn($a, $b) => $b['similarity'] <=> $a['similarity']);
    $topProducts = array_slice($ranked, 0, $limit);

    // 5) Tạo context sản phẩm cho GPT (để giải thích hợp lý)
    $context = [];
    if (!empty($topProducts)) {
        $contextText = "Danh sách sản phẩm phù hợp:\n";
        foreach ($topProducts as $item) {
            $p = $item['product'];
            $contextText .= "- {$p->name}, giá {$p->price} VND, rating {$p->rating}, bán {$p->sold}\n";
        }
        $context[] = ['role' => 'system', 'content' => $contextText];
    }

    // 6) Gọi GPT
    $reply = $this->openAI->chat($message, $context);

    return response()->json([
        'message'  => $message,
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

/** ---- Helpers ---- */
private function isGreeting(string $text): bool
{
    $t = mb_strtolower(trim($text));
    // các biến thể chào phổ biến
    $patterns = [
        'chào', 'xin chào', 'hello', 'hi', 'hey', 'alo', 'yo', 'good morning', 'good afternoon', 'good evening',
        'ad ơi', 'bạn ơi', 'cậu ơi'
    ];
    foreach ($patterns as $p) {
        if (str_contains($t, $p)) return true;
    }
    // rất ngắn (<= 2 từ) mà không chứa số/ký tự gợi ý -> coi như chào
    if (str_word_count($t) <= 2 && !preg_match('/\d/', $t)) return true;
    return false;
}

private function hasIntent(string $text): bool
{
    $t = mb_strtolower($text);
    // từ khoá “ý định mua/tìm/so sánh/hỏi giá/…”
    $keywords = [
        'mua', 'tìm', 'cần', 'gợi ý', 'giới thiệu', 'so sánh', 'chọn', 'nên chọn', 'tư vấn',
        'giá', 'bao nhiêu', 'ship', 'đặt', 'đơn', 'kích thước', 'size', 'dung lượng', 'hz', 'inch', 'ssd', 'ram', 'cpu', 'gpu',
        'áo', 'quần', 'giày', 'bàn phím', 'chuột', 'màn hình', 'điện thoại', 'laptop'
    ];
    foreach ($keywords as $k) {
        if (str_contains($t, $k)) return true;
    }
    // câu dài (>= 5 từ) thường thể hiện nhu cầu
    return str_word_count($t) >= 5;
}

}
