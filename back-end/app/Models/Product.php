<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use SoftDeletes;

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
    return $this->hasManyThrough(
        \App\Models\Review::class,
        \App\Models\OrderDetail::class,
        'product_id',        // OrderDetail -> product_id
        'order_detail_id',   // Review -> order_detail_id
        'id',                // Product -> id
        'id'                 // OrderDetail -> id
    );
}

}
