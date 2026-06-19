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

interface Props {
    songFolders: SongFolder[];
    savedVerses: SavedVerse[];
    mediaFiles: MediaFile[];
    slideDecks: SlideDeck[];
}

export default function Index({ songFolders, savedVerses, mediaFiles, slideDecks }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Topbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LibraryPanel songFolders={songFolders} savedVerses={savedVerses} mediaFiles={mediaFiles} slideDecks={slideDecks} />
                <PreviewArea />
                <PropertiesPanel />
            </div>
        </div>
    );
}
