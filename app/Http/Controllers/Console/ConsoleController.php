<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\SavedVerse;
use App\Models\Schedule;
use App\Models\VerseFolder;
use App\Models\SlideDeck;
use App\Models\Song;
use App\Models\SongFolder;
use App\Models\Theme;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsoleController extends Controller
{
    public function moveSong(Request $request, Song $song): RedirectResponse
    {
        $request->validate(['folder_id' => 'required|exists:song_folders,id']);
        $song->update(['folder_id' => $request->folder_id]);
        return redirect()->route('console.index', ['song' => $song->id]);
    }

    public function updateSong(Request $request, Song $song): RedirectResponse
    {
        $request->validate([
            'title'              => 'required|string|max:200',
            'author'             => 'nullable|string|max:200',
            'folder_id'          => 'nullable|exists:song_folders,id',
            'slides'             => 'required|array|min:1',
            'slides.*.label'     => 'nullable|string|max:100',
            'slides.*.content'   => 'required|string',
        ]);

        $song->update([
            'title'     => $request->title,
            'author'    => $request->author,
            'folder_id' => $request->folder_id ?: null,
        ]);

        $song->slides()->delete();
        foreach ($request->slides as $i => $slide) {
            $song->slides()->create([
                'sort_order' => $i,
                'label'      => $slide['label'] ?: null,
                'content'    => $slide['content'],
            ]);
        }

        return redirect()->route('console.index', ['song' => $song->id]);
    }

    public function destroySong(Song $song): RedirectResponse
    {
        $song->slides()->delete();
        $song->delete();
        return redirect()->route('console.index');
    }

    public function storeSong(Request $request): RedirectResponse
    {
        $request->validate([
            'title'              => 'required|string|max:200',
            'author'             => 'nullable|string|max:200',
            'folder_id'          => 'nullable|exists:song_folders,id',
            'theme_id'           => 'nullable|exists:themes,id',
            'slides'             => 'required|array|min:1',
            'slides.*.label'     => 'nullable|string|max:100',
            'slides.*.content'   => 'required|string',
        ]);

        $song = Song::create([
            'folder_id' => $request->folder_id,
            'theme_id'  => $request->theme_id ?: null,
            'title'     => $request->title,
            'author'    => $request->author,
        ]);

        foreach ($request->slides as $i => $slide) {
            $song->slides()->create([
                'sort_order' => $i,
                'label'      => $slide['label'] ?: null,
                'content'    => $slide['content'],
            ]);
        }

        return redirect()->route('console.index', ['song' => $song->id]);
    }

    public function updateFolder(Request $request, SongFolder $folder): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);
        $folder->update(['name' => $request->name]);
        return redirect()->route('console.index');
    }

    public function destroyFolder(Request $request, SongFolder $folder): RedirectResponse
    {
        if ($request->boolean('delete_songs')) {
            $folder->songs->each(fn ($song) => $song->slides()->delete());
            $folder->songs()->delete();
        }
        // nullOnDelete() on the FK handles making songs folderless automatically
        $folder->delete();
        return redirect()->route('console.index');
    }

    public function storeFolder(Request $request): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);

        SongFolder::create([
            'name'       => $request->name,
            'sort_order' => SongFolder::max('sort_order') + 1,
        ]);

        return redirect()->route('console.index');
    }

    public function index(): Response
    {
        $uncategorizedSongs = Song::whereNull('folder_id')->withCount('slides')->orderBy('title')->get()
            ->map(fn ($song) => [
                'id'          => $song->id,
                'title'       => $song->title,
                'author'      => $song->author,
                'slide_count' => $song->slides_count,
            ]);

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

        $verseMapFn = fn ($v) => [
            'id'          => $v->id,
            'reference'   => $v->reference,
            'translation' => $v->translation,
            'testament'   => $v->testament,
            'content'     => $v->content,
        ];

        $verseFolders = VerseFolder::with(['verses' => fn ($q) => $q->orderBy('testament')->orderBy('reference')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => [
                'id'     => $f->id,
                'name'   => $f->name,
                'verses' => $f->verses->map($verseMapFn),
            ]);

        $savedVerses = SavedVerse::whereNull('folder_id')
            ->orderBy('testament')->orderBy('reference')
            ->get()->map($verseMapFn);

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

        // Resolve which song to show in PreviewArea
        $songId    = request()->integer('song', 0);
        $activeSong = $songId
            ? Song::with(['slides', 'theme'])->find($songId)
            : Song::with(['slides', 'theme'])
                ->whereHas('scheduleItems', fn ($q) => $q->where('schedule_id', $scheduleModel?->id))
                ->orderByRaw('(SELECT sort_order FROM schedule_items WHERE schedulable_id = songs.id AND schedulable_type = ? LIMIT 1)', [Song::class])
                ->first()
                ?? Song::with(['slides', 'theme'])->first();

        $selectedSong = $activeSong ? [
            'id'        => $activeSong->id,
            'title'     => $activeSong->title,
            'author'    => $activeSong->author,
            'folder_id' => $activeSong->folder_id,
            'slides' => $activeSong->slides->map(fn ($s) => [
                'id'      => $s->id,
                'label'   => $s->label,
                'content' => $s->content,
            ]),
            'theme' => $activeSong->theme ? [
                'css_bg'     => $activeSong->theme->css_background,
                'text_color' => $activeSong->theme->text_color,
            ] : null,
        ] : null;

        return Inertia::render('Console/Index', [
            'songFolders'        => $songFolders,
            'uncategorizedSongs' => $uncategorizedSongs,
            'verseFolders'  => $verseFolders,
            'savedVerses'   => $savedVerses,
            'mediaFiles'  => $mediaFiles,
            'slideDecks'  => $slideDecks,
            'schedule'     => $schedule,
            'themes'       => $themes,
            'selectedSong' => $selectedSong,
        ]);
    }
}
