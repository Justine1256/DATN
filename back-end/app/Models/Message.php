<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'message',
        'image',
        'status',
    ];

    // Quan hệ gửi
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // Quan hệ nhận
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
