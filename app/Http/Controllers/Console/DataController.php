<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\SavedVerse;
use App\Models\SchedulePreset;
use App\Models\Song;
use App\Models\SongFolder;
use App\Models\SongSlide;
use App\Models\Theme;
use App\Models\VerseFolder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DataController extends Controller
{
    public function export()
    {
        $formatTheme = fn ($t) => $t ? [
            'name'              => $t->name,
            'bg_type'           => $t->bg_type,
            'bg_color'          => $t->bg_color,
            'bg_gradient_from'  => $t->bg_gradient_from,
            'bg_gradient_to'    => $t->bg_gradient_to,
            'bg_gradient_angle' => $t->bg_gradient_angle,
            'bg_image_path'     => $t->bg_image_path,
            'text_color'        => $t->text_color,
            'is_blank_screen'   => $t->is_blank_screen,
        ] : null;

        $formatSong = fn ($song) => [
            'title'  => $song->title,
            'author' => $song->author,
            'style'  => $song->style,
            'theme'  => $formatTheme($song->theme),
            'slides' => $song->slides->map(fn ($s) => [
                'sort_order' => $s->sort_order,
                'label'      => $s->label,
                'content'    => $s->content,
            ])->all(),
        ];

        $formatVerse = fn ($v) => [
            'reference'   => $v->reference,
            'translation' => $v->translation,
            'testament'   => $v->testament,
            'content'     => $v->content,
        ];

        $formatPreset = function ($preset) {
            $items = collect($preset->items)->map(function ($item) {
                $shortType = class_basename($item['schedulable_type']);

                if ($shortType === 'Song') {
                    $song = Song::with('folder')->find($item['schedulable_id']);
                    return $song ? ['type' => 'Song', 'title' => $song->title, 'folder' => $song->folder?->name] : null;
                }

                if ($shortType === 'SavedVerse') {
                    $verse = SavedVerse::find($item['schedulable_id']);
                    return $verse ? ['type' => 'SavedVerse', 'reference' => $verse->reference, 'translation' => $verse->translation] : null;
                }

                return null;
            })->filter()->values()->all();

            return ['name' => $preset->name, 'items' => $items];
        };

        $data = [
            'version'              => '1',
            'exported_at'          => now()->toIso8601String(),
            'song_folders'         => SongFolder::with(['songs.slides', 'songs.theme'])->orderBy('name')->get()
                ->map(fn ($f) => ['name' => $f->name, 'songs' => $f->songs->map($formatSong)->all()])
                ->all(),
            'uncategorized_songs'  => Song::whereNull('folder_id')->with(['slides', 'theme'])->orderBy('title')->get()
                ->map($formatSong)->all(),
            'verse_folders'        => VerseFolder::with('verses')->orderBy('name')->get()
                ->map(fn ($f) => ['name' => $f->name, 'verses' => $f->verses->map($formatVerse)->all()])
                ->all(),
            'uncategorized_verses' => SavedVerse::whereNull('folder_id')->orderBy('reference')->get()
                ->map($formatVerse)->all(),
            'themes'               => Theme::where('is_system', false)->orderBy('name')->get()
                ->map($formatTheme)->all(),
            'schedule_presets'     => SchedulePreset::orderBy('name')->get()
                ->map($formatPreset)->all(),
        ];

        $filename = 'lifecast-backup-' . now()->format('Y-m-d') . '.json';

        return response()
            ->json($data, 200, [
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:json,txt|max:20480',
        ]);

        $raw  = file_get_contents($request->file('file')->getRealPath());
        $data = json_decode($raw, true);

        if (! $data || ! isset($data['version'])) {
            return back()->withErrors(['file' => 'Invalid LifeCast backup file.']);
        }

        DB::transaction(function () use ($data) {
            // ── Themes ──────────────────────────────────────────────────────
            $themeMap = []; // name → id (for song theme assignment)

            foreach ($data['themes'] ?? [] as $t) {
                $theme = Theme::firstOrCreate(
                    ['name' => $t['name'], 'is_system' => false],
                    [
                        'bg_type'           => $t['bg_type']           ?? 'color',
                        'bg_color'          => $t['bg_color']          ?? '#000000',
                        'bg_gradient_from'  => $t['bg_gradient_from']  ?? null,
                        'bg_gradient_to'    => $t['bg_gradient_to']    ?? null,
                        'bg_gradient_angle' => $t['bg_gradient_angle'] ?? 135,
                        'bg_image_path'     => $t['bg_image_path']     ?? null,
                        'text_color'        => $t['text_color']        ?? '#ffffff',
                        'is_blank_screen'   => $t['is_blank_screen']   ?? false,
                    ]
                );
                $themeMap[$t['name']] = $theme->id;
            }

            // ── Songs ────────────────────────────────────────────────────────
            $importSongs = function (array $songs, ?int $folderId) use ($themeMap) {
                foreach ($songs as $s) {
                    $themeId = isset($s['theme']['name']) ? ($themeMap[$s['theme']['name']] ?? null) : null;

                    $song = Song::firstOrCreate(
                        ['title' => $s['title'], 'folder_id' => $folderId],
                        [
                            'author'   => $s['author'] ?? null,
                            'style'    => $s['style']  ?? null,
                            'theme_id' => $themeId,
                        ]
                    );

                    if ($song->wasRecentlyCreated) {
                        foreach ($s['slides'] ?? [] as $slide) {
                            SongSlide::create([
                                'song_id'    => $song->id,
                                'sort_order' => $slide['sort_order'],
                                'label'      => $slide['label']   ?? null,
                                'content'    => $slide['content'] ?? '',
                            ]);
                        }
                    }
                }
            };

            foreach ($data['song_folders'] ?? [] as $folder) {
                $sf = SongFolder::firstOrCreate(['name' => $folder['name']]);
                $importSongs($folder['songs'] ?? [], $sf->id);
            }
            $importSongs($data['uncategorized_songs'] ?? [], null);

            // ── Verses ───────────────────────────────────────────────────────
            $importVerses = function (array $verses, ?int $folderId) {
                foreach ($verses as $v) {
                    SavedVerse::firstOrCreate(
                        ['reference' => $v['reference'], 'translation' => $v['translation']],
                        [
                            'folder_id' => $folderId,
                            'testament' => $v['testament'] ?? 'new',
                            'content'   => $v['content']  ?? '',
                        ]
                    );
                }
            };

            foreach ($data['verse_folders'] ?? [] as $folder) {
                $vf = VerseFolder::firstOrCreate(['name' => $folder['name']]);
                $importVerses($folder['verses'] ?? [], $vf->id);
            }
            $importVerses($data['uncategorized_verses'] ?? [], null);

            // ── Schedule Presets ─────────────────────────────────────────────
            foreach ($data['schedule_presets'] ?? [] as $preset) {
                if (SchedulePreset::where('name', $preset['name'])->exists()) {
                    continue;
                }

                $items = [];
                foreach ($preset['items'] ?? [] as $item) {
                    if ($item['type'] === 'Song') {
                        $song = Song::where('title', $item['title'])->first();
                        if ($song) {
                            $items[] = ['schedulable_type' => Song::class, 'schedulable_id' => $song->id];
                        }
                    } elseif ($item['type'] === 'SavedVerse') {
                        $verse = SavedVerse::where('reference', $item['reference'])
                            ->where('translation', $item['translation'])
                            ->first();
                        if ($verse) {
                            $items[] = ['schedulable_type' => SavedVerse::class, 'schedulable_id' => $verse->id];
                        }
                    }
                }

                if (! empty($items)) {
                    SchedulePreset::create(['name' => $preset['name'], 'items' => $items]);
                }
            }
        });

        return back();
    }
}
