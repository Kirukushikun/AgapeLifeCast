import { useState } from 'react';
import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import type {
    SongFolder, SongItem,
    VerseFolder, SavedVerse,
    MediaFolder, MediaFile,
    SlideDeckFolder, SlideDeck,
} from '@/pages/Console/Index';

type Tab = 'songs' | 'bible' | 'media' | 'slides';

interface PickItem {
    type: string;
    id: number;
    name: string;
    meta: string;
    icon: string;
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
    onClose: () => void;
}

export default function AddScheduleItemModal({
    songFolders, uncategorizedSongs,
    verseFolders, savedVerses,
    mediaFolders, uncategorizedMedia,
    slideDeckFolders, uncategorizedDecks,
    onClose,
}: Props) {
    const [tab, setTab]         = useState<Tab>('songs');
    const [search, setSearch]   = useState('');
    const [selected, setSelected] = useState<{ type: string; id: number } | null>(null);

    const allSongs: PickItem[] = [
        ...songFolders.flatMap(f => f.songs),
        ...uncategorizedSongs,
    ].map(s => ({ type: 'song', id: s.id, name: s.title, meta: s.author ?? '', icon: '🎵' }));

    const allVerses: PickItem[] = [
        ...verseFolders.flatMap(f => f.verses),
        ...savedVerses,
    ].map(v => ({ type: 'verse', id: v.id, name: v.reference, meta: v.translation, icon: '📖' }));

    const allMedia: PickItem[] = [
        ...mediaFolders.flatMap(f => f.files),
        ...uncategorizedMedia,
    ].map(m => ({
        type: 'media', id: m.id, name: m.title, meta: m.type,
        icon: m.type === 'audio' ? '🎧' : m.type === 'video' ? '🎬' : '🖼️',
    }));

    const allDecks: PickItem[] = [
        ...slideDeckFolders.flatMap(f => f.decks),
        ...uncategorizedDecks,
    ].map(d => ({ type: 'deck', id: d.id, name: d.title, meta: `${d.slide_count} slides`, icon: '📊' }));

    const tabItems: Record<Tab, PickItem[]> = { songs: allSongs, bible: allVerses, media: allMedia, slides: allDecks };
    const TABS: [Tab, string][] = [['songs', '🎵 Songs'], ['bible', '📖 Bible'], ['media', '🎬 Media'], ['slides', '📊 Slides']];

    const query   = search.toLowerCase();
    const items   = tabItems[tab].filter(i => !query || i.name.toLowerCase().includes(query) || i.meta.toLowerCase().includes(query));

    const handleAdd = () => {
        if (!selected) return;
        router.post('/console/schedule-items', {
            schedulable_type: selected.type,
            schedulable_id:   selected.id,
        }, { onSuccess: onClose });
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-sched-add-modal" onClick={e => e.stopPropagation()}>

                <div className="lc-modal-header">
                    <span>Add to Schedule</span>
                    <button className="lc-modal-close" onClick={onClose}><X size={14} /></button>
                </div>

                <div className="lc-smi-tabs">
                    {TABS.map(([t, label]) => (
                        <button
                            key={t}
                            className={`lc-smi-tab${tab === t ? ' active' : ''}`}
                            onClick={() => { setTab(t); setSearch(''); setSelected(null); }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="lc-smi-search-row">
                    <input
                        className="lc-smi-search"
                        placeholder="Search…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="lc-smi-list">
                    {items.length === 0 && <div className="lc-smi-empty">No items found.</div>}
                    {items.map(item => {
                        const isSel = selected?.type === item.type && selected?.id === item.id;
                        return (
                            <div
                                key={`${item.type}-${item.id}`}
                                className={`lc-smi-row${isSel ? ' selected' : ''}`}
                                onClick={() => setSelected(isSel ? null : { type: item.type, id: item.id })}
                            >
                                <span className="lc-smi-icon">{item.icon}</span>
                                <div className="lc-smi-info">
                                    <div className="lc-smi-name">{item.name}</div>
                                    {item.meta && <div className="lc-smi-meta">{item.meta}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="lc-smi-footer">
                    <button className="lc-smi-cancel" onClick={onClose}>Cancel</button>
                    <button className="lc-smi-add-btn" disabled={!selected} onClick={handleAdd}>
                        Add to Schedule
                    </button>
                </div>

            </div>
        </div>
    );
}
