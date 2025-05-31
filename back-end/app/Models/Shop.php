<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shop extends Model
{
    use SoftDeletes;

    protected $table = 'shops';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'logo',
        'phone',
        'email',
        'total_sales',
        'rating',
        'status',
    ];

    public $timestamps = true;

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function followers()
{
    return $this->hasMany(Follow::class);
}

}
