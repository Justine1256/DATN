<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    protected $fillable = [
        'shop_id',
        'order_id',
        'amount',
        'commission_date',
        'status',
    ];

    // Quan hệ với Shop
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    // Quan hệ với Order
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
