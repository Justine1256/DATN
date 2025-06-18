<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'product_id',
        'content',
        'image',
        'parent_id',
    ];

    // Mối quan hệ: Comment thuộc về User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Mối quan hệ: Comment thuộc về Product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Mối quan hệ: Comment cha
    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    // Mối quan hệ: Các comment con (trả lời)
    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}
