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

interface Props {
    songFolders: SongFolder[];
}

export default function Index({ songFolders }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Topbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LibraryPanel songFolders={songFolders} />
                <PreviewArea />
                <PropertiesPanel />
            </div>
        </div>
    );
}
