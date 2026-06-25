<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\SavedVerse;
use App\Models\Schedule;
use App\Models\ScheduleItem;
use App\Models\SchedulePreset;
use App\Models\SlideDeck;
use App\Models\Song;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'schedulable_type' => 'required|in:song,verse,media,deck',
            'schedulable_id'   => 'required|integer',
        ]);

        $typeMap = [
            'song'  => Song::class,
            'verse' => SavedVerse::class,
            'media' => MediaFile::class,
            'deck'  => SlideDeck::class,
        ];

        $schedule = Schedule::latest()->first()
            ?? Schedule::create(['name' => 'Default Schedule']);

        $maxOrder = $schedule->items()->max('sort_order') ?? -1;

        $schedule->items()->create([
            'schedulable_type' => $typeMap[$request->schedulable_type],
            'schedulable_id'   => $request->schedulable_id,
            'sort_order'       => $maxOrder + 1,
        ]);

        return redirect()->back();
    }

    public function destroy(ScheduleItem $scheduleItem): RedirectResponse
    {
        $scheduleItem->delete();
        return redirect()->back();
    }

    public function clearSchedule(): RedirectResponse
    {
        $schedule = Schedule::latest()->first();
        if ($schedule) {
            $schedule->items()->delete();
        }
        return redirect()->back();
    }

    public function storePreset(Request $request): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);

        $schedule = Schedule::with(['items' => fn ($q) => $q->orderBy('sort_order')])->latest()->first();
        if (!$schedule || $schedule->items->isEmpty()) {
            return redirect()->back();
        }

        $items = $schedule->items->map(fn ($item) => [
            'schedulable_type' => $item->schedulable_type,
            'schedulable_id'   => $item->schedulable_id,
        ])->toArray();

        SchedulePreset::create(['name' => $request->name, 'items' => $items]);
        return redirect()->back();
    }

    public function loadPreset(SchedulePreset $preset): RedirectResponse
    {
        $schedule = Schedule::latest()->first()
            ?? Schedule::create(['name' => 'Default Schedule']);

        $schedule->items()->delete();

        foreach ($preset->items as $i => $item) {
            $schedule->items()->create([
                'schedulable_type' => $item['schedulable_type'],
                'schedulable_id'   => $item['schedulable_id'],
                'sort_order'       => $i,
            ]);
        }

        return redirect()->back();
    }

    public function destroyPreset(SchedulePreset $preset): RedirectResponse
    {
        $preset->delete();
        return redirect()->back();
    }
}
