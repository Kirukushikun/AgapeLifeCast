<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedVerse extends Model
{
    protected $fillable = ['folder_id', 'reference', 'translation', 'testament', 'content'];
}
