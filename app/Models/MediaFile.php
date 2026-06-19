<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MediaFile extends Model
{
    protected $fillable = [
        'title', 'type', 'disk_path', 'mime_type',
        'extension', 'size', 'width', 'height',
        'duration_seconds', 'is_looping',
    ];

    protected $casts = [
        'is_looping'       => 'boolean',
        'size'             => 'integer',
        'width'            => 'integer',
        'height'           => 'integer',
        'duration_seconds' => 'integer',
    ];

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->disk_path);
    }
}
