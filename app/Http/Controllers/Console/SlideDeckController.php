<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessSlideDeck;
use App\Models\SlideDeck;
use App\Models\SlideDeckFolder;
use App\Models\SlideDeckSlide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SlideDeckController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'file'  => 'required|file|mimes:pdf,png,jpg,jpeg,webp|max:102400',
        ]);

        $file      = $request->file('file');
        $ext       = strtolower($file->getClientOriginalExtension());
        $isPdf     = $ext === 'pdf';

        $path = $file->store('slide_decks/originals', 'public');

        $deck = SlideDeck::create([
            'title'       => $request->title,
            'disk_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'extension'   => $ext,
            'slide_count' => $isPdf ? 0 : 1,
            'size'        => $file->getSize(),
            'status'      => $isPdf ? 'processing' : 'ready',
        ]);

        if ($isPdf) {
            ProcessSlideDeck::dispatch($deck->id);
        } else {
            // Single image file — create one slide immediately
            SlideDeckSlide::create([
                'slide_deck_id' => $deck->id,
                'sort_order'    => 1,
                'disk_path'     => $path,
            ]);
        }

        return back();
    }

    public function storeImages(Request $request)
    {
        $request->validate([
            'title'    => 'required|string|max:255',
            'images'   => 'required|array|min:1|max:200',
            'images.*' => 'required|file|mimes:png,jpg,jpeg,webp|max:20480',
        ]);

        $deck = SlideDeck::create([
            'title'       => $request->title,
            'disk_path'   => '',
            'mime_type'   => 'image/png',
            'extension'   => 'images',
            'slide_count' => count($request->file('images')),
            'size'        => 0,
            'status'      => 'ready',
        ]);

        foreach ($request->file('images') as $i => $image) {
            $imgPath = $image->store("slide_decks/{$deck->id}/slides", 'public');
            SlideDeckSlide::create([
                'slide_deck_id' => $deck->id,
                'sort_order'    => $i + 1,
                'disk_path'     => $imgPath,
            ]);
            $deck->size += $image->getSize();
        }

        $deck->save();

        return back();
    }

    public function destroy(SlideDeck $slideDeck)
    {
        Storage::disk('public')->deleteDirectory("slide_decks/{$slideDeck->id}");
        Storage::disk('public')->delete($slideDeck->disk_path);
        $slideDeck->delete();
        return back();
    }

    public function moveDeck(Request $request, SlideDeck $slideDeck)
    {
        $request->validate(['folder_id' => 'nullable|exists:slide_deck_folders,id']);
        $slideDeck->update(['folder_id' => $request->folder_id]);
        return back();
    }

    public function storeFolder(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);
        SlideDeckFolder::create([
            'name'       => $request->name,
            'sort_order' => SlideDeckFolder::max('sort_order') + 1,
        ]);
        return back();
    }

    public function updateFolder(Request $request, SlideDeckFolder $slideDeckFolder)
    {
        $request->validate(['name' => 'required|string|max:100']);
        $slideDeckFolder->update(['name' => $request->name]);
        return back();
    }

    public function destroyFolder(Request $request, SlideDeckFolder $slideDeckFolder)
    {
        if ($request->boolean('delete_decks')) {
            foreach ($slideDeckFolder->decks as $deck) {
                Storage::disk('public')->deleteDirectory("slide_decks/{$deck->id}");
                Storage::disk('public')->delete($deck->disk_path);
                $deck->delete();
            }
        }
        $slideDeckFolder->delete();
        return back();
    }
}
