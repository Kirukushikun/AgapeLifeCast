<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchedulePreset extends Model
{
    protected $fillable = ['name', 'items'];

    protected $casts = ['items' => 'array'];
}
