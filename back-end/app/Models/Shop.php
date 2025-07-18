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
        'slug',
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
    return $this->belongsToMany(User::class, 'shop_user', 'shop_id', 'user_id');
}
public function followRecords()
{
    return $this->hasMany(\App\Models\Follow::class, 'shop_id');
}

}

