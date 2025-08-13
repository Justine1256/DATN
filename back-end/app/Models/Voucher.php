<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'shop_id',
        'discount_value',
        'discount_type',
        'start_date',
        'end_date',
        'created_by',
        'min_order_value',
        'max_discount_value',
        'usage_limit',
        'usage_count',
        'is_free_shipping',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function userVouchers()
    {
        return $this->hasMany(VoucherUser::class);
    }
    public function voucherCategories()
    {
        return $this->hasMany(VoucherCategory::class);
    }
    public function categories()
    {
        return $this->belongsToMany(Category::class, 'voucher_categories');
    }
    public function shop()
    {
        return $this->belongsTo(Shop::class, 'shop_id');
    }
}
