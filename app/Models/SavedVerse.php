<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedVerse extends Model
{
    protected $fillable = ['folder_id', 'reference', 'translation', 'testament', 'content', 'theme_id'];

    public function theme(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\Theme::class);
    }
}
