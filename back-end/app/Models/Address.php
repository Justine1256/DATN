<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'address',
        'ward',
        'district',
        'city',
        'province',
        'note',
        'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
    public function getFullAddressAttribute()
{
    return implode(', ', array_filter([
        $this->address,
        $this->ward,
        $this->district,
        $this->city,
        $this->province,
    ]));
}
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
