import { useState } from 'react';
import { router } from '@inertiajs/react';
import Topbar from '@/components/Console/Topbar';
import LibraryPanel from '@/components/Console/LibraryPanel';
import PreviewArea from '@/components/Console/PreviewArea';
import PropertiesPanel from '@/components/Console/PropertiesPanel';

export interface SongItem {
    id: number;
    title: string;
    author: string | null;
    slide_count: number;
}

export interface SongFolder {
    id: number;
    name: string;
    songs: SongItem[];
}

export interface SavedVerse {
    id: number;
    reference: string;
    translation: string;
    testament: 'old' | 'new';
    content: string;
}

export interface VerseFolder {
    id: number;
    name: string;
    verses: SavedVerse[];
}

export interface MediaFile {
    id: number;
    folder_id: number | null;
    title: string;
    type: 'image' | 'video' | 'audio';
    extension: string;
    mime_type: string | null;
    file_size: number;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    is_looping: boolean;
    url: string;
}

export interface MediaFolder {
    id: number;
    name: string;
    files: MediaFile[];
}

export interface DeckSlide {
    id: number;
    sort_order: number;
    url: string;
}

export interface SlideDeck {
    id: number;
    folder_id: number | null;
    title: string;
    extension: string;
    slide_count: number;
    status: 'processing' | 'ready' | 'failed';
    slides: DeckSlide[];
}

export interface SlideDeckFolder {
    id: number;
    name: string;
    decks: SlideDeck[];
}

export interface ScheduleItem {
    id: number;
    schedulable_id: number;
    type: string;
    name: string;
    icon: string;
}

export interface ScheduleData {
    id: number;
    name: string;
    items: ScheduleItem[];
}

export interface ThemeData {
    id: number;
    name: string;
    css_bg: string;
    text_color: string;
    is_system: boolean;
    is_blank_screen: boolean;
}

export interface SlideData {
    id: number;
    label: string | null;
    content: string;
}

export interface SelectedSong {
    id: number;
    title: string;
    author: string | null;
    folder_id: number | null;
    theme_id: number | null;
    slides: SlideData[];
    theme: { css_bg: string; text_color: string } | null;
}

interface Props {
    songFolders: SongFolder[];
    uncategorizedSongs: SongItem[];
    verseFolders: VerseFolder[];
    savedVerses: SavedVerse[];
    mediaFolders: MediaFolder[];
    uncategorizedMedia: MediaFile[];
    slideDeckFolders: SlideDeckFolder[];
    uncategorizedDecks: SlideDeck[];
    schedule: ScheduleData | null;
    themes: ThemeData[];
    selectedSong: SelectedSong | null;
}

export default function Index({ songFolders, uncategorizedSongs, verseFolders, savedVerses, mediaFolders, uncategorizedMedia, slideDeckFolders, uncategorizedDecks, schedule, themes, selectedSong }: Props) {
    const [selectedVerse, setSelectedVerse]       = useState<SavedVerse | null>(null);
    const [selectedDeck, setSelectedDeck]         = useState<SlideDeck | null>(null);
    const [volume, setVolume]                     = useState(0.8);
    const [hasActiveAudio, setHasActiveAudio]     = useState(false);
    const [liveMedia, setLiveMedia]       = useState<MediaFile | null>(null);
    const [liveMediaKey, setLiveMediaKey] = useState(0);
    const [scheduleMedia, setScheduleMedia] = useState<{ file: MediaFile; n: number } | null>(null);

    const handleMediaLive = (file: MediaFile | null) => {
        setLiveMedia(file);
        if (file) setLiveMediaKey(k => k + 1);
    };

    const handleVerseSelect = (verse: SavedVerse) => { setSelectedVerse(verse); setSelectedDeck(null); };
    const handleSongSelect  = () => { setSelectedVerse(null); setSelectedDeck(null); };
    const handleDeckSelect  = (deck: SlideDeck | null) => { setSelectedDeck(deck); setSelectedVerse(null); };

    const handleScheduleItemClick = (type: string, schedulableId: number) => {
        if (type === 'Song') {
            router.get('/console', { song: schedulableId });
        } else if (type === 'SavedVerse') {
            const verse = [...savedVerses, ...verseFolders.flatMap(f => f.verses)].find(v => v.id === schedulableId);
            if (verse) handleVerseSelect(verse);
        } else if (type === 'SlideDeck') {
            const deck = [...uncategorizedDecks, ...slideDeckFolders.flatMap(f => f.decks)].find(d => d.id === schedulableId);
            if (deck) handleDeckSelect(deck);
        } else if (type === 'MediaFile') {
            const file = [...uncategorizedMedia, ...mediaFolders.flatMap(f => f.files)].find(m => m.id === schedulableId);
            if (!file) return;
            if (file.type === 'video') {
                window.open(file.url, '_blank', 'noopener,noreferrer');
            } else {
                setScheduleMedia(prev => ({ file, n: (prev?.n ?? 0) + 1 }));
            }
        }
    };

    const blankTheme = themes.find(t => t.is_blank_screen) ?? null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Topbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LibraryPanel
                    songFolders={songFolders}
                    uncategorizedSongs={uncategorizedSongs}
                    verseFolders={verseFolders}
                    savedVerses={savedVerses}
                    mediaFolders={mediaFolders}
                    uncategorizedMedia={uncategorizedMedia}
                    slideDeckFolders={slideDeckFolders}
                    uncategorizedDecks={uncategorizedDecks}
                    activeSongId={selectedSong?.id ?? null}
                    activeVerseId={selectedVerse?.id ?? null}
                    activeDeckId={selectedDeck?.id ?? null}
                    selectedSong={selectedSong}
                    onVerseSelect={handleVerseSelect}
                    onSongSelect={handleSongSelect}
                    onDeckSelect={handleDeckSelect}
                    volume={volume}
                    onHasAudioChange={setHasActiveAudio}
                    onMediaLive={handleMediaLive}
                    liveMedia={liveMedia}
                    scheduleMedia={scheduleMedia}
                />
                <PreviewArea
                    selectedSong={selectedSong}
                    selectedVerse={selectedVerse}
                    selectedDeck={selectedDeck}
                    volume={volume}
                    onVolumeChange={setVolume}
                    hasActiveAudio={hasActiveAudio}
                    liveMedia={liveMedia}
                    liveMediaKey={liveMediaKey}
                    onMediaLive={handleMediaLive}
                    blankTheme={blankTheme}
                />
                <PropertiesPanel
                    schedule={schedule}
                    themes={themes}
                    selectedSong={selectedSong}
                    selectedVerse={selectedVerse}
                    selectedDeck={selectedDeck}
                    songFolders={songFolders}
                    uncategorizedSongs={uncategorizedSongs}
                    verseFolders={verseFolders}
                    savedVerses={savedVerses}
                    mediaFolders={mediaFolders}
                    uncategorizedMedia={uncategorizedMedia}
                    slideDeckFolders={slideDeckFolders}
                    uncategorizedDecks={uncategorizedDecks}
                    onScheduleItemClick={handleScheduleItemClick}
                />
            </div>
        </div>
    );
}
