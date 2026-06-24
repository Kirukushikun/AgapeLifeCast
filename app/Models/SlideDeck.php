<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SlideDeck extends Model
{
    protected $fillable = [
        'folder_id', 'title', 'disk_path', 'mime_type',
        'extension', 'slide_count', 'size', 'status',
    ];

    protected $casts = [
        'slide_count' => 'integer',
        'size'        => 'integer',
    ];

    public function folder(): BelongsTo
    {
        return $this->belongsTo(SlideDeckFolder::class, 'folder_id');
    }

    public function slides(): HasMany
    {
        return $this->hasMany(SlideDeckSlide::class)->orderBy('sort_order');
    }
}
