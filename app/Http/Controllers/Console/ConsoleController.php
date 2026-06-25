<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\MediaFolder;
use App\Models\SavedVerse;
use App\Models\Schedule;
use App\Models\VerseFolder;
use App\Models\SlideDeck;
use App\Models\SlideDeckFolder;
use App\Models\Song;
use App\Models\SongFolder;
use App\Models\SchedulePreset;
use App\Models\Theme;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsoleController extends Controller
{
    public function updateSongTheme(Request $request, Song $song): RedirectResponse
    {
        $request->validate(['theme_id' => 'nullable|exists:themes,id']);
        $song->update(['theme_id' => $request->theme_id ?? null]);
        return redirect()->route('console.index', ['song' => $song->id]);
    }

    public function updateTheme(Request $request, Theme $theme): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);
        $theme->update(['name' => $request->name]);
        return redirect()->back();
    }

    public function toggleBlankTheme(Theme $theme): RedirectResponse
    {
        if ($theme->is_blank_screen) {
            $theme->update(['is_blank_screen' => false]);
        } else {
            Theme::where('id', '!=', $theme->id)->update(['is_blank_screen' => false]);
            $theme->update(['is_blank_screen' => true]);
        }
        return redirect()->back();
    }

    public function storeTheme(Request $request): RedirectResponse
    {
        $request->validate([
            'name'              => 'required|string|max:100',
            'bg_type'           => 'required|in:solid,gradient',
            'bg_color'          => 'nullable|string|max:20',
            'bg_gradient_from'  => 'nullable|string|max:20',
            'bg_gradient_to'    => 'nullable|string|max:20',
            'bg_gradient_angle' => 'nullable|integer|min:0|max:360',
            'text_color'        => 'required|string|max:20',
        ]);

        Theme::create([
            'name'              => $request->name,
            'bg_type'           => $request->bg_type,
            'bg_color'          => $request->bg_color,
            'bg_gradient_from'  => $request->bg_gradient_from,
            'bg_gradient_to'    => $request->bg_gradient_to,
            'bg_gradient_angle' => $request->bg_gradient_angle ?? 135,
            'text_color'        => $request->text_color,
            'is_system'         => false,
        ]);

        return redirect()->back();
    }

    public function destroyTheme(Theme $theme): RedirectResponse
    {
        abort_if($theme->is_system, 403, 'System themes cannot be deleted.');
        Song::where('theme_id', $theme->id)->update(['theme_id' => null]);
        $theme->delete();
        return redirect()->back();
    }

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
            'theme_id'    => $v->theme_id,
            'theme'       => $v->theme ? [
                'css_bg'     => $v->theme->css_background,
                'text_color' => $v->theme->text_color,
            ] : null,
        ];

        $verseFolders = VerseFolder::with(['verses' => fn ($q) => $q->with('theme')->orderBy('testament')->orderBy('reference')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => [
                'id'     => $f->id,
                'name'   => $f->name,
                'verses' => $f->verses->map($verseMapFn),
            ]);

        $savedVerses = SavedVerse::whereNull('folder_id')->with('theme')
            ->orderBy('testament')->orderBy('reference')
            ->get()->map($verseMapFn);

        $mediaMapFn = fn ($m) => [
            'id'               => $m->id,
            'folder_id'        => $m->folder_id,
            'title'            => $m->title,
            'type'             => $m->type,
            'extension'        => $m->extension,
            'mime_type'        => $m->mime_type,
            'file_size'        => $m->size,
            'width'            => $m->width,
            'height'           => $m->height,
            'duration_seconds' => $m->duration_seconds,
            'is_looping'       => $m->is_looping,
            'url'              => $m->url,
        ];

        $mediaFolders = MediaFolder::with(['files' => fn ($q) => $q->orderBy('type')->orderBy('title')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => [
                'id'    => $f->id,
                'name'  => $f->name,
                'files' => $f->files->map($mediaMapFn),
            ]);

        $uncategorizedMedia = MediaFile::whereNull('folder_id')
            ->orderBy('type')->orderBy('title')
            ->get()->map($mediaMapFn);

        $deckMapFn = fn ($d) => [
            'id'          => $d->id,
            'folder_id'   => $d->folder_id,
            'title'       => $d->title,
            'extension'   => $d->extension,
            'slide_count' => $d->slide_count,
            'status'      => $d->status,
            'slides'      => $d->slides->map(fn ($s) => [
                'id'         => $s->id,
                'sort_order' => $s->sort_order,
                'url'        => $s->url,
            ]),
        ];

        $slideDeckFolders = SlideDeckFolder::with(['decks.slides'])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => [
                'id'    => $f->id,
                'name'  => $f->name,
                'decks' => $f->decks->map($deckMapFn),
            ]);

        $uncategorizedDecks = SlideDeck::with('slides')
            ->whereNull('folder_id')
            ->orderBy('title')
            ->get()
            ->map($deckMapFn);

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
                    'id'             => $item->id,
                    'schedulable_id' => $item->schedulable_id,
                    'type'           => $type,
                    'name'           => $name,
                    'icon'           => $icon,
                ];
            }),
        ] : null;

        $themes = Theme::orderBy('is_system', 'desc')->orderBy('name')
            ->get()
            ->map(fn ($t) => [
                'id'              => $t->id,
                'name'            => $t->name,
                'css_bg'          => $t->css_background,
                'text_color'      => $t->text_color,
                'is_system'       => $t->is_system,
                'is_blank_screen' => $t->is_blank_screen,
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
            'theme_id'  => $activeSong->theme_id,
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

        $presets = SchedulePreset::orderBy('name')->get()->map(fn ($p) => [
            'id'    => $p->id,
            'name'  => $p->name,
            'count' => count($p->items),
        ]);

        return Inertia::render('Console/Index', [
            'songFolders'        => $songFolders,
            'uncategorizedSongs' => $uncategorizedSongs,
            'verseFolders'  => $verseFolders,
            'savedVerses'   => $savedVerses,
            'mediaFolders'       => $mediaFolders,
            'uncategorizedMedia' => $uncategorizedMedia,
            'slideDeckFolders'  => $slideDeckFolders,
            'uncategorizedDecks' => $uncategorizedDecks,
            'schedule'     => $schedule,
            'themes'       => $themes,
            'selectedSong' => $selectedSong,
            'presets'      => $presets,
        ]);
    }
}
