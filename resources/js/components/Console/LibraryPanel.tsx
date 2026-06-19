import { useState } from 'react';
import {
    Music, BookOpen, Film, Image, Headphones, FileText, Presentation,
    FolderPlus, Upload, Plus, ChevronDown, SkipBack, SkipForward, Play,
} from 'lucide-react';
import type { SongFolder, SavedVerse, MediaFile, SlideDeck } from '@/pages/Console/Index';

type Tab = 'songs' | 'bible' | 'media' | 'slides';




const SEARCH_PLACEHOLDERS: Record<Tab, string> = {
    songs:  'Search songs…',
    bible:  'Search verses…',
    media:  'Search media…',
    slides: 'Search slides…',
};

function formatMediaMeta(item: MediaFile): string {
    const ext = item.extension.toUpperCase();
    if (item.type === 'image' && item.width && item.height) {
        return `${ext} · ${item.width}×${item.height}`;
    }
    if ((item.type === 'video' || item.type === 'audio') && item.duration_seconds) {
        const m = Math.floor(item.duration_seconds / 60);
        const s = String(item.duration_seconds % 60).padStart(2, '0');
        const loop = item.is_looping ? ' · Looping' : '';
        return `${ext} · ${m}:${s}${loop}`;
    }
    return ext;
}

export default function LibraryPanel({ songFolders, savedVerses, mediaFiles, slideDecks }: { songFolders: SongFolder[]; savedVerses: SavedVerse[]; mediaFiles: MediaFile[]; slideDecks: SlideDeck[] }) {
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

                    {songFolders.map(folder => (
                        <div
                            key={folder.id}
                            className={`lc-library-folder${collapsedFolders.has(folder.name) ? ' collapsed' : ''}`}
                        >
                            <div className="lc-folder-row" onClick={() => toggleFolder(folder.name)}>
                                <span className="lc-folder-chevron"><ChevronDown /></span>
                                <span>📁</span>
                                <span className="lc-folder-name">{folder.name}</span>
                                <span className="lc-folder-count">{folder.songs.length}</span>
                            </div>
                            <div className="lc-folder-contents">
                                {folder.songs.map(song => (
                                    <div key={song.id} className="lc-library-item">
                                        <div className="lc-item-icon lc-icon-song"><Music /></div>
                                        <div className="lc-item-info">
                                            <div className="lc-item-title">{song.title}</div>
                                            <div className="lc-item-meta">
                                                {song.author ?? 'Unknown'} · {song.slide_count} slides
                                            </div>
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
                    {savedVerses.map(verse => (
                        <div key={verse.id} className="lc-library-item">
                            <div className="lc-item-icon lc-icon-bible"><BookOpen /></div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{verse.reference}</div>
                                <div className="lc-item-meta">
                                    {verse.translation} · {verse.testament === 'old' ? 'Old Testament' : 'New Testament'}
                                </div>
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
                    {mediaFiles.map(item => (
                        <div key={item.id} className="lc-library-item">
                            <div className={`lc-item-icon ${
                                item.type === 'video' ? 'lc-icon-video' :
                                item.type === 'audio' ? 'lc-icon-audio' :
                                'lc-icon-image'
                            }`}>
                                {item.type === 'video' ? <Film /> :
                                 item.type === 'audio' ? <Headphones /> :
                                 <Image />}
                            </div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{item.title}</div>
                                <div className="lc-item-meta">{formatMediaMeta(item)}</div>
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
                    {slideDecks.map(deck => (
                        <div key={deck.id} className="lc-library-item">
                            <div className={`lc-item-icon ${deck.extension === 'pdf' ? 'lc-icon-pdf' : 'lc-icon-ppt'}`}>
                                {deck.extension === 'pdf' ? <FileText /> : <Presentation />}
                            </div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{deck.title}</div>
                                <div className="lc-item-meta">
                                    {deck.extension.toUpperCase()} · {deck.slide_count} slides
                                </div>
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
