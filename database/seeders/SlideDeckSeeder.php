<?php

namespace Database\Seeders;

use App\Models\SlideDeck;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SlideDeckSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $decks = [
            [
                'title'       => 'Sermon Notes – June',
                'disk_path'   => 'slides/sermon-notes-june.pptx',
                'mime_type'   => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'extension'   => 'pptx',
                'slide_count' => 12,
            ],
            [
                'title'       => 'Sunday Announcements',
                'disk_path'   => 'slides/sunday-announcements.pptx',
                'mime_type'   => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'extension'   => 'pptx',
                'slide_count' => 8,
            ],
            [
                'title'       => 'Church Vision 2026',
                'disk_path'   => 'slides/church-vision-2026.pdf',
                'mime_type'   => 'application/pdf',
                'extension'   => 'pdf',
                'slide_count' => 5,
            ],
            [
                'title'       => 'Baptism Order of Service',
                'disk_path'   => 'slides/baptism-order-of-service.pptx',
                'mime_type'   => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'extension'   => 'pptx',
                'slide_count' => 4,
            ],
            [
                'title'       => 'Christmas Program',
                'disk_path'   => 'slides/christmas-program.pptx',
                'mime_type'   => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'extension'   => 'pptx',
                'slide_count' => 20,
            ],
        ];

        foreach ($decks as $deck) {
            SlideDeck::firstOrCreate(['disk_path' => $deck['disk_path']], $deck);
        }
    }
}
