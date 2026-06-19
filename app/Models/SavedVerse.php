<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedVerse extends Model
{
    protected $fillable = ['reference', 'translation', 'testament', 'content'];
}
