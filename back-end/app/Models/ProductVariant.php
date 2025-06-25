<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use SoftDeletes;

    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'option1',
        'value1',
        'option2',
        'value2',
        'price',
        'sale_price',
        'stock',
        'image',
    ];

    protected $casts = [
        'image' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    public function variant()
{
    return $this->belongsTo(ProductVariant::class, 'variant_id');
}
}
