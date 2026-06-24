<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Theme extends Model
{
    protected $fillable = [
        'name',
        'bg_type',
        'bg_color',
        'bg_gradient_from',
        'bg_gradient_to',
        'bg_gradient_angle',
        'bg_image_path',
        'text_color',
        'is_system',
        'is_blank_screen',
    ];

    protected $casts = [
        'is_system'          => 'boolean',
        'is_blank_screen'    => 'boolean',
        'bg_gradient_angle'  => 'integer',
    ];

    /** CSS background value ready for inline styles */
    public function getCssBackgroundAttribute(): string
    {
        return match ($this->bg_type) {
            'gradient' => "linear-gradient({$this->bg_gradient_angle}deg, {$this->bg_gradient_from}, {$this->bg_gradient_to})",
            'image'    => $this->bg_image_path ? "url('{$this->bg_image_path}')" : '#000000',
            default    => $this->bg_color ?? '#000000',
        };
    }
}
