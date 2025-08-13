<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopPaymentAccount extends Model
{
    protected $fillable = [
        'shop_id', 'gateway', 'config', 'status'
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
