<?php

namespace Database\Seeders;

use App\Models\SavedVerse;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SavedVerseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $verses = [
            [
                'reference'   => 'Isaiah 40:31',
                'translation' => 'KJV',
                'testament'   => 'old',
                'content'     => 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
            ],
            [
                'reference'   => 'Jeremiah 29:11',
                'translation' => 'NIV',
                'testament'   => 'old',
                'content'     => 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.',
            ],
            [
                'reference'   => 'John 3:16',
                'translation' => 'NIV',
                'testament'   => 'new',
                'content'     => 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
            ],
            [
                'reference'   => 'Philippians 4:13',
                'translation' => 'KJV',
                'testament'   => 'new',
                'content'     => 'I can do all things through Christ which strengtheneth me.',
            ],
            [
                'reference'   => 'Psalm 23:1',
                'translation' => 'KJV',
                'testament'   => 'old',
                'content'     => 'The LORD is my shepherd; I shall not want.',
            ],
            [
                'reference'   => 'Romans 8:28',
                'translation' => 'NIV',
                'testament'   => 'new',
                'content'     => 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
            ],
        ];

        foreach ($verses as $verse) {
            SavedVerse::firstOrCreate(['reference' => $verse['reference'], 'translation' => $verse['translation']], $verse);
        }
    }
}
