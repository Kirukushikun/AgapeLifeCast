<?php

namespace Database\Seeders;

use App\Models\MediaFile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MediaFileSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $files = [
            // Images
            [
                'title'     => 'Announcement Slide',
                'type'      => 'image',
                'disk_path' => 'media/announcement-slide.jpg',
                'mime_type' => 'image/jpeg',
                'extension' => 'jpg',
                'width'     => 1920,
                'height'    => 1080,
            ],
            [
                'title'     => 'Church Logo',
                'type'      => 'image',
                'disk_path' => 'media/church-logo.png',
                'mime_type' => 'image/png',
                'extension' => 'png',
                'width'     => 1920,
                'height'    => 1080,
            ],
            [
                'title'     => 'Easter Background',
                'type'      => 'image',
                'disk_path' => 'media/easter-background.jpg',
                'mime_type' => 'image/jpeg',
                'extension' => 'jpg',
                'width'     => 3840,
                'height'    => 2160,
            ],
            // Videos
            [
                'title'            => 'Offering Background',
                'type'             => 'video',
                'disk_path'        => 'media/offering-background.mp4',
                'mime_type'        => 'video/mp4',
                'extension'        => 'mp4',
                'width'            => 1920,
                'height'           => 1080,
                'duration_seconds' => 200,
            ],
            [
                'title'            => 'Welcome Video',
                'type'             => 'video',
                'disk_path'        => 'media/welcome-video.mp4',
                'mime_type'        => 'video/mp4',
                'extension'        => 'mp4',
                'width'            => 1920,
                'height'           => 1080,
                'duration_seconds' => 102,
            ],
            [
                'title'            => 'Worship Background Loop',
                'type'             => 'video',
                'disk_path'        => 'media/worship-loop.mp4',
                'mime_type'        => 'video/mp4',
                'extension'        => 'mp4',
                'width'            => 1920,
                'height'           => 1080,
                'duration_seconds' => 300,
                'is_looping'       => true,
            ],
            // Audio
            [
                'title'            => 'Worship Instrumental',
                'type'             => 'audio',
                'disk_path'        => 'media/worship-instrumental.mp3',
                'mime_type'        => 'audio/mpeg',
                'extension'        => 'mp3',
                'duration_seconds' => 214,
            ],
            [
                'title'            => 'Offering Music',
                'type'             => 'audio',
                'disk_path'        => 'media/offering-music.mp3',
                'mime_type'        => 'audio/mpeg',
                'extension'        => 'mp3',
                'duration_seconds' => 187,
            ],
        ];

        foreach ($files as $file) {
            MediaFile::firstOrCreate(['disk_path' => $file['disk_path']], $file);
        }
    }
}
