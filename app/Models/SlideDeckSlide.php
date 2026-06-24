<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class SlideDeckSlide extends Model
{
    protected $fillable = ['slide_deck_id', 'sort_order', 'disk_path'];

    protected $casts = ['sort_order' => 'integer'];

    public function deck(): BelongsTo
    {
        return $this->belongsTo(SlideDeck::class, 'slide_deck_id');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->disk_path);
    }
}
