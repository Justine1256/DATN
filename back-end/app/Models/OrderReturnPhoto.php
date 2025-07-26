<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderReturnPhoto extends Model
{
    protected $fillable = ['order_id', 'image_path'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
