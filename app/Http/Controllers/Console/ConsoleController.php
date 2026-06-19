<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
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

        return Inertia::render('Console/Index', [
            'songFolders' => $songFolders,
        ]);
    }
}
