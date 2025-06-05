<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image',
        'parent_id',
        'shop_id',
        'status',
    ];

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    protected static function booted()
    {
        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = self::generateUniqueSlug($category->name, $category->shop_id);
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name')) {
                $category->slug = self::generateUniqueSlug($category->name, $category->shop_id);
            }
        });
    }

    protected static function generateUniqueSlug($name, $shopId)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $i = 1;

        while (self::where('shop_id', $shopId)->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $i++;
        }

        return $slug;
    }
    public function products()
{
    return $this->hasMany(Product::class, 'category_id');
}

}
