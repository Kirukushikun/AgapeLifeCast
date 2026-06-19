<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\ScheduleItem;
use App\Models\Song;
use App\Models\SongFolder;
use App\Models\SongSlide;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ── Admin user ──────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@lcmi.org'],
            ['name' => 'Admin', 'password' => bcrypt('password')],
        );

        // ── System themes ────────────────────────────────────────
        $darkForest = Theme::create([
            'name'              => 'Dark Forest',
            'bg_type'           => 'gradient',
            'bg_gradient_from'  => '#0d2200',
            'bg_gradient_to'    => '#1e4700',
            'bg_gradient_angle' => 135,
            'text_color'        => '#ffffff',
            'is_system'         => true,
        ]);

        $midnight = Theme::create([
            'name'      => 'Midnight',
            'bg_type'   => 'solid',
            'bg_color'  => '#1a1a2e',
            'text_color'=> '#ffffff',
            'is_system' => true,
        ]);

        $pureBlack = Theme::create([
            'name'      => 'Pure Black',
            'bg_type'   => 'solid',
            'bg_color'  => '#000000',
            'text_color'=> '#ffffff',
            'is_system' => true,
        ]);

        Theme::create([
            'name'              => 'Deep Blue',
            'bg_type'           => 'gradient',
            'bg_gradient_from'  => '#0d1b47',
            'bg_gradient_to'    => '#1a3a8f',
            'bg_gradient_angle' => 135,
            'text_color'        => '#ffffff',
            'is_system'         => true,
        ]);

        // ── Song folders ─────────────────────────────────────────
        $contemporary = SongFolder::create(['name' => 'Contemporary', 'sort_order' => 0]);
        $hymns        = SongFolder::create(['name' => 'Hymns',        'sort_order' => 1]);

        // ── Contemporary songs ───────────────────────────────────
        $this->song($contemporary, $midnight, '10,000 Reasons',          'Matt Redman', [
            ['Verse 1',      "The sun comes up\nIt's a new day dawning\nIt's time to sing\nYour song again"],
            ['Chorus',       "Bless the Lord oh my soul\nOh my soul\nWorship His holy name\nSing like never before\nOh my soul\nI'll worship Your holy name"],
            ['Verse 2',      "You're rich in love\nAnd You're slow to anger\nYour name is great\nAnd Your heart is kind"],
            ['Chorus',       "Bless the Lord oh my soul\nOh my soul\nWorship His holy name\nSing like never before\nOh my soul\nI'll worship Your holy name"],
            ['Verse 3',      "And on that day\nWhen my strength is failing\nThe end draws near\nAnd my time has come"],
        ]);

        $this->song($contemporary, $darkForest, 'Goodness of God', 'Bethel Music', [
            ['Verse 1',  "I love You Lord\nFor Your mercy never fails me\nAll my days\nI've been held in Your hands"],
            ['Chorus',   "All my life You have been faithful\nAll my life You have been so, so good\nWith every breath that I am able\nI will sing of the goodness of God"],
            ['Bridge',   "Your goodness is running after\nIt's running after me\nWith my life laid down\nI'm surrendered now\nI give You everything"],
        ]);

        $this->song($contemporary, $pureBlack, 'How Great Is Our God', 'Chris Tomlin', [
            ['Verse 1',  "The splendor of the King\nClothed in majesty\nLet all the earth rejoice\nAll the earth rejoice"],
            ['Chorus',   "How great is our God\nSing with me\nHow great is our God\nAnd all will see\nHow great, how great is our God"],
            ['Verse 2',  "Age to age He stands\nAnd time is in His hands\nBeginning and the End\nBeginning and the End"],
            ['Bridge',   "Name above all names\nWorthy of all praise\nMy heart will sing\nHow great is our God"],
        ]);

        $this->song($contemporary, $midnight, 'Oceans (Where Feet May Fail)', 'Hillsong', [
            ['Verse 1',  "You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep my faith will stand"],
            ['Chorus',   "And I will call upon Your name\nAnd keep my eyes above the waves\nWhen oceans rise my soul will rest in Your embrace\nFor I am Yours and You are mine"],
            ['Bridge',   "Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me\nTake me deeper than my feet could ever wander"],
        ]);

        $this->song($contemporary, $darkForest, 'What A Beautiful Name', 'Hillsong', [
            ['Verse 1',  "You were the Word at the beginning\nOne with God the Lord Most High\nYour hidden glory in creation\nNow revealed in You our Christ"],
            ['Chorus',   "What a beautiful name it is\nWhat a beautiful name it is\nThe name of Jesus Christ my King\nWhat a beautiful name it is\nNothing compares to this\nWhat a beautiful name it is\nThe name of Jesus"],
            ['Bridge',   "Death could not hold You\nThe veil tore before You\nYou silenced the boast of sin and grave\nThe heavens are roaring\nThe praise of Your glory\nFor You are raised to life again"],
        ]);

        // ── Hymns ────────────────────────────────────────────────
        $this->song($hymns, $darkForest, 'Amazing Grace', 'John Newton', [
            ['Verse 1',      "Amazing Grace,\nhow sweet the sound"],
            ['Verse 1 cont.', "That saved a\nwretch like me"],
            ['Verse 2',      "I once was lost,\nbut now am found"],
            ['Verse 2 cont.', "Was blind,\nbut now I see"],
            ['Verse 3',      "'Twas grace that\ntaught my heart to fear"],
            ['Verse 3 cont.', "And grace my\nfears relieved"],
        ]);

        $this->song($hymns, $midnight, 'Blessed Assurance', 'Fanny Crosby', [
            ['Verse 1',  "Blessed assurance\nJesus is mine\nO what a foretaste\nOf glory divine"],
            ['Chorus',   "This is my story\nThis is my song\nPraising my Savior\nAll the day long"],
            ['Verse 2',  "Perfect submission\nPerfect delight\nVisions of rapture\nNow burst on my sight"],
        ]);

        $this->song($hymns, $pureBlack, 'Great Is Thy Faithfulness', 'Thomas Chisholm', [
            ['Verse 1',  "Great is Thy faithfulness\nO God my Father\nThere is no shadow of turning with Thee"],
            ['Chorus',   "Great is Thy faithfulness\nGreat is Thy faithfulness\nMorning by morning\nNew mercies I see"],
            ['Verse 2',  "Summer and winter\nAnd springtime and harvest\nSun moon and stars\nIn their courses above"],
        ]);

        // ── Default schedule ─────────────────────────────────────
        $schedule = Schedule::create([
            'name'         => 'Sunday Service',
            'service_date' => now()->next('Sunday'),
        ]);

        $amazingGrace = Song::where('title', 'Amazing Grace')->first();
        $howGreat     = Song::where('title', 'How Great Is Our God')->first();

        ScheduleItem::create([
            'schedule_id'      => $schedule->id,
            'sort_order'       => 0,
            'schedulable_type' => Song::class,
            'schedulable_id'   => $amazingGrace->id,
        ]);

        ScheduleItem::create([
            'schedule_id'      => $schedule->id,
            'sort_order'       => 1,
            'schedulable_type' => Song::class,
            'schedulable_id'   => $howGreat->id,
        ]);
    }

    private function song(SongFolder $folder, Theme $theme, string $title, string $author, array $slides): Song
    {
        $song = Song::create([
            'folder_id' => $folder->id,
            'theme_id'  => $theme->id,
            'title'     => $title,
            'author'    => $author,
        ]);

        foreach ($slides as $i => [$label, $content]) {
            SongSlide::create([
                'song_id'    => $song->id,
                'sort_order' => $i,
                'label'      => $label,
                'content'    => $content,
            ]);
        }

        return $song;
    }
}
