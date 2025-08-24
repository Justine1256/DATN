<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;
class Product extends Model
{
    use SoftDeletes;
    use Searchable;

   protected $fillable = [
    'category_id',
    'shop_id',
    'name',
    'slug',
    'description',
    'price',
    'sale_price',
    'option1',
    'value1',
    'option2',
    'value2',
    'stock',
    'sold',
    'image',
    'status',
    'sale_starts_at','sale_ends_at','sale_source','sale_priority',
];
protected $casts = [
    'image' => 'array',
    'price'          => 'decimal:2',
        'sale_price'     => 'decimal:2',
        'sale_starts_at' => 'datetime',
        'sale_ends_at'   => 'datetime',
];


    /**
     * Tự động tạo slug duy nhất theo shop_id.
     */
    protected static function booted()
    {
        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = self::generateUniqueSlug($product->name, $product->shop_id);
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name')) {
                $product->slug = self::generateUniqueSlug($product->name, $product->shop_id);
            }
        });
    }

    /**
     * Tạo slug duy nhất trong cùng một shop
     */
    protected static function generateUniqueSlug($name, $shopId)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $i = 1;

        while (self::where('shop_id', $shopId)->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $i;
            $i++;
        }

        return $slug;
    }

    // Quan hệ với bảng categories
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Quan hệ với bảng shops
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
    // Quan hệ với bảng wishlists
        public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }
    public function variants()
{
    return $this->hasMany(ProductVariant::class, 'product_id');
}
public function reviews()
{
    return $this->hasMany(Review::class, 'order_detail_id', 'id')
        ->where('status', 'approved');
}
public function approvedReviews()
{
    return $this->hasManyThrough(
        Review::class,
        OrderDetail::class,
        'product_id',
        'order_detail_id',
        'id',
        'id'
    )->where('reviews.status', 'approved');
}

public function toSearchableArray()
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'name_normalized' => Str::ascii($this->name),
        'slug' => $this->slug,
        'option1' => $this->option1,
        'value1' => $this->value1,
        'option2' => $this->option2,
        'value2' => $this->value2,
        'sold' => $this->sold,
        'status' => $this->status,  // thêm trường status
        'stock' => $this->stock,    // thêm trường stock

    ];
}

    // Chỉ lấy product đang active
    public function scopeActive($q)
    {
        return $q->where('products.status', 'activated');
    }

    // Chỉ lấy product thuộc category đang active
    public function scopeInActiveCategory($q)
    {
        return $q->whereHas('category', fn($c) => $c->where('status', 'activated'));
    }

    public function scopeInCategory($q, $categoryId)
    {
        return $q->where('products.category_id', $categoryId);
    }

    public function scopeTopRated($q)
    {
        return $q->orderByDesc('rating')->orderByDesc('sold')->orderByDesc('id');
    }

    public function scopeBestSelling($q)
    {
        return $q->orderByDesc('sold')->orderByDesc('rating')->orderByDesc('id');
    }

    public function scopeNewest($q)
    {
        return $q->orderByDesc('id');
        // hoặc orderByDesc('created_at')
    }
        public function scopeActiveSale($q)
    {
        $now = now();
        return $q->whereNotNull('sale_price')
            ->whereColumn('sale_price', '<', 'price')
            ->where(function ($q) use ($now) {
                $q->whereNull('sale_starts_at')->orWhere('sale_starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('sale_ends_at')->orWhere('sale_ends_at', '>=', $now);
            });
    }

    public function getIsOnSaleAttribute(): bool
    {
        if (is_null($this->sale_price) || $this->sale_price >= $this->price) return false;
        $now = now();
        if ($this->sale_starts_at && $now->lt($this->sale_starts_at)) return false;
        if ($this->sale_ends_at   && $now->gt($this->sale_ends_at))   return false;
        return true;
    }

    public function getFinalPriceAttribute(): string
    {
        return $this->is_on_sale ? (string)$this->sale_price : (string)$this->price;
    }

    // Áp dụng sale cho 1 sản phẩm (helper)
    public function applySale(float $salePrice, ?string $startsAt, ?string $endsAt, string $source, int $priority = 0): self
    {
        $this->sale_price     = $salePrice;
        $this->sale_starts_at = $startsAt ? \Carbon\Carbon::parse($startsAt) : null;
        $this->sale_ends_at   = $endsAt   ? \Carbon\Carbon::parse($endsAt)   : null;
        $this->sale_source    = $source;
        $this->sale_priority  = $priority;
        return $this;
    }

    // Gỡ sale (helper)
    public function clearSale(): self
    {
        $this->sale_price = null;
        $this->sale_starts_at = null;
        $this->sale_ends_at = null;
        $this->sale_source = null;
        $this->sale_priority = 0;
        return $this;
    }
}
