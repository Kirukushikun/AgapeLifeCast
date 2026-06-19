<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\MediaFile;
use App\Models\MediaFolder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'file'       => 'required|file|max:102400|mimes:jpg,jpeg,png,gif,webp,svg,mp4,mov,avi,webm,mkv,mp3,wav,ogg,flac,aac,m4a',
            'title'      => 'required|string|max:255',
            'folder_id'  => 'nullable|exists:media_folders,id',
            'is_looping' => 'boolean',
        ]);

        $file = $request->file('file');
        $mime = $file->getMimeType() ?? 'application/octet-stream';

        $type = match(true) {
            str_starts_with($mime, 'image/') => 'image',
            str_starts_with($mime, 'video/') => 'video',
            str_starts_with($mime, 'audio/') => 'audio',
            default                          => 'image',
        };

        $diskPath  = $file->store('media', 'public');
        $extension = strtolower($file->getClientOriginalExtension());

        $width = $height = null;
        if ($type === 'image') {
            $dims = @getimagesize($file->getPathname());
            if ($dims) {
                [$width, $height] = $dims;
            }
        }

        MediaFile::create([
            'folder_id'    => $request->folder_id ?: null,
            'title'        => $request->title,
            'type'         => $type,
            'disk_path'    => $diskPath,
            'mime_type'    => $mime,
            'extension'    => $extension,
            'size'         => $file->getSize(),
            'width'        => $width,
            'height'       => $height,
            'is_looping'   => $request->boolean('is_looping'),
        ]);

        return redirect()->route('console.index');
    }

    public function destroy(MediaFile $mediaFile): RedirectResponse
    {
        Storage::disk('public')->delete($mediaFile->disk_path);
        $mediaFile->delete();
        return redirect()->route('console.index');
    }

    public function moveFile(Request $request, MediaFile $mediaFile): RedirectResponse
    {
        $request->validate(['folder_id' => 'nullable|exists:media_folders,id']);
        $mediaFile->update(['folder_id' => $request->folder_id ?: null]);
        return redirect()->route('console.index');
    }

    public function storeFolder(Request $request): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);

        MediaFolder::create([
            'name'       => $request->name,
            'sort_order' => MediaFolder::max('sort_order') + 1,
        ]);

        return redirect()->route('console.index');
    }

    public function updateFolder(Request $request, MediaFolder $mediaFolder): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);
        $mediaFolder->update(['name' => $request->name]);
        return redirect()->route('console.index');
    }

    public function destroyFolder(Request $request, MediaFolder $mediaFolder): RedirectResponse
    {
        if ($request->boolean('delete_files')) {
            foreach ($mediaFolder->files as $file) {
                Storage::disk('public')->delete($file->disk_path);
            }
            $mediaFolder->files()->delete();
        }
        // nullOnDelete() on FK makes remaining files folderless automatically
        $mediaFolder->delete();
        return redirect()->route('console.index');
    }
}
