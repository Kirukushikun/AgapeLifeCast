import Topbar from '@/components/Console/Topbar';
import LibraryPanel from '@/components/Console/LibraryPanel';
import PreviewArea from '@/components/Console/PreviewArea';
import PropertiesPanel from '@/components/Console/PropertiesPanel';

export default function Index() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Topbar />
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LibraryPanel />
                <PreviewArea />
                <PropertiesPanel />
            </div>
        </div>
    );
}
