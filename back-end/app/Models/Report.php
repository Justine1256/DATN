<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'user_id',
        'shop_id',
        'order_id',
        'reason',
        'status',
        'image',
    ];

    // Quan hệ: báo cáo được gửi bởi user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Quan hệ: shop bị báo cáo
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
        public function order()
    {
        return $this->belongsTo(Order::class);
    }
        protected $casts = [
        'image' => 'array',   // <— quan trọng: cột image sẽ là array (JSON)
    ];

}
