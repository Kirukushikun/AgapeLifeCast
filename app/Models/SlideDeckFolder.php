<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SlideDeckFolder extends Model
{
    protected $fillable = ['name', 'sort_order'];

    public function decks(): HasMany
    {
        return $this->hasMany(SlideDeck::class, 'folder_id')->orderBy('title');
    }
}
