<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopShippingAccount extends Model
{
    protected $fillable = [
        'shop_id',
        'provider',
        'provider_shop_id',
        'api_token',
        'province_id',
        'ward_code',
        'address',
        'status',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
