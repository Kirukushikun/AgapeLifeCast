<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Song extends Model
{
    protected $fillable = ['folder_id', 'theme_id', 'title', 'author', 'style'];

    protected $casts = [
        'style' => 'array',
    ];

    public function folder(): BelongsTo
    {
        return $this->belongsTo(SongFolder::class, 'folder_id');
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function slides(): HasMany
    {
        return $this->hasMany(SongSlide::class)->orderBy('sort_order');
    }

    public function scheduleItems(): MorphMany
    {
        return $this->morphMany(ScheduleItem::class, 'schedulable');
    }
}
