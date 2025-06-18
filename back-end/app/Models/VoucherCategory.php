<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VoucherCategory extends Model
{
    use SoftDeletes;

    protected $fillable = ['voucher_id', 'category_id'];

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
