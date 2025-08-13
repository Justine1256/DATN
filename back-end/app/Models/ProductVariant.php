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
    'value1',
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

public function getEffectivePriceAttribute() {
    return (!is_null($this->sale_price) && (float)$this->sale_price > 0)
        ? (float)$this->sale_price
        : (float)$this->price;
}
}
