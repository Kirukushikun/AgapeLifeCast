import { useState, useEffect, useRef } from 'react';
import {
    Music, BookOpen, Film, Image, Headphones, FileText, Presentation,
    FolderPlus, Upload, Plus, ChevronDown, SkipBack, SkipForward, Play, Pause,
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
import MediaFolderDeleteModal from '@/components/Console/Media/MediaFolderDeleteModal';
import MediaDeleteModal from '@/components/Console/Media/MediaDeleteModal';
import MediaContextMenu from '@/components/Console/Media/MediaContextMenu';
import MediaUploadModal from '@/components/Console/Media/MediaUploadModal';
import type { EditSongData } from '@/components/Console/Songs/SongModal';
import type { SongFolder, VerseFolder, SavedVerse, MediaFile, MediaFolder, SlideDeck, SongItem, SelectedSong } from '@/pages/Console/Index';

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

function MediaIcon({ type }: { type: MediaFile['type'] }) {
    if (type === 'video') return <Film />;
    if (type === 'audio') return <Headphones />;
    return <Image />;
}

function mediaIconClass(type: MediaFile['type']) {
    if (type === 'video') return 'lc-icon-video';
    if (type === 'audio') return 'lc-icon-audio';
    return 'lc-icon-image';
}

export default function LibraryPanel({ songFolders, uncategorizedSongs, verseFolders, savedVerses, mediaFolders, uncategorizedMedia, slideDecks, activeSongId, activeVerseId, selectedSong, onVerseSelect, onSongSelect, volume, onHasAudioChange, onMediaLive, liveMedia }: { songFolders: SongFolder[]; uncategorizedSongs: SongItem[]; verseFolders: VerseFolder[]; savedVerses: SavedVerse[]; mediaFolders: MediaFolder[]; uncategorizedMedia: MediaFile[]; slideDecks: SlideDeck[]; activeSongId: number | null; activeVerseId: number | null; selectedSong: SelectedSong | null; onVerseSelect: (verse: SavedVerse) => void; onSongSelect: () => void; volume: number; onHasAudioChange: (v: boolean) => void; onMediaLive: (file: MediaFile | null, startTime?: number) => void; liveMedia: MediaFile | null }) {

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

    // ── Media state ──
    const [uploadModal, setUploadModal]                       = useState(false);
    const [mediaFolderModal, setMediaFolderModal]             = useState<{ mode: 'create' } | { mode: 'rename'; id: number } | null>(null);
    const [mediaFolderToDelete, setMediaFolderToDelete]       = useState<MediaFolder | null>(null);
    const [mediaToDelete, setMediaToDelete]                   = useState<MediaFile | null>(null);
    const [mediaCtx, setMediaCtx]                             = useState<{ x: number; y: number; file: MediaFile; folderId: number | null } | null>(null);
    const [collapsedMediaFolders, setCollapsedMediaFolders]   = useState<Set<number>>(new Set());
    const [selectedMedia, setSelectedMedia]                   = useState<MediaFile | null>(null);
    const mediaFolderForm = useForm({ name: '' });

    // ── Media player state ──
    const videoRef       = useRef<HTMLVideoElement>(null);
    const audioRef       = useRef<HTMLAudioElement>(null);
    const scrubRef       = useRef<HTMLInputElement>(null);
    const isScrubbingRef = useRef(false);
    const [isPlaying, setIsPlaying]     = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration]       = useState(0);

    // Derived — true only when the item currently in the SMP is also on the live screen
    const isCurrentMediaLive = !!selectedMedia && selectedMedia.id === liveMedia?.id;

    // ── Layout state ──
    const [activeTab, setActiveTab]     = useState<Tab>('songs');
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

    // ── Media handlers ──
    useEffect(() => {
        videoRef.current?.pause();
        audioRef.current?.pause();
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        if (scrubRef.current) scrubRef.current.value = '0';
        onHasAudioChange(!!selectedMedia && selectedMedia.type !== 'image');
    }, [selectedMedia?.id]);

    // Native scrubber — bypasses React's synthetic event system so dragging
    // while playing doesn't fight React re-renders.
    useEffect(() => {
        const el = scrubRef.current;
        if (!el) return;

        const onInput  = () => {
            const t = parseFloat(el.value);
            const media = videoRef.current ?? audioRef.current;
            if (media) media.currentTime = t;
            setCurrentTime(t);
        };
        const onStart  = () => { isScrubbingRef.current = true; };
        const onEnd    = () => { isScrubbingRef.current = false; };

        el.addEventListener('input', onInput);
        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);

        return () => {
            el.removeEventListener('input', onInput);
            el.removeEventListener('mousedown', onStart);
            el.removeEventListener('touchstart', onStart);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);
        };
    }, [selectedMedia?.id]);

    const handleMediaSelect = (file: MediaFile) => {
        setSelectedMedia(file);
        setSmpExpanded(true);
        // Browsing does NOT touch the live output — only explicit Send/Remove does
    };

    const handleToggleLive = () => {
        if (!selectedMedia || selectedMedia.type === 'audio') return;

        if (isCurrentMediaLive) {
            // Remove from live; pause SMP if it was providing audio for the live video
            onMediaLive(null);
            if (selectedMedia.type === 'video') {
                videoRef.current?.pause();
                setIsPlaying(false);
            }
        } else {
            // Send to live — capture current SMP position so live video starts in sync
            const startTime = selectedMedia.type === 'video'
                ? (videoRef.current?.currentTime ?? 0)
                : 0;
            onMediaLive(selectedMedia, startTime);
            // Auto-play SMP so it becomes the audio source for the live video
            if (selectedMedia.type === 'video') {
                videoRef.current?.play().catch(() => {});
                setIsPlaying(true);
            }
        }
    };

    const getMediaEl = () =>
        selectedMedia?.type === 'video' ? videoRef.current : audioRef.current;

    const handlePlayPause = () => {
        const el = getMediaEl();
        if (!el) return;
        if (isPlaying) {
            el.pause();
            setIsPlaying(false);
        } else {
            el.play().catch(() => {});
            setIsPlaying(true);
        }
    };


    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
        const t = e.currentTarget.currentTime;
        if (!isScrubbingRef.current) {
            setCurrentTime(t);
            if (scrubRef.current) scrubRef.current.value = String(t);
        }
        if (duration === 0) {
            const d = e.currentTarget.duration;
            if (isFinite(d) && d > 0) setDuration(d);
        }
    };

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
        const d = e.currentTarget.duration;
        if (isFinite(d) && d > 0) setDuration(d);
        e.currentTarget.volume = volume;
    };

    useEffect(() => {
        if (videoRef.current) videoRef.current.volume = volume;
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // Mute SMP video when the live screen is handling that video's audio,
    // unmute it when just previewing so the operator can still monitor
    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = isCurrentMediaLive;
    }, [isCurrentMediaLive]);

    const handleEnded = () => setIsPlaying(false);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };

    const toggleMediaFolder = (id: number) =>
        setCollapsedMediaFolders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const openMediaFolderModal = () => { mediaFolderForm.reset(); setMediaFolderModal({ mode: 'create' }); };
    const openRenameMediaFolder = (folder: MediaFolder) => { mediaFolderForm.setData('name', folder.name); setMediaFolderModal({ mode: 'rename', id: folder.id }); };

    const submitMediaFolderModal = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!mediaFolderModal) return;
        if (mediaFolderModal.mode === 'create') {
            mediaFolderForm.post('/console/media-folders', { onSuccess: () => setMediaFolderModal(null) });
        } else {
            mediaFolderForm.patch(`/console/media-folders/${mediaFolderModal.id}`, { onSuccess: () => setMediaFolderModal(null) });
        }
    };

    const handleMediaRightClick = (e: React.MouseEvent, file: MediaFile, folderId: number | null) => {
        e.preventDefault();
        setMediaCtx({ x: e.clientX, y: e.clientY, file, folderId });
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
                        <button className="lc-list-action-btn" onClick={openMediaFolderModal}>
                            <FolderPlus size={11} /> New Folder
                        </button>
                        <button className="lc-list-action-btn" onClick={() => setUploadModal(true)}>
                            <Upload size={11} /> Import
                        </button>
                    </div>

                    {mediaFolders.map(folder => (
                        <div
                            key={folder.id}
                            className={`lc-library-folder${collapsedMediaFolders.has(folder.id) ? ' collapsed' : ''}`}
                        >
                            <div className="lc-folder-row" onClick={() => toggleMediaFolder(folder.id)}>
                                <span className="lc-folder-chevron"><ChevronDown /></span>
                                <span>📁</span>
                                <span className="lc-folder-name">{folder.name}</span>
                                <div className="lc-folder-actions" onClick={e => e.stopPropagation()}>
                                    <button className="lc-folder-btn" title="Rename folder" onClick={() => openRenameMediaFolder(folder)}>
                                        <Pencil size={11} />
                                    </button>
                                    <button className="lc-folder-btn danger" title="Delete folder" onClick={() => setMediaFolderToDelete(folder)}>
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                            <div className="lc-folder-contents">
                                {folder.files.map(file => (
                                    <div
                                        key={file.id}
                                        className={`lc-library-item${selectedMedia?.id === file.id ? ' active' : ''}`}
                                        onClick={() => handleMediaSelect(file)}
                                        onContextMenu={e => handleMediaRightClick(e, file, folder.id)}
                                    >
                                        <div className={`lc-item-icon ${mediaIconClass(file.type)}`}>
                                            <MediaIcon type={file.type} />
                                        </div>
                                        <div className="lc-item-info">
                                            <div className="lc-item-title">{file.title}</div>
                                            <div className="lc-item-meta">{formatMediaMeta(file)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {uncategorizedMedia.length === 0 && mediaFolders.length === 0 && (
                        <div className="lc-library-empty">No media files yet.</div>
                    )}
                    {uncategorizedMedia.map(file => (
                        <div
                            key={file.id}
                            className={`lc-library-item lc-item-root${selectedMedia?.id === file.id ? ' active' : ''}`}
                            onClick={() => handleMediaSelect(file)}
                            onContextMenu={e => handleMediaRightClick(e, file, null)}
                        >
                            <div className={`lc-item-icon ${mediaIconClass(file.type)}`}>
                                <MediaIcon type={file.type} />
                            </div>
                            <div className="lc-item-info">
                                <div className="lc-item-title">{file.title}</div>
                                <div className="lc-item-meta">{formatMediaMeta(file)}</div>
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

                    {/* Screen */}
                    <div className="lc-smp-screen">
                        {!selectedMedia && (
                            <div className="lc-smp-placeholder">
                                <Film />
                                <span>No media loaded</span>
                            </div>
                        )}
                        {selectedMedia?.type === 'image' && (
                            <img src={selectedMedia.url} alt={selectedMedia.title} className="lc-smp-image" />
                        )}
                        {selectedMedia?.type === 'video' && (
                            <video
                                ref={videoRef}
                                src={selectedMedia.url}
                                className="lc-smp-video"
                                preload="metadata"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={handleEnded}
                            />
                        )}
                        {selectedMedia?.type === 'audio' && (
                            <>
                                <div className="lc-smp-audio-bg">
                                    <Headphones size={32} />
                                    <span className="lc-smp-audio-title">{selectedMedia.title}</span>
                                </div>
                                <audio
                                    ref={audioRef}
                                    src={selectedMedia.url}
                                    preload="metadata"
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={handleEnded}
                                />
                            </>
                        )}
                        {isCurrentMediaLive && <div className="lc-smp-live-bar">● LIVE</div>}
                    </div>

                    {/* File info (not shown for audio since audio bg already shows title) */}
                    {selectedMedia && selectedMedia.type !== 'audio' && (
                        <div className="lc-smp-info">
                            <span className="lc-smp-info-title">{selectedMedia.title}</span>
                            <span className="lc-smp-info-badge">{selectedMedia.extension.toUpperCase()}</span>
                        </div>
                    )}

                    {/* Scrubber — video/audio only */}
                    {selectedMedia && (selectedMedia.type === 'video' || selectedMedia.type === 'audio') && (
                        <div className="lc-smp-scrubber">
                            <span className="lc-smp-time">{formatTime(currentTime)}</span>
                            <input
                                ref={scrubRef}
                                type="range"
                                className="lc-smp-range"
                                min={0}
                                max={duration || 1}
                                step={0.01}
                                defaultValue={0}
                            />
                            <span className="lc-smp-time">{formatTime(duration)}</span>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="lc-smp-controls">
                        {selectedMedia && (selectedMedia.type === 'video' || selectedMedia.type === 'audio') && (
                            <>
                                <button className="lc-smp-btn" onClick={() => {
                                    const el = getMediaEl();
                                    if (el) el.currentTime = Math.max(0, el.currentTime - 10);
                                }}>
                                    <SkipBack />
                                </button>
                                <button className="lc-smp-btn" onClick={handlePlayPause}>
                                    {isPlaying ? <Pause /> : <Play />}
                                </button>
                                <button className="lc-smp-btn" onClick={() => {
                                    const el = getMediaEl();
                                    if (el) el.currentTime = Math.min(duration, el.currentTime + 10);
                                }}>
                                    <SkipForward />
                                </button>
                            </>
                        )}
                        <div className="lc-smp-spacer" />
                        <button
                            className={`lc-smp-send-btn${isCurrentMediaLive ? ' active' : ''}`}
                            onClick={handleToggleLive}
                            disabled={!selectedMedia || selectedMedia.type === 'audio'}
                        >
                            {isCurrentMediaLive ? 'On Live' : 'Send Live'}
                        </button>
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

        {/* ── Media Context Menu ── */}
        {mediaCtx && (
            <MediaContextMenu
                x={mediaCtx.x}
                y={mediaCtx.y}
                file={mediaCtx.file}
                currentFolderId={mediaCtx.folderId}
                mediaFolders={mediaFolders}
                onClose={() => setMediaCtx(null)}
                onDelete={file => { setMediaCtx(null); setMediaToDelete(file); }}
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
        <MediaUploadModal open={uploadModal} onClose={() => setUploadModal(false)} mediaFolders={mediaFolders} />

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
        {mediaFolderToDelete && (
            <MediaFolderDeleteModal folder={mediaFolderToDelete} onClose={() => setMediaFolderToDelete(null)} />
        )}
        {mediaToDelete && (
            <MediaDeleteModal file={mediaToDelete} onClose={() => setMediaToDelete(null)} />
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

        {/* Media Folder Modal (create + rename) */}
        {mediaFolderModal && (
            <div className="lc-modal-backdrop" onClick={() => setMediaFolderModal(null)}>
                <div className="lc-modal" onClick={e => e.stopPropagation()}>
                    <div className="lc-modal-header">
                        <span>{mediaFolderModal.mode === 'create' ? 'New Folder' : 'Rename Folder'}</span>
                        <button className="lc-modal-close" onClick={() => setMediaFolderModal(null)}>✕</button>
                    </div>
                    <form onSubmit={submitMediaFolderModal}>
                        <div className="lc-modal-body">
                            <label className="lc-modal-label">Folder Name</label>
                            <input
                                className={`lc-modal-input${mediaFolderForm.errors.name ? ' error' : ''}`}
                                type="text"
                                placeholder="e.g. Sunday Service"
                                value={mediaFolderForm.data.name}
                                onChange={e => mediaFolderForm.setData('name', e.target.value)}
                                autoFocus
                            />
                            {mediaFolderForm.errors.name && (
                                <span className="lc-modal-error">{mediaFolderForm.errors.name}</span>
                            )}
                        </div>
                        <div className="lc-modal-footer">
                            <button type="button" className="lc-modal-btn" onClick={() => setMediaFolderModal(null)}>Cancel</button>
                            <button type="submit" className="lc-modal-btn primary" disabled={mediaFolderForm.processing}>
                                {mediaFolderForm.processing ? 'Saving…' : mediaFolderModal.mode === 'create' ? 'Create Folder' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
