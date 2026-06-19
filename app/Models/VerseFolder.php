<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerseFolder extends Model
{
    protected $fillable = ['name', 'sort_order'];

    public function verses()
    {
        return $this->hasMany(SavedVerse::class, 'folder_id');
    }
}
