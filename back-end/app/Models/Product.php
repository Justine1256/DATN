<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id',
        'shop_id',
        'name',
        'description',
        'price',
        'stock',
        'sold',
        'image',
        'option1',
        'value1',
        'option2',
        'value2',
        'status',
    ];
}
