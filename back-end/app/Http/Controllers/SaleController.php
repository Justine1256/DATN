<?php
// app/Http/Controllers/SaleController.php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    // GET /api/flash-sale?limit=24&shop_id=&min_discount=&sort=
    // Trả danh sách sản phẩm đang sale + mốc đếm ngược gần nhất
    public function flashSale(Request $req)
    {
        $limit = min((int) $req->query('limit', 8), 8);
        $shopId       = $req->query('shop_id');
        $minDiscount  = (int) $req->query('min_discount', 0); // %
        $sort         = $req->query('sort', 'ending_first');  // ending_first | best_discount

        $query = Product::query()
            ->select(['id','shop_id','name','slug','image','price','sale_price','sale_starts_at','sale_ends_at','sold','rating'])
            ->activeSale();

        if ($shopId) {
            $query->where('shop_id', $shopId);
        }

        if ($minDiscount > 0) {
            // (price - sale_price) / price >= minDiscount%
            $query->whereRaw('(price - sale_price) / price >= ?', [$minDiscount / 100]);
        }

        if ($sort === 'best_discount') {
            $query->orderByRaw('(price - sale_price) / price DESC')
                  ->orderBy('sale_ends_at', 'asc');
        } else {
            $query->orderByRaw('sale_ends_at IS NULL') // NULL xuống cuối
                  ->orderBy('sale_ends_at', 'asc')
                  ->orderByRaw('(price - sale_price) / price DESC');
        }

        $items = $query->limit($limit)->get()->map(function (Product $p) {
            $discountPercent = $p->price > 0 ? (int) round(100 * (1 - ($p->sale_price / $p->price))) : 0;
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'image' => $p->image,
                'price' => (float) $p->price,
                'sale_price' => (float) $p->sale_price,
                'discount_percent' => $discountPercent,
                'sale_starts_at' => optional($p->sale_starts_at)->toIso8601String(),
                'sale_ends_at'   => optional($p->sale_ends_at)->toIso8601String(),
                'sold' => (int) $p->sold,
                'rating' => (float) $p->rating,
            ];
        });

        $endsAt = $items->pluck('sale_ends_at')->filter()->sort()->first();

        return response()->json([
            'ends_at' => $endsAt,
            'items'   => $items,
        ]);
    }

    // PUT /api/products/{product}/sale
    // body: sale_price, sale_starts_at?, sale_ends_at?, priority?
    public function setProductSale(Request $req, Product $product)
    {
        $user = $req->user();

        // --- Authorization ---
        // Admin quản tất cả, Seller chỉ sp của shop mình
        if (method_exists($user, 'isAdmin') && !$user->isAdmin()) {
            if (method_exists($user, 'isSeller') && $user->isSeller()) {
                if (property_exists($user, 'shop_id') && (int)$user->shop_id !== (int)$product->shop_id) {
                    return response()->json(['message' => 'Bạn không có quyền chỉnh sale sản phẩm này'], 403);
                }
            } else {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $data = $req->validate([
            'sale_price'     => ['required','numeric','gt:0'],
            'sale_starts_at' => ['nullable','date'],
            'sale_ends_at'   => ['nullable','date','after_or_equal:sale_starts_at'],
            'priority'       => ['nullable','integer','between:0,100'],
        ]);

        // Validate sale_price < price (so với sp hiện tại)
        if ((float)$data['sale_price'] >= (float)$product->price) {
            return response()->json(['message' => 'sale_price phải nhỏ hơn price hiện tại'], 422);
        }

        $source   = (method_exists($user, 'isAdmin') && $user->isAdmin()) ? 'admin' : 'seller';
        $priority = (int) ($data['priority'] ?? 0);

        $product->applySale(
            (float) $data['sale_price'],
            $data['sale_starts_at'] ?? null,
            $data['sale_ends_at']   ?? null,
            $source,
            $priority
        )->save();

        return response()->json([
            'message' => 'Đã cập nhật sale cho sản phẩm',
            'product' => $product->fresh(),
        ]);
    }

    // PUT /api/products/sale/bulk
    // body: product_ids[], sale_price, sale_starts_at?, sale_ends_at?, priority?
    public function bulkSetSale(Request $req)
    {
        $user = $req->user();

        $data = $req->validate([
            'product_ids'    => ['required','array','min:1'],
            'product_ids.*'  => ['integer','exists:products,id'],
            'sale_price'     => ['required','numeric','gt:0'],
            'sale_starts_at' => ['nullable','date'],
            'sale_ends_at'   => ['nullable','date','after_or_equal:sale_starts_at'],
            'priority'       => ['nullable','integer','between:0,100'],
        ]);

        $source   = (method_exists($user, 'isAdmin') && $user->isAdmin()) ? 'admin' : 'seller';
        $priority = (int) ($data['priority'] ?? 0);

        DB::transaction(function () use ($data, $source, $priority, $user) {
            $products = Product::query()
                ->whereIn('id', $data['product_ids'])
                ->lockForUpdate()
                ->get();

            foreach ($products as $p) {
                // Authorization per product
                if (method_exists($user, 'isAdmin') && !$user->isAdmin()) {
                    if (method_exists($user, 'isSeller') && $user->isSeller()) {
                        if (property_exists($user, 'shop_id') && (int)$user->shop_id !== (int)$p->shop_id) {
                            continue; // bỏ qua sp không thuộc shop
                        }
                    } else {
                        continue;
                    }
                }

                if ((float)$data['sale_price'] >= (float)$p->price) {
                    continue; // bỏ qua nếu sale_price >= price
                }

                $p->applySale(
                    (float) $data['sale_price'],
                    $data['sale_starts_at'] ?? null,
                    $data['sale_ends_at']   ?? null,
                    $source,
                    $priority
                )->save();
            }
        });

        return response()->json(['message' => 'Đã cập nhật sale hàng loạt']);
    }

    // DELETE /api/products/{product}/sale
    public function clearProductSale(Request $req, Product $product)
    {
        $user = $req->user();

        // Authorization
        if (method_exists($user, 'isAdmin') && !$user->isAdmin()) {
            if (method_exists($user, 'isSeller') && $user->isSeller()) {
                if (property_exists($user, 'shop_id') && (int)$user->shop_id !== (int)$product->shop_id) {
                    return response()->json(['message' => 'Bạn không có quyền gỡ sale sản phẩm này'], 403);
                }
            } else {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $product->clearSale()->save();

        return response()->json(['message' => 'Đã gỡ sale khỏi sản phẩm']);
    }

    // (Tuỳ chọn) POST /api/sale/expire-now
    // Dọn các sale đã hết hạn (nếu muốn chủ động null thay vì để is_on_sale=false)
    public function expireNow()
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

        return response()->json(['message' => 'Đã dọn sale hết hạn', 'affected' => $affected]);
    }
}
