<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class VoucherUser extends Model
{
    use SoftDeletes;

    protected $fillable = ['voucher_id', 'user_id'];

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
