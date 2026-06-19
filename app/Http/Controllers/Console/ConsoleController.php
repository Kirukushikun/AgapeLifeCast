<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\SavedVerse;
use App\Models\Schedule;
use App\Models\SlideDeck;
use App\Models\SongFolder;
use App\Models\Theme;
use Inertia\Inertia;
use Inertia\Response;

class ConsoleController extends Controller
{
    public function index(): Response
    {
        $songFolders = SongFolder::with(['songs' => fn ($q) => $q->withCount('slides')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($folder) => [
                'id'    => $folder->id,
                'name'  => $folder->name,
                'songs' => $folder->songs->map(fn ($song) => [
                    'id'          => $song->id,
                    'title'       => $song->title,
                    'author'      => $song->author,
                    'slide_count' => $song->slides_count,
                ]),
            ]);

        $savedVerses = SavedVerse::orderBy('testament')->orderBy('reference')
            ->get()
            ->map(fn ($v) => [
                'id'          => $v->id,
                'reference'   => $v->reference,
                'translation' => $v->translation,
                'testament'   => $v->testament,
            ]);

        $mediaFiles = MediaFile::orderBy('type')->orderBy('title')
            ->get()
            ->map(fn ($m) => [
                'id'               => $m->id,
                'title'            => $m->title,
                'type'             => $m->type,
                'extension'        => $m->extension,
                'width'            => $m->width,
                'height'           => $m->height,
                'duration_seconds' => $m->duration_seconds,
                'is_looping'       => $m->is_looping,
            ]);

        $slideDecks = SlideDeck::orderBy('title')
            ->get()
            ->map(fn ($d) => [
                'id'          => $d->id,
                'title'       => $d->title,
                'extension'   => $d->extension,
                'slide_count' => $d->slide_count,
            ]);

        // Most recent schedule with its ordered items + their schedulable resolved
        $scheduleModel = Schedule::with(['items' => fn ($q) => $q->orderBy('sort_order')])
            ->with('items.schedulable')
            ->latest()
            ->first();

        $schedule = $scheduleModel ? [
            'id'    => $scheduleModel->id,
            'name'  => $scheduleModel->name,
            'items' => $scheduleModel->items->map(function ($item) {
                $type = class_basename($item->schedulable_type);
                $name = match ($type) {
                    'SavedVerse' => $item->schedulable?->reference,
                    default      => $item->schedulable?->title,
                } ?? 'Unknown';
                $icon = match ($type) {
                    'Song'       => '🎵',
                    'SavedVerse' => '📖',
                    'MediaFile'  => '🎬',
                    'SlideDeck'  => '📊',
                    default      => '📄',
                };

                return [
                    'id'   => $item->id,
                    'type' => $type,
                    'name' => $name,
                    'icon' => $icon,
                ];
            }),
        ] : null;

        $themes = Theme::orderBy('is_system', 'desc')->orderBy('name')
            ->get()
            ->map(fn ($t) => [
                'id'         => $t->id,
                'name'       => $t->name,
                'css_bg'     => $t->css_background,
                'text_color' => $t->text_color,
                'is_system'  => $t->is_system,
            ]);

        return Inertia::render('Console/Index', [
            'songFolders' => $songFolders,
            'savedVerses' => $savedVerses,
            'mediaFiles'  => $mediaFiles,
            'slideDecks'  => $slideDecks,
            'schedule'    => $schedule,
            'themes'      => $themes,
        ]);
    }
}
