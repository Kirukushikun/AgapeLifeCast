<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\SavedVerse;
use App\Models\SlideDeck;
use App\Models\SongFolder;
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

        return Inertia::render('Console/Index', [
            'songFolders' => $songFolders,
            'savedVerses' => $savedVerses,
            'mediaFiles'  => $mediaFiles,
            'slideDecks'  => $slideDecks,
        ]);
    }
}
