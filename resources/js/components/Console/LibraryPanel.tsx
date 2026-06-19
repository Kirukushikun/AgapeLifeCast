import { useState } from 'react';
import {
    Music, BookOpen, Film, Image, FileText, Presentation,
    FolderPlus, Upload, Plus, ChevronDown, SkipBack, SkipForward, Play,
} from 'lucide-react';

type Tab = 'songs' | 'bible' | 'media' | 'slides';

const SONGS_FOLDERS = [
    {
        name: 'Contemporary',
        items: [
            { title: '10,000 Reasons',         meta: 'Matt Redman · 5 slides' },
            { title: 'Goodness of God',         meta: 'Bethel Music · 5 slides' },
            { title: 'How Great Is Our God',    meta: 'Chris Tomlin · 5 slides' },
            { title: 'Oceans (Where Feet May Fail)', meta: 'Hillsong · 5 slides' },
            { title: 'What A Beautiful Name',   meta: 'Hillsong · 6 slides' },
        ],
    },
    {
        name: 'Hymns',
        items: [
            { title: 'Amazing Grace',          meta: 'Hymn · 6 slides', active: true },
            { title: 'Blessed Assurance',      meta: 'Hymn · 4 slides' },
            { title: 'Great Is Thy Faithfulness', meta: 'Hymn · 4 slides' },
        ],
    },
];

const BIBLE_ITEMS = [
    { title: 'Isaiah 40:31',      meta: 'KJV · Old Testament' },
    { title: 'Jeremiah 29:11',    meta: 'NIV · Old Testament' },
    { title: 'John 3:16',         meta: 'NIV · New Testament' },
    { title: 'Philippians 4:13',  meta: 'KJV · New Testament' },
    { title: 'Psalm 23',          meta: 'KJV · Old Testament' },
    { title: 'Romans 8:28',       meta: 'NIV · New Testament' },
];

const MEDIA_ITEMS = [
    { title: 'Announcement Slide',       meta: 'JPG · 1920×1080', type: 'image' as const },
    { title: 'Church Logo',              meta: 'PNG · 1920×1080', type: 'image' as const },
    { title: 'Easter Background',        meta: 'JPG · 3840×2160', type: 'image' as const },
    { title: 'Offering Background',      meta: 'MP4 · 3:20',      type: 'video' as const },
    { title: 'Welcome Video',            meta: 'MP4 · 1:42',      type: 'video' as const },
    { title: 'Worship Background Loop',  meta: 'MP4 · 5:00 · Looping', type: 'video' as const },
];

const SLIDES_ITEMS = [
    { title: 'Sermon Notes – June',        meta: 'PPTX · 12 slides', type: 'ppt' as const },
    { title: 'Sunday Announcements',       meta: 'PPTX · 8 slides',  type: 'ppt' as const },
    { title: 'Church Vision 2026',         meta: 'PDF · 5 slides',   type: 'pdf' as const },
    { title: 'Baptism Order of Service',   meta: 'PPTX · 4 slides',  type: 'ppt' as const },
    { title: 'Christmas Program',          meta: 'PPTX · 20 slides', type: 'ppt' as const },
];

const SEARCH_PLACEHOLDERS: Record<Tab, string> = {
    songs:  'Search songs…',
    bible:  'Search verses…',
    media:  'Search media…',
    slides: 'Search slides…',
};

export default function LibraryPanel() {
    const [activeTab, setActiveTab]       = useState<Tab>('songs');
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
    const [smpExpanded, setSmpExpanded]   = useState(false);

    const toggleFolder = (name: string) => {
        setCollapsedFolders(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    return (
        <aside className="lc-sidebar">

            {/* ── Tabs ── */}
            <div className="lc-sidebar-tabs">
                {(['songs', 'bible', 'media', 'slides'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Search ── */}
            <div className="lc-sidebar-search">
                <input type="text" placeholder={SEARCH_PLACEHOLDERS[activeTab]} />
            </div>

            {/* ── Songs ── */}
            {activeTab === 'songs' && (
                <div className="lc-library-list">
                    <div className="lc-library-list-header">
                        <button className="lc-list-action-btn">
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn">
                            <Plus size={11} /> New Song
                        </button>
                    </div>

                    {SONGS_FOLDERS.map(folder => (
                        <div
                            key={folder.name}
                            className={`lc-library-folder${collapsedFolders.has(folder.name) ? ' collapsed' : ''}`}
                        >
                            <div className="lc-folder-row" onClick={() => toggleFolder(folder.name)}>
                                <span className="lc-folder-chevron"><ChevronDown /></span>
                                <span>📁</span>
                                <span className="lc-folder-name">{folder.name}</span>
                                <span className="lc-folder-count">{folder.items.length}</span>
                            </div>
                            <div className="lc-folder-contents">
                                {folder.items.map(item => (
                                    <div key={item.title} className={`lc-library-item${item.active ? ' active' : ''}`}>
                                        <div className="lc-item-icon lc-icon-song"><Music /></div>
                                        <div className="lc-item-info">
                                            <div className="lc-item-title">{item.title}</div>
                                            <div className="lc-item-meta">{item.meta}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Bible ── */}
            {activeTab === 'bible' && (
                <div className="lc-library-list">
                    <div className="lc-library-list-header">
                        <button className="lc-list-action-btn">
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn">
                            <Plus size={11} /> Add Verse
                        </button>
                    </div>
                    {BIBLE_ITEMS.map(item => (
                        <div key={item.title} className="lc-library-item">
                            <div className="lc-item-icon lc-icon-bible"><BookOpen /></div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{item.title}</div>
                                <div className="lc-item-meta">{item.meta}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Media ── */}
            {activeTab === 'media' && (
                <div className="lc-library-list">
                    <div className="lc-library-list-header">
                        <button className="lc-list-action-btn">
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn">
                            <Upload size={11} /> Import
                        </button>
                    </div>
                    {MEDIA_ITEMS.map(item => (
                        <div key={item.title} className="lc-library-item">
                            <div className={`lc-item-icon ${item.type === 'video' ? 'lc-icon-video' : 'lc-icon-image'}`}>
                                {item.type === 'video' ? <Film /> : <Image />}
                            </div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{item.title}</div>
                                <div className="lc-item-meta">{item.meta}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Slides ── */}
            {activeTab === 'slides' && (
                <div className="lc-library-list">
                    <div className="lc-library-list-header">
                        <button className="lc-list-action-btn">
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn">
                            <Upload size={11} /> Import
                        </button>
                    </div>
                    {SLIDES_ITEMS.map(item => (
                        <div key={item.title} className="lc-library-item">
                            <div className={`lc-item-icon ${item.type === 'pdf' ? 'lc-icon-pdf' : 'lc-icon-ppt'}`}>
                                {item.type === 'pdf' ? <FileText /> : <Presentation />}
                            </div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{item.title}</div>
                                <div className="lc-item-meta">{item.meta}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Sidebar Media Player ── */}
            <div className={`lc-smp${smpExpanded ? ' expanded' : ''}`}>
                <div className="lc-smp-handle" onClick={() => setSmpExpanded(e => !e)}>
                    <span className="lc-smp-handle-label">Media Player</span>
                    <span className="lc-smp-chevron"><ChevronDown /></span>
                </div>
                <div className="lc-smp-body">
                    <div className="lc-smp-screen">
                        <div className="lc-smp-placeholder">
                            <Film />
                            <span>No media loaded</span>
                        </div>
                    </div>
                    <div className="lc-smp-controls">
                        <button className="lc-smp-btn"><SkipBack /></button>
                        <button className="lc-smp-btn"><Play /></button>
                        <button className="lc-smp-btn"><SkipForward /></button>
                        <div className="lc-smp-spacer" />
                        <button className="lc-smp-send-btn">Send Live</button>
                    </div>
                </div>
            </div>

        </aside>
    );
}
