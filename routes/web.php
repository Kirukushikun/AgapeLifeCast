<?php

use App\Http\Controllers\Console\ConsoleController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/console', [ConsoleController::class, 'index'])->name('console.index');
});
