<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ScheduleItem extends Model
{
    protected $fillable = [
        'schedule_id',
        'sort_order',
        'schedulable_type',
        'schedulable_id',
        'theme_id',
        'style',
    ];

    protected $casts = [
        'style' => 'array',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    /** Polymorphic: resolves to Song, BibleVerse, Media, etc. */
    public function schedulable(): MorphTo
    {
        return $this->morphTo();
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }
}
