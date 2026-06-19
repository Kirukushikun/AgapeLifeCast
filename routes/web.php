<?php

use App\Http\Controllers\Console\BibleController;
use App\Http\Controllers\Console\ConsoleController;
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

    Route::post('/console/songs',              [ConsoleController::class, 'storeSong'])->name('console.songs.store');
    Route::patch('/console/songs/{song}',      [ConsoleController::class, 'updateSong'])->name('console.songs.update');
    Route::patch('/console/songs/{song}/move', [ConsoleController::class, 'moveSong'])->name('console.songs.move');
    Route::delete('/console/songs/{song}',     [ConsoleController::class, 'destroySong'])->name('console.songs.destroy');
});
