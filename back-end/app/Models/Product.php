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
];
protected $casts = [
    'image' => 'array',
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
        ];
    }
}
