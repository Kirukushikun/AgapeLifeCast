import { useState } from 'react';
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

export interface SlideDeck {
    id: number;
    title: string;
    extension: string;
    slide_count: number;
}

export interface ScheduleItem {
    id: number;
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
    slideDecks: SlideDeck[];
    schedule: ScheduleData | null;
    themes: ThemeData[];
    selectedSong: SelectedSong | null;
}

export default function Index({ songFolders, uncategorizedSongs, verseFolders, savedVerses, mediaFolders, uncategorizedMedia, slideDecks, schedule, themes, selectedSong }: Props) {
    const [selectedVerse, setSelectedVerse] = useState<SavedVerse | null>(null);

    const handleVerseSelect = (verse: SavedVerse) => setSelectedVerse(verse);
    const handleSongSelect  = () => setSelectedVerse(null);

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
                    slideDecks={slideDecks}
                    activeSongId={selectedSong?.id ?? null}
                    activeVerseId={selectedVerse?.id ?? null}
                    selectedSong={selectedSong}
                    onVerseSelect={handleVerseSelect}
                    onSongSelect={handleSongSelect}
                />
                <PreviewArea selectedSong={selectedSong} selectedVerse={selectedVerse} />
                <PropertiesPanel schedule={schedule} themes={themes} />
            </div>
        </div>
    );
}
