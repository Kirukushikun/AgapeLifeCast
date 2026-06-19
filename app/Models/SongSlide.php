<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SongSlide extends Model
{
    protected $fillable = ['song_id', 'sort_order', 'label', 'content'];

    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }
}
