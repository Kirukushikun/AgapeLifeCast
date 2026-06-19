<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SlideDeck extends Model
{
    protected $fillable = [
        'title', 'disk_path', 'mime_type',
        'extension', 'slide_count', 'size',
    ];

    protected $casts = [
        'slide_count' => 'integer',
        'size'        => 'integer',
    ];

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->disk_path);
    }
}
