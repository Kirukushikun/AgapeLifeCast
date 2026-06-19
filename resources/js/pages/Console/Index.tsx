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
}

export interface MediaFile {
    id: number;
    title: string;
    type: 'image' | 'video' | 'audio';
    extension: string;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    is_looping: boolean;
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

interface Props {
    songFolders: SongFolder[];
    savedVerses: SavedVerse[];
    mediaFiles: MediaFile[];
    slideDecks: SlideDeck[];
    schedule: ScheduleData | null;
    themes: ThemeData[];
}

export default function Index({ songFolders, savedVerses, mediaFiles, slideDecks, schedule, themes }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Topbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LibraryPanel songFolders={songFolders} savedVerses={savedVerses} mediaFiles={mediaFiles} slideDecks={slideDecks} />
                <PreviewArea />
                <PropertiesPanel schedule={schedule} themes={themes} />
            </div>
        </div>
    );
}
