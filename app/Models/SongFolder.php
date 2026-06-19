<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SongFolder extends Model
{
    protected $fillable = ['name', 'sort_order'];

    public function songs(): HasMany
    {
        return $this->hasMany(Song::class, 'folder_id')->orderBy('title');
    }
}
