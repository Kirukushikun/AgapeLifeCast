<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    protected $fillable = ['name', 'service_date'];

    protected $casts = [
        'service_date' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ScheduleItem::class)->orderBy('sort_order');
    }
}
