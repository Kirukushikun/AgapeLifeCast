<?php

namespace App\Jobs;

use App\Models\SlideDeck;
use App\Models\SlideDeckSlide;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class ProcessSlideDeck implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(private int $slideDeckId) {}

    public function handle(): void
    {
        $deck = SlideDeck::findOrFail($this->slideDeckId);

        try {
            $inputPath  = Storage::disk('public')->path($deck->disk_path);
            $outputDir  = "slide_decks/{$deck->id}/slides";
            $outputFull = Storage::disk('public')->path($outputDir);

            Storage::disk('public')->makeDirectory($outputDir);

            $gs = config('services.ghostscript.path');
            $outputPattern = $outputFull . DIRECTORY_SEPARATOR . 'slide_%03d.png';

            $process = new Process([
                $gs,
                '-dNOPAUSE', '-dBATCH', '-dSAFER',
                '-sDEVICE=png16m',
                '-r150',
                '-dTextAlphaBits=4',
                '-dGraphicsAlphaBits=4',
                "-sOutputFile={$outputPattern}",
                $inputPath,
            ]);
            $process->setTimeout(240);
            $process->run();

            if (! $process->isSuccessful()) {
                throw new \RuntimeException($process->getErrorOutput());
            }

            // Collect generated PNGs in order
            $files = glob($outputFull . DIRECTORY_SEPARATOR . 'slide_*.png');
            natsort($files);
            $files = array_values($files);

            $deck->slides()->delete();

            foreach ($files as $i => $filePath) {
                $relativePath = $outputDir . '/' . basename($filePath);
                SlideDeckSlide::create([
                    'slide_deck_id' => $deck->id,
                    'sort_order'    => $i + 1,
                    'disk_path'     => $relativePath,
                ]);
            }

            $deck->update([
                'slide_count' => count($files),
                'status'      => 'ready',
            ]);
        } catch (\Throwable $e) {
            $deck->update(['status' => 'failed']);
            throw $e;
        }
    }
}
