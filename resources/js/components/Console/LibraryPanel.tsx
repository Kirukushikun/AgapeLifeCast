import { useState, useEffect } from 'react';
import {
    Music, BookOpen, Film, Image, Headphones, FileText, Presentation,
    FolderPlus, Upload, Plus, ChevronDown, SkipBack, SkipForward, Play,
    Pencil, Trash2,
} from 'lucide-react';
import { router, useForm } from '@inertiajs/react';
import SongModal from '@/components/Console/Songs/SongModal';
import SongContextMenu from '@/components/Console/Songs/SongContextMenu';
import FolderDeleteModal from '@/components/Console/Songs/SongFolderDeleteModal';
import SongDeleteModal from '@/components/Console/Songs/SongDeleteModal';
import BibleModal from '@/components/Console/Bible/BibleModal';
import VerseFolderDeleteModal from '@/components/Console/Bible/VerseFolderDeleteModal';
import VerseDeleteModal from '@/components/Console/Bible/VerseDeleteModal';
import VerseContextMenu from '@/components/Console/Bible/VerseContextMenu';
import type { EditSongData } from '@/components/Console/Songs/SongModal';
import type { SongFolder, VerseFolder, SavedVerse, MediaFile, SlideDeck, SongItem, SelectedSong } from '@/pages/Console/Index';

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

export default function LibraryPanel({ songFolders, uncategorizedSongs, verseFolders, savedVerses, mediaFiles, slideDecks, activeSongId, activeVerseId, selectedSong, onVerseSelect, onSongSelect }: { songFolders: SongFolder[]; uncategorizedSongs: SongItem[]; verseFolders: VerseFolder[]; savedVerses: SavedVerse[]; mediaFiles: MediaFile[]; slideDecks: SlideDeck[]; activeSongId: number | null; activeVerseId: number | null; selectedSong: SelectedSong | null; onVerseSelect: (verse: SavedVerse) => void; onSongSelect: () => void }) {

    const selectSong = (id: number) => {
        onSongSelect();
        router.get('/console', { song: id }, { preserveState: true, preserveScroll: true, only: ['selectedSong'] });
    };

    // ── Song state ──
    const [folderModal, setFolderModal]       = useState<{ mode: 'create' } | { mode: 'rename'; id: number } | null>(null);
    const [folderToDelete, setFolderToDelete] = useState<SongFolder | null>(null);
    const [songToDelete, setSongToDelete]     = useState<SongItem | null>(null);
    const [songModal, setSongModal]           = useState(false);
    const [editSong, setEditSong]             = useState<EditSongData | null>(null);
    const [pendingEdit, setPendingEdit]       = useState<number | null>(null);
    const [ctx, setCtx]                       = useState<{ x: number; y: number; song: SongItem; folderId: number } | null>(null);
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
    const folderForm = useForm({ name: '' });

    // ── Bible state ──
    const [bibleModal, setBibleModal]               = useState(false);
    const [verseFolderModal, setVerseFolderModal]   = useState<{ mode: 'create' } | { mode: 'rename'; id: number } | null>(null);
    const [verseFolderToDelete, setVerseFolderToDelete] = useState<VerseFolder | null>(null);
    const [verseToDelete, setVerseToDelete]         = useState<SavedVerse | null>(null);
    const [verseCtx, setVerseCtx]                   = useState<{ x: number; y: number; verse: SavedVerse; folderId: number | null } | null>(null);
    const [collapsedVerseFolders, setCollapsedVerseFolders] = useState<Set<number>>(new Set());
    const verseFolderForm = useForm({ name: '' });

    // ── Layout state ──
    const [activeTab, setActiveTab]   = useState<Tab>('songs');
    const [smpExpanded, setSmpExpanded] = useState(false);

    // ── Song handlers ──
    useEffect(() => {
        if (pendingEdit !== null && selectedSong?.id === pendingEdit) {
            setEditSong({
                id:       selectedSong.id,
                title:    selectedSong.title,
                author:   selectedSong.author,
                folderId: selectedSong.folder_id,
                slides:   selectedSong.slides,
            });
            setSongModal(true);
            setPendingEdit(null);
        }
    }, [selectedSong, pendingEdit]);

    const handleEditSong = (song: SongItem) => {
        if (selectedSong?.id === song.id) {
            setEditSong({
                id:       selectedSong.id,
                title:    selectedSong.title,
                author:   selectedSong.author,
                folderId: selectedSong.folder_id,
                slides:   selectedSong.slides,
            });
            setSongModal(true);
        } else {
            setPendingEdit(song.id);
            selectSong(song.id);
        }
    };

    const handleSongRightClick = (e: React.MouseEvent, song: SongItem, folderId: number) => {
        e.preventDefault();
        setCtx({ x: e.clientX, y: e.clientY, song, folderId });
    };

    const toggleFolder = (name: string) =>
        setCollapsedFolders(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    const openFolderModal = () => { folderForm.reset(); setFolderModal({ mode: 'create' }); };
    const openRenameFolder = (folder: SongFolder) => { folderForm.setData('name', folder.name); setFolderModal({ mode: 'rename', id: folder.id }); };
    const deleteFolder = (folder: SongFolder) => setFolderToDelete(folder);

    const submitFolder = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!folderModal) return;
        if (folderModal.mode === 'create') {
            folderForm.post('/console/folders', { onSuccess: () => setFolderModal(null) });
        } else {
            folderForm.patch(`/console/folders/${folderModal.id}`, { onSuccess: () => setFolderModal(null) });
        }
    };

    // ── Bible handlers ──
    const toggleVerseFolder = (id: number) =>
        setCollapsedVerseFolders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const openVerseFolderModal = () => { verseFolderForm.reset(); setVerseFolderModal({ mode: 'create' }); };
    const openRenameVerseFolder = (folder: VerseFolder) => { verseFolderForm.setData('name', folder.name); setVerseFolderModal({ mode: 'rename', id: folder.id }); };

    const submitVerseFolderModal = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!verseFolderModal) return;
        if (verseFolderModal.mode === 'create') {
            verseFolderForm.post('/console/verse-folders', { onSuccess: () => setVerseFolderModal(null) });
        } else {
            verseFolderForm.patch(`/console/verse-folders/${verseFolderModal.id}`, { onSuccess: () => setVerseFolderModal(null) });
        }
    };

    const handleVerseRightClick = (e: React.MouseEvent, verse: SavedVerse, folderId: number | null) => {
        e.preventDefault();
        setVerseCtx({ x: e.clientX, y: e.clientY, verse, folderId });
    };

    return (
        <>
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
                        <button className="lc-list-action-btn" onClick={openFolderModal}>
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn" onClick={() => setSongModal(true)}>
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
                                <div className="lc-folder-actions" onClick={e => e.stopPropagation()}>
                                    <button className="lc-folder-btn" title="Rename folder" onClick={() => openRenameFolder(folder)}>
                                        <Pencil size={11} />
                                    </button>
                                    <button className="lc-folder-btn danger" title="Delete folder" onClick={() => deleteFolder(folder)}>
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                            <div className="lc-folder-contents">
                                {folder.songs.map(song => (
                                    <div
                                        key={song.id}
                                        className={`lc-library-item${activeSongId === song.id ? ' active' : ''}`}
                                        onClick={() => selectSong(song.id)}
                                        onContextMenu={e => handleSongRightClick(e, song, folder.id)}
                                    >
                                        <div className="lc-item-icon lc-icon-song"><Music /></div>
                                        <div className="lc-item-info">
                                            <div className="lc-item-title">{song.title}</div>
                                            <div className="lc-item-meta">{song.author ?? 'Unknown'} · {song.slide_count} slides</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {uncategorizedSongs.map(song => (
                        <div
                            key={song.id}
                            className={`lc-library-item lc-item-root${activeSongId === song.id ? ' active' : ''}`}
                            onClick={() => selectSong(song.id)}
                            onContextMenu={e => handleSongRightClick(e, song, 0)}
                        >
                            <div className="lc-item-icon lc-icon-song"><Music /></div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{song.title}</div>
                                <div className="lc-item-meta">{song.author ?? 'Unknown'} · {song.slide_count} slides</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Bible ── */}
            {activeTab === 'bible' && (
                <div className="lc-library-list">
                    <div className="lc-library-list-header">
                        <button className="lc-list-action-btn" onClick={openVerseFolderModal}>
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn" onClick={() => setBibleModal(true)}>
                            <Plus size={11} /> Add Verse
                        </button>
                    </div>

                    {verseFolders.map(folder => (
                        <div
                            key={folder.id}
                            className={`lc-library-folder${collapsedVerseFolders.has(folder.id) ? ' collapsed' : ''}`}
                        >
                            <div className="lc-folder-row" onClick={() => toggleVerseFolder(folder.id)}>
                                <span className="lc-folder-chevron"><ChevronDown /></span>
                                <span>📁</span>
                                <span className="lc-folder-name">{folder.name}</span>
                                <div className="lc-folder-actions" onClick={e => e.stopPropagation()}>
                                    <button className="lc-folder-btn" title="Rename folder" onClick={() => openRenameVerseFolder(folder)}>
                                        <Pencil size={11} />
                                    </button>
                                    <button className="lc-folder-btn danger" title="Delete folder" onClick={() => setVerseFolderToDelete(folder)}>
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                            <div className="lc-folder-contents">
                                {folder.verses.map(verse => (
                                    <div
                                        key={verse.id}
                                        className={`lc-library-item${activeVerseId === verse.id ? ' active' : ''}`}
                                        onClick={() => onVerseSelect(verse)}
                                        onContextMenu={e => handleVerseRightClick(e, verse, folder.id)}
                                    >
                                        <div className="lc-item-icon lc-icon-bible"><BookOpen /></div>
                                        <div className="lc-item-info">
                                            <div className="lc-item-title">{verse.reference}</div>
                                            <div className="lc-item-meta">{verse.translation} · {verse.testament === 'old' ? 'OT' : 'NT'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {savedVerses.length === 0 && verseFolders.length === 0 && (
                        <div className="lc-library-empty">No saved verses yet.</div>
                    )}
                    {savedVerses.map(verse => (
                        <div
                            key={verse.id}
                            className={`lc-library-item lc-item-root${activeVerseId === verse.id ? ' active' : ''}`}
                            onClick={() => onVerseSelect(verse)}
                            onContextMenu={e => handleVerseRightClick(e, verse, null)}
                        >
                            <div className="lc-item-icon lc-icon-bible"><BookOpen /></div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{verse.reference}</div>
                                <div className="lc-item-meta">{verse.translation} · {verse.testament === 'old' ? 'OT' : 'NT'}</div>
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
                                <div className="lc-item-meta">{deck.extension.toUpperCase()} · {deck.slide_count} slides</div>
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

        {/* ── Song Context Menu ── */}
        {ctx && (
            <SongContextMenu
                x={ctx.x}
                y={ctx.y}
                song={ctx.song}
                currentFolderId={ctx.folderId}
                songFolders={songFolders}
                onClose={() => setCtx(null)}
                onEdit={song => { setCtx(null); handleEditSong(song); }}
                onDelete={song => { setCtx(null); setSongToDelete(song); }}
            />
        )}

        {/* ── Verse Context Menu ── */}
        {verseCtx && (
            <VerseContextMenu
                x={verseCtx.x}
                y={verseCtx.y}
                verse={verseCtx.verse}
                currentFolderId={verseCtx.folderId}
                verseFolders={verseFolders}
                onClose={() => setVerseCtx(null)}
                onDelete={verse => { setVerseCtx(null); setVerseToDelete(verse); }}
            />
        )}

        {/* ── Modals ── */}
        <BibleModal open={bibleModal} onClose={() => setBibleModal(false)} verseFolders={verseFolders} />
        <SongModal
            open={songModal}
            onClose={() => { setSongModal(false); setEditSong(null); }}
            songFolders={songFolders}
            editData={editSong ?? undefined}
        />
        {songToDelete && (
            <SongDeleteModal song={songToDelete} onClose={() => setSongToDelete(null)} />
        )}
        {folderToDelete && (
            <FolderDeleteModal folder={folderToDelete} onClose={() => setFolderToDelete(null)} />
        )}
        {verseFolderToDelete && (
            <VerseFolderDeleteModal folder={verseFolderToDelete} onClose={() => setVerseFolderToDelete(null)} />
        )}
        {verseToDelete && (
            <VerseDeleteModal verse={verseToDelete} onClose={() => setVerseToDelete(null)} />
        )}

        {/* Song Folder Modal (create + rename) */}
        {folderModal && (
            <div className="lc-modal-backdrop" onClick={() => setFolderModal(null)}>
                <div className="lc-modal" onClick={e => e.stopPropagation()}>
                    <div className="lc-modal-header">
                        <span>{folderModal.mode === 'create' ? 'New Folder' : 'Rename Folder'}</span>
                        <button className="lc-modal-close" onClick={() => setFolderModal(null)}>✕</button>
                    </div>
                    <form onSubmit={submitFolder}>
                        <div className="lc-modal-body">
                            <label className="lc-modal-label">Folder Name</label>
                            <input
                                className={`lc-modal-input${folderForm.errors.name ? ' error' : ''}`}
                                type="text"
                                placeholder="e.g. Worship Songs"
                                value={folderForm.data.name}
                                onChange={e => folderForm.setData('name', e.target.value)}
                                autoFocus
                            />
                            {folderForm.errors.name && (
                                <span className="lc-modal-error">{folderForm.errors.name}</span>
                            )}
                        </div>
                        <div className="lc-modal-footer">
                            <button type="button" className="lc-modal-btn" onClick={() => setFolderModal(null)}>Cancel</button>
                            <button type="submit" className="lc-modal-btn primary" disabled={folderForm.processing}>
                                {folderForm.processing ? 'Saving…' : folderModal.mode === 'create' ? 'Create Folder' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Verse Folder Modal (create + rename) */}
        {verseFolderModal && (
            <div className="lc-modal-backdrop" onClick={() => setVerseFolderModal(null)}>
                <div className="lc-modal" onClick={e => e.stopPropagation()}>
                    <div className="lc-modal-header">
                        <span>{verseFolderModal.mode === 'create' ? 'New Folder' : 'Rename Folder'}</span>
                        <button className="lc-modal-close" onClick={() => setVerseFolderModal(null)}>✕</button>
                    </div>
                    <form onSubmit={submitVerseFolderModal}>
                        <div className="lc-modal-body">
                            <label className="lc-modal-label">Folder Name</label>
                            <input
                                className={`lc-modal-input${verseFolderForm.errors.name ? ' error' : ''}`}
                                type="text"
                                placeholder="e.g. Worship Verses"
                                value={verseFolderForm.data.name}
                                onChange={e => verseFolderForm.setData('name', e.target.value)}
                                autoFocus
                            />
                            {verseFolderForm.errors.name && (
                                <span className="lc-modal-error">{verseFolderForm.errors.name}</span>
                            )}
                        </div>
                        <div className="lc-modal-footer">
                            <button type="button" className="lc-modal-btn" onClick={() => setVerseFolderModal(null)}>Cancel</button>
                            <button type="submit" className="lc-modal-btn primary" disabled={verseFolderForm.processing}>
                                {verseFolderForm.processing ? 'Saving…' : verseFolderModal.mode === 'create' ? 'Create Folder' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
