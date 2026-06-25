<?php

use App\Http\Controllers\Console\BibleController;
use App\Http\Controllers\Console\ConsoleController;
use App\Http\Controllers\Console\MediaController;
use App\Http\Controllers\Console\ScheduleController;
use App\Http\Controllers\Console\SlideDeckController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/console', [ConsoleController::class, 'index'])->name('console.index');
    Route::post('/console/folders',           [ConsoleController::class, 'storeFolder'])->name('console.folders.store');
    Route::patch('/console/folders/{folder}', [ConsoleController::class, 'updateFolder'])->name('console.folders.update');
    Route::delete('/console/folders/{folder}',[ConsoleController::class, 'destroyFolder'])->name('console.folders.destroy');
    Route::get('/console/bible/search',                  [BibleController::class, 'search'])->name('console.bible.search');
    Route::post('/console/bible',                        [BibleController::class, 'store'])->name('console.bible.store');
    Route::patch('/console/bible/{verse}/move',          [BibleController::class, 'moveVerse'])->name('console.bible.move');
    Route::delete('/console/bible/{verse}',              [BibleController::class, 'destroy'])->name('console.bible.destroy');
    Route::post('/console/verse-folders',                [BibleController::class, 'storeFolder'])->name('console.verse-folders.store');
    Route::patch('/console/verse-folders/{verseFolder}', [BibleController::class, 'updateFolder'])->name('console.verse-folders.update');
    Route::delete('/console/verse-folders/{verseFolder}',[BibleController::class, 'destroyFolder'])->name('console.verse-folders.destroy');

    // Media Files
    Route::post('/console/media',                              [MediaController::class, 'store'])->name('console.media.store');
    Route::delete('/console/media/{mediaFile}',                [MediaController::class, 'destroy'])->name('console.media.destroy');
    Route::patch('/console/media/{mediaFile}/move',            [MediaController::class, 'moveFile'])->name('console.media.move');
    // Media Folders
    Route::post('/console/media-folders',                      [MediaController::class, 'storeFolder'])->name('console.media-folders.store');
    Route::patch('/console/media-folders/{mediaFolder}',       [MediaController::class, 'updateFolder'])->name('console.media-folders.update');
    Route::delete('/console/media-folders/{mediaFolder}',      [MediaController::class, 'destroyFolder'])->name('console.media-folders.destroy');

    // Slide Decks
    Route::post('/console/slide-decks',                              [SlideDeckController::class, 'store'])->name('console.slide-decks.store');
    Route::post('/console/slide-decks/images',                       [SlideDeckController::class, 'storeImages'])->name('console.slide-decks.store-images');
    Route::patch('/console/slide-decks/{slideDeck}/move',            [SlideDeckController::class, 'moveDeck'])->name('console.slide-decks.move');
    Route::delete('/console/slide-decks/{slideDeck}',                [SlideDeckController::class, 'destroy'])->name('console.slide-decks.destroy');
    // Slide Deck Folders
    Route::post('/console/slide-deck-folders',                       [SlideDeckController::class, 'storeFolder'])->name('console.slide-deck-folders.store');
    Route::patch('/console/slide-deck-folders/{slideDeckFolder}',    [SlideDeckController::class, 'updateFolder'])->name('console.slide-deck-folders.update');
    Route::delete('/console/slide-deck-folders/{slideDeckFolder}',   [SlideDeckController::class, 'destroyFolder'])->name('console.slide-deck-folders.destroy');

    // Schedule Items
    Route::post('/console/schedule-items',                  [ScheduleController::class, 'store'])->name('console.schedule-items.store');
    Route::delete('/console/schedule-items/{scheduleItem}', [ScheduleController::class, 'destroy'])->name('console.schedule-items.destroy');
    Route::delete('/console/schedule',                      [ScheduleController::class, 'clearSchedule'])->name('console.schedule.clear');
    // Schedule Presets
    Route::post('/console/schedule-presets',                      [ScheduleController::class, 'storePreset'])->name('console.schedule-presets.store');
    Route::post('/console/schedule-presets/{preset}/load',        [ScheduleController::class, 'loadPreset'])->name('console.schedule-presets.load');
    Route::delete('/console/schedule-presets/{preset}',           [ScheduleController::class, 'destroyPreset'])->name('console.schedule-presets.destroy');

    Route::post('/console/songs',                    [ConsoleController::class, 'storeSong'])->name('console.songs.store');
    Route::patch('/console/songs/{song}',            [ConsoleController::class, 'updateSong'])->name('console.songs.update');
    Route::patch('/console/songs/{song}/move',       [ConsoleController::class, 'moveSong'])->name('console.songs.move');
    Route::patch('/console/songs/{song}/theme',      [ConsoleController::class, 'updateSongTheme'])->name('console.songs.theme');
    Route::delete('/console/songs/{song}',           [ConsoleController::class, 'destroySong'])->name('console.songs.destroy');

    // Themes
    Route::post('/console/themes',                      [ConsoleController::class, 'storeTheme'])->name('console.themes.store');
    Route::patch('/console/themes/{theme}',             [ConsoleController::class, 'updateTheme'])->name('console.themes.update');
    Route::patch('/console/themes/{theme}/blank',       [ConsoleController::class, 'toggleBlankTheme'])->name('console.themes.blank');
    Route::delete('/console/themes/{theme}',            [ConsoleController::class, 'destroyTheme'])->name('console.themes.destroy');
});
