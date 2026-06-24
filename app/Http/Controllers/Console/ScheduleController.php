<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\SavedVerse;
use App\Models\Schedule;
use App\Models\ScheduleItem;
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
}
