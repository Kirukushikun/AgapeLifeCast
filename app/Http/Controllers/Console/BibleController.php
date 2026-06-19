<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\SavedVerse;
use App\Models\VerseFolder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BibleController extends Controller
{
    // Map of lowercase book names/abbreviations → [API.Bible ID, testament]
    private const BOOKS = [
        // Old Testament
        'genesis' => ['GEN','old'], 'gen' => ['GEN','old'],
        'exodus' => ['EXO','old'], 'exo' => ['EXO','old'],
        'leviticus' => ['LEV','old'], 'lev' => ['LEV','old'],
        'numbers' => ['NUM','old'], 'num' => ['NUM','old'],
        'deuteronomy' => ['DEU','old'], 'deu' => ['DEU','old'], 'deut' => ['DEU','old'],
        'joshua' => ['JOS','old'], 'jos' => ['JOS','old'], 'josh' => ['JOS','old'],
        'judges' => ['JDG','old'], 'jdg' => ['JDG','old'], 'judg' => ['JDG','old'],
        'ruth' => ['RUT','old'], 'rut' => ['RUT','old'],
        '1 samuel' => ['1SA','old'], '1sa' => ['1SA','old'], '1sam' => ['1SA','old'],
        '2 samuel' => ['2SA','old'], '2sa' => ['2SA','old'], '2sam' => ['2SA','old'],
        '1 kings' => ['1KI','old'], '1ki' => ['1KI','old'], '1kgs' => ['1KI','old'],
        '2 kings' => ['2KI','old'], '2ki' => ['2KI','old'], '2kgs' => ['2KI','old'],
        '1 chronicles' => ['1CH','old'], '1ch' => ['1CH','old'], '1chr' => ['1CH','old'],
        '2 chronicles' => ['2CH','old'], '2ch' => ['2CH','old'], '2chr' => ['2CH','old'],
        'ezra' => ['EZR','old'], 'ezr' => ['EZR','old'],
        'nehemiah' => ['NEH','old'], 'neh' => ['NEH','old'],
        'esther' => ['EST','old'], 'est' => ['EST','old'],
        'job' => ['JOB','old'],
        'psalms' => ['PSA','old'], 'psalm' => ['PSA','old'], 'ps' => ['PSA','old'], 'psa' => ['PSA','old'],
        'proverbs' => ['PRO','old'], 'prov' => ['PRO','old'], 'pro' => ['PRO','old'],
        'ecclesiastes' => ['ECC','old'], 'ecc' => ['ECC','old'], 'eccl' => ['ECC','old'],
        'song of solomon' => ['SNG','old'], 'song of songs' => ['SNG','old'], 'song' => ['SNG','old'],
        'isaiah' => ['ISA','old'], 'isa' => ['ISA','old'],
        'jeremiah' => ['JER','old'], 'jer' => ['JER','old'],
        'lamentations' => ['LAM','old'], 'lam' => ['LAM','old'],
        'ezekiel' => ['EZK','old'], 'ezk' => ['EZK','old'], 'ezek' => ['EZK','old'],
        'daniel' => ['DAN','old'], 'dan' => ['DAN','old'],
        'hosea' => ['HOS','old'], 'hos' => ['HOS','old'],
        'joel' => ['JOL','old'], 'jol' => ['JOL','old'],
        'amos' => ['AMO','old'], 'amo' => ['AMO','old'],
        'obadiah' => ['OBA','old'], 'oba' => ['OBA','old'],
        'jonah' => ['JON','old'], 'jon' => ['JON','old'],
        'micah' => ['MIC','old'], 'mic' => ['MIC','old'],
        'nahum' => ['NAM','old'], 'nam' => ['NAM','old'],
        'habakkuk' => ['HAB','old'], 'hab' => ['HAB','old'],
        'zephaniah' => ['ZEP','old'], 'zep' => ['ZEP','old'],
        'haggai' => ['HAG','old'], 'hag' => ['HAG','old'],
        'zechariah' => ['ZEC','old'], 'zec' => ['ZEC','old'],
        'malachi' => ['MAL','old'], 'mal' => ['MAL','old'],
        // New Testament
        'matthew' => ['MAT','new'], 'mat' => ['MAT','new'], 'matt' => ['MAT','new'],
        'mark' => ['MRK','new'], 'mrk' => ['MRK','new'],
        'luke' => ['LUK','new'], 'luk' => ['LUK','new'],
        'john' => ['JHN','new'], 'jhn' => ['JHN','new'], 'jn' => ['JHN','new'],
        'acts' => ['ACT','new'], 'act' => ['ACT','new'],
        'romans' => ['ROM','new'], 'rom' => ['ROM','new'],
        '1 corinthians' => ['1CO','new'], '1co' => ['1CO','new'], '1cor' => ['1CO','new'],
        '2 corinthians' => ['2CO','new'], '2co' => ['2CO','new'], '2cor' => ['2CO','new'],
        'galatians' => ['GAL','new'], 'gal' => ['GAL','new'],
        'ephesians' => ['EPH','new'], 'eph' => ['EPH','new'],
        'philippians' => ['PHP','new'], 'php' => ['PHP','new'], 'phil' => ['PHP','new'],
        'colossians' => ['COL','new'], 'col' => ['COL','new'],
        '1 thessalonians' => ['1TH','new'], '1th' => ['1TH','new'], '1thess' => ['1TH','new'],
        '2 thessalonians' => ['2TH','new'], '2th' => ['2TH','new'], '2thess' => ['2TH','new'],
        '1 timothy' => ['1TI','new'], '1ti' => ['1TI','new'], '1tim' => ['1TI','new'],
        '2 timothy' => ['2TI','new'], '2ti' => ['2TI','new'], '2tim' => ['2TI','new'],
        'titus' => ['TIT','new'], 'tit' => ['TIT','new'],
        'philemon' => ['PHM','new'], 'phm' => ['PHM','new'],
        'hebrews' => ['HEB','new'], 'heb' => ['HEB','new'],
        'james' => ['JAS','new'], 'jas' => ['JAS','new'],
        '1 peter' => ['1PE','new'], '1pe' => ['1PE','new'], '1pet' => ['1PE','new'],
        '2 peter' => ['2PE','new'], '2pe' => ['2PE','new'], '2pet' => ['2PE','new'],
        '1 john' => ['1JN','new'], '1jn' => ['1JN','new'],
        '2 john' => ['2JN','new'], '2jn' => ['2JN','new'],
        '3 john' => ['3JN','new'], '3jn' => ['3JN','new'],
        'jude' => ['JUD','new'], 'jud' => ['JUD','new'],
        'revelation' => ['REV','new'], 'rev' => ['REV','new'],
    ];

    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'reference' => 'required|string|max:100',
            'version'   => 'required|in:NIV,TCB,GNT',
        ]);

        $bibleIds = [
            'NIV' => config('services.bible.niv_id'),
            'TCB' => config('services.bible.tcb_id'),
            'GNT' => config('services.bible.gnt_id'),
        ];

        $bibleId = $bibleIds[$request->version];
        if (!$bibleId) {
            return response()->json(['error' => 'Translation not configured. Add the Bible ID to .env.'], 503);
        }

        $parsed = $this->parseReference($request->reference);
        if (!$parsed) {
            return response()->json(['error' => 'Could not parse reference. Try "John 3:16" or "Romans 8:28-30".'], 422);
        }

        ['passageId' => $passageId, 'testament' => $testament, 'reference' => $cleanRef] = $parsed;

        $response = Http::withHeaders(['api-key' => config('services.bible.api_key')])
            ->get("https://api.scripture.api.bible/v1/bibles/{$bibleId}/passages/{$passageId}", [
                'content-type'            => 'html',
                'include-notes'           => 'false',
                'include-titles'          => 'false',
                'include-chapter-numbers' => 'false',
                'include-verse-numbers'   => 'true',
            ]);

        if ($response->status() === 404) {
            return response()->json(['error' => 'Verse not found. Check the reference and try again.'], 404);
        }
        if (!$response->ok()) {
            return response()->json(['error' => 'Bible API error. Check your API key.'], 502);
        }

        $data = $response->json('data');
        $html = $data['content'] ?? '';

        // Extract per-verse chunks: <span class="v">N</span>…text… up to next verse span
        preg_match_all(
            '/<span[^>]+class="v"[^>]*>\s*(\d+)\s*<\/span>(.*?)(?=<span[^>]+class="v"|$)/is',
            $html,
            $m,
            PREG_SET_ORDER
        );

        if (!empty($m)) {
            $verses = array_map(fn($match) => [
                'number' => (int) $match[1],
                'text'   => trim(preg_replace('/\s+/', ' ', strip_tags($match[2]))),
            ], $m);
        } else {
            $verses = [['number' => null, 'text' => trim(preg_replace('/\s+/', ' ', strip_tags($html)))]];
        }

        $content = implode(' ', array_column($verses, 'text'));

        return response()->json([
            'reference' => $data['reference'] ?? $cleanRef,
            'content'   => $content,
            'verses'    => $verses,
            'version'   => $request->version,
            'testament' => $testament,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'reference'  => 'required|string|max:200',
            'content'    => 'required|string',
            'translation'=> 'required|in:NIV,TCB,GNT',
            'testament'  => 'required|in:old,new',
            'folder_id'  => 'nullable|exists:verse_folders,id',
        ]);

        SavedVerse::create($request->only('folder_id', 'reference', 'content', 'translation', 'testament'));

        return redirect()->route('console.index');
    }

    public function moveVerse(Request $request, SavedVerse $verse): RedirectResponse
    {
        $request->validate(['folder_id' => 'nullable|exists:verse_folders,id']);
        $verse->update(['folder_id' => $request->folder_id]);
        return redirect()->route('console.index');
    }

    public function destroy(SavedVerse $verse): RedirectResponse
    {
        $verse->delete();
        return redirect()->route('console.index');
    }

    public function storeFolder(Request $request): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);
        VerseFolder::create([
            'name'       => $request->name,
            'sort_order' => VerseFolder::max('sort_order') + 1,
        ]);
        return redirect()->route('console.index');
    }

    public function updateFolder(Request $request, VerseFolder $verseFolder): RedirectResponse
    {
        $request->validate(['name' => 'required|string|max:100']);
        $verseFolder->update(['name' => $request->name]);
        return redirect()->route('console.index');
    }

    public function destroyFolder(Request $request, VerseFolder $verseFolder): RedirectResponse
    {
        if ($request->boolean('delete_verses')) {
            $verseFolder->verses()->delete();
        }
        // nullOnDelete() on FK handles making verses folderless automatically
        $verseFolder->delete();
        return redirect()->route('console.index');
    }

    private function parseReference(string $reference): ?array
    {
        $ref = trim($reference);

        // Match: BookName Chapter:VerseStart[-VerseEnd]
        // e.g. "John 3:16", "Romans 8:28-30", "1 Corinthians 13:4-7"
        if (!preg_match('/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/i', $ref, $m)) {
            return null;
        }

        $bookKey = strtolower(trim($m[1]));
        $chapter = $m[2];
        $vStart  = $m[3];
        $vEnd    = $m[4] ?? null;

        $book = self::BOOKS[$bookKey] ?? null;
        if (!$book) return null;

        [$bookId, $testament] = $book;

        $passageId = $vEnd
            ? "{$bookId}.{$chapter}.{$vStart}-{$bookId}.{$chapter}.{$vEnd}"
            : "{$bookId}.{$chapter}.{$vStart}";

        $cleanRef = ucwords($m[1]) . ' ' . $chapter . ':' . $vStart . ($vEnd ? '-' . $vEnd : '');

        return compact('passageId', 'testament', 'cleanRef') + ['reference' => $cleanRef];
    }
}
