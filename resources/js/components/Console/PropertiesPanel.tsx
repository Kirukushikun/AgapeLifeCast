import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Bold, Italic, Layers, AlignLeft, AlignCenter, AlignRight,
    ArrowUp, ArrowDown, AlignJustify, Trash2,
    ChevronDown, Plus, ClipboardList, X,
} from 'lucide-react';
import AddScheduleItemModal from '@/components/Console/AddScheduleItemModal';
import NameInputModal from '@/components/Console/NameInputModal';
import type {
    ScheduleData, ThemeData, SelectedSong, SchedulePreset,
    SongFolder, SongItem, VerseFolder, SavedVerse,
    MediaFolder, MediaFile, SlideDeckFolder, SlideDeck,
} from '@/pages/Console/Index';

type ComposerType = 'solid' | 'gradient' | 'image';

const COLORS = [
    { value: '#ffffff', title: 'White'       },
    { value: '#8cc341', title: 'Green'       },
    { value: '#a8d966', title: 'Light Green' },
    { value: '#ffdd57', title: 'Yellow'      },
    { value: '#cccccc', title: 'Gray'        },
];

export default function PropertiesPanel({
    schedule, themes, selectedSong, selectedVerse, selectedDeck,
    songFolders, uncategorizedSongs,
    verseFolders, savedVerses,
    mediaFolders, uncategorizedMedia,
    slideDeckFolders, uncategorizedDecks,
    presets,
    onScheduleItemClick,
}: {
    schedule: ScheduleData | null;
    themes: ThemeData[];
    selectedSong: SelectedSong | null;
    selectedVerse: SavedVerse | null;
    selectedDeck: SlideDeck | null;
    songFolders: SongFolder[];
    uncategorizedSongs: SongItem[];
    verseFolders: VerseFolder[];
    savedVerses: SavedVerse[];
    mediaFolders: MediaFolder[];
    uncategorizedMedia: MediaFile[];
    slideDeckFolders: SlideDeckFolder[];
    uncategorizedDecks: SlideDeck[];
    presets: SchedulePreset[];
    onScheduleItemClick: (type: string, schedulableId: number) => void;
}) {
    const [presetOpen, setPresetOpen]           = useState(false);
    const [addModalOpen, setAddModalOpen]       = useState(false);
    const [savePresetOpen, setSavePresetOpen]   = useState(false);
    const [renameTheme, setRenameTheme]         = useState<ThemeData | null>(null);
    const [ctxTheme, setCtxTheme]               = useState<ThemeData | null>(null);
    const [ctxPos, setCtxPos]                   = useState({ x: 0, y: 0 });

    const items = schedule?.items ?? [];
    let activeSchedIdx = -1;
    if (selectedDeck) {
        activeSchedIdx = items.findIndex(i => i.type === 'SlideDeck' && i.schedulable_id === selectedDeck.id);
    } else if (selectedVerse) {
        activeSchedIdx = items.findIndex(i => i.type === 'SavedVerse' && i.schedulable_id === selectedVerse.id);
    } else if (selectedSong) {
        activeSchedIdx = items.findIndex(i => i.type === 'Song' && i.schedulable_id === selectedSong.id);
    }
    const [bold, setBold]                       = useState(true);
    const [italic, setItalic]                   = useState(false);
    const [shadow, setShadow]                   = useState(false);
    const [textAlign, setTextAlign]             = useState<'left'|'center'|'right'>('left');
    const [textPos, setTextPos]                 = useState<'top'|'center'|'bottom'>('center');
    const [textColor, setTextColor]             = useState('#ffffff');
    const [verseNumColor, setVerseNumColor]     = useState('#8cc341');
    const [activeTheme, setActiveTheme]         = useState(0);
    const [composerOpen, setComposerOpen]       = useState(false);
    const [composerType, setComposerType]       = useState<ComposerType>('solid');
    const [solidColor, setSolidColor]           = useState('#1a1a2e');
    const [gradFrom, setGradFrom]               = useState('#0d2200');
    const [gradTo, setGradTo]                   = useState('#1e4700');
    const [gradAngle, setGradAngle]             = useState(135);
    const [tcTextColor, setTcTextColor]         = useState('#ffffff');
    const [themeName, setThemeName]             = useState('');

    const presetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
                setPresetOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const close = () => setCtxTheme(null);
        document.addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
        return () => document.removeEventListener('click', close);
    }, []);

    /* derive composer preview background */
    const composerPreviewBg =
        composerType === 'solid'    ? solidColor :
        composerType === 'gradient' ? `linear-gradient(${gradAngle}deg,${gradFrom},${gradTo})` :
        '#444';

    return (
        <aside className="lc-right-panel">

            {/* ── Schedule ── */}
            <div className="lc-sched-section">
                <div className="lc-sched-header">
                    <span className="lc-sched-title">Schedule</span>
                    <div className="lc-sched-actions">

                        {/* Preset dropdown */}
                        <div className="lc-preset-wrap" ref={presetRef}>
                            <button
                                className={`lc-preset-trigger${presetOpen ? ' open' : ''}`}
                                onClick={() => setPresetOpen(v => !v)}
                            >
                                <ClipboardList size={11} />
                                Presets
                                <ChevronDown size={10} />
                            </button>
                            <div className={`lc-preset-panel${presetOpen ? ' open' : ''}`}>
                                <div className="lc-preset-panel-header">Saved Presets</div>
                                {presets.length === 0 ? (
                                    <div className="lc-preset-empty">No saved presets yet.</div>
                                ) : (
                                    presets.map(preset => (
                                        <div key={preset.id} className="lc-preset-item">
                                            <div className="lc-preset-info">
                                                <div className="lc-preset-name">{preset.name}</div>
                                                <div className="lc-preset-count">{preset.count} items</div>
                                            </div>
                                            <div className="lc-preset-item-actions">
                                                <button
                                                    className="lc-preset-load-btn"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        router.post(`/console/schedule-presets/${preset.id}/load`, {}, {
                                                            onSuccess: () => setPresetOpen(false),
                                                        });
                                                    }}
                                                >
                                                    Load
                                                </button>
                                                <button
                                                    className="lc-preset-delete-btn"
                                                    title="Delete preset"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        router.delete(`/console/schedule-presets/${preset.id}`);
                                                    }}
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div className="lc-preset-footer">
                                    <button
                                        className="lc-preset-footer-btn"
                                        onClick={e => {
                                            e.stopPropagation();
                                            if ((schedule?.items ?? []).length === 0) return;
                                            setPresetOpen(false);
                                            setSavePresetOpen(true);
                                        }}
                                    >
                                        Save current
                                    </button>
                                    <button
                                        className="lc-preset-footer-btn danger"
                                        onClick={e => {
                                            e.stopPropagation();
                                            router.delete('/console/schedule', {
                                                onSuccess: () => setPresetOpen(false),
                                            });
                                        }}
                                    >
                                        Start empty
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button className="lc-add-sched-btn" onClick={() => setAddModalOpen(true)}>+ Add</button>
                    </div>
                </div>

                <div className="lc-sched-list">
                    {items.length === 0 && (
                        <div className="lc-sched-empty">No items in schedule yet.</div>
                    )}
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className={`lc-sched-row${activeSchedIdx === idx ? ' active' : ''}`}
                            onClick={() => onScheduleItemClick(item.type, item.schedulable_id)}
                        >
                            <span className="lc-sr-icon">{item.icon}</span>
                            <div className="lc-sr-info">
                                <div className="lc-sr-name">{item.name}</div>
                            </div>
                            <div className="lc-sr-actions">
                                <button
                                    className="lc-sr-btn remove"
                                    title="Remove"
                                    onClick={e => { e.stopPropagation(); router.delete(`/console/schedule-items/${item.id}`); }}
                                >
                                    <Trash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Properties header ── */}
            <div className="lc-panel-header">Properties</div>

            {/* ── Text Style ── */}
            <div className="lc-panel-section">
                <h4>Text Style</h4>

                <div className="lc-field-row">
                    <label>Font</label>
                    <select>
                        <option>Segoe UI</option>
                        <option>Arial</option>
                        <option>Times New Roman</option>
                        <option>Georgia</option>
                    </select>
                </div>

                <div className="lc-field-row">
                    <label>Size</label>
                    <input type="range" min="20" max="80" defaultValue="48" />
                </div>

                <div className="lc-field-row">
                    <label>Style</label>
                    <div className="lc-style-toggles">
                        <button
                            className={`lc-style-btn${bold ? ' active' : ''}`}
                            title="Bold"
                            onClick={() => setBold(v => !v)}
                        ><Bold /></button>
                        <button
                            className={`lc-style-btn${italic ? ' active' : ''}`}
                            title="Italic"
                            onClick={() => setItalic(v => !v)}
                        ><Italic /></button>
                        <button
                            className={`lc-style-btn${shadow ? ' active' : ''}`}
                            title="Text Shadow"
                            onClick={() => setShadow(v => !v)}
                        ><Layers /></button>
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Color</label>
                    <div className="lc-color-swatch">
                        {COLORS.map(c => (
                            <div
                                key={c.value}
                                className={`lc-swatch${textColor === c.value ? ' active' : ''}`}
                                style={{ background: c.value }}
                                title={c.title}
                                onClick={() => setTextColor(c.value)}
                            />
                        ))}
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Verse # Color</label>
                    <div className="lc-color-swatch">
                        {COLORS.map(c => (
                            <div
                                key={c.value}
                                className={`lc-swatch${verseNumColor === c.value ? ' active' : ''}`}
                                style={{ background: c.value }}
                                title={c.title}
                                onClick={() => setVerseNumColor(c.value)}
                            />
                        ))}
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Align</label>
                    <div className="lc-style-toggles">
                        <button
                            className={`lc-style-btn${textAlign === 'left' ? ' active' : ''}`}
                            title="Left"
                            onClick={() => setTextAlign('left')}
                        ><AlignLeft /></button>
                        <button
                            className={`lc-style-btn${textAlign === 'center' ? ' active' : ''}`}
                            title="Center"
                            onClick={() => setTextAlign('center')}
                        ><AlignCenter /></button>
                        <button
                            className={`lc-style-btn${textAlign === 'right' ? ' active' : ''}`}
                            title="Right"
                            onClick={() => setTextAlign('right')}
                        ><AlignRight /></button>
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Position</label>
                    <div className="lc-style-toggles">
                        <button
                            className={`lc-style-btn${textPos === 'top' ? ' active' : ''}`}
                            title="Top"
                            onClick={() => setTextPos('top')}
                        ><ArrowUp /></button>
                        <button
                            className={`lc-style-btn${textPos === 'center' ? ' active' : ''}`}
                            title="Center"
                            onClick={() => setTextPos('center')}
                        ><AlignJustify /></button>
                        <button
                            className={`lc-style-btn${textPos === 'bottom' ? ' active' : ''}`}
                            title="Bottom"
                            onClick={() => setTextPos('bottom')}
                        ><ArrowDown /></button>
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Spacing</label>
                    <input type="range" min="1" max="3" step="0.1" defaultValue="1.7" />
                </div>
            </div>

            {/* ── Theme ── */}
            <div className="lc-panel-section">
                <h4>Theme</h4>

                <div className="lc-theme-cards">
                    {themes.map(theme => (
                        <div
                            key={theme.id}
                            className={`lc-theme-card${selectedSong?.theme_id === theme.id ? ' active' : ''}`}
                            style={{ background: theme.css_bg }}
                            onClick={() => {
                                if (!selectedSong) return;
                                router.patch(`/console/songs/${selectedSong.id}/theme`, { theme_id: theme.id });
                            }}
                            onContextMenu={e => {
                                e.preventDefault();
                                setCtxTheme(theme);
                                setCtxPos({ x: e.clientX, y: e.clientY });
                            }}
                        >
                            <span className="tc-label">{theme.name}</span>
                            {theme.is_blank_screen && <span className="lc-tc-blank-badge">blank</span>}
                        </div>
                    ))}
                    <button
                        className="lc-theme-card-add"
                        title="Create new theme"
                        onClick={() => setComposerOpen(v => !v)}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {selectedSong?.theme_id && (
                    <button
                        className="lc-theme-clear-btn"
                        onClick={() => router.patch(`/console/songs/${selectedSong.id}/theme`, { theme_id: null })}
                    >
                        Clear theme
                    </button>
                )}

                {/* Theme Composer */}
                <div className={`lc-theme-composer${composerOpen ? ' open' : ''}`}>

                    {/* Preview swatch */}
                    <div
                        className="lc-tc-preview"
                        style={{ background: composerPreviewBg, color: tcTextColor }}
                    >
                        Amazing Grace
                    </div>

                    {/* Type switcher */}
                    <div className="lc-tc-type-btns">
                        {(['solid', 'gradient'] as ComposerType[]).map(t => (
                            <button
                                key={t}
                                className={`lc-tc-type-btn${composerType === t ? ' active' : ''}`}
                                onClick={() => setComposerType(t)}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Solid fields */}
                    {composerType === 'solid' && (
                        <div className="lc-tc-color-row">
                            <label>Color</label>
                            <input
                                type="color"
                                value={solidColor}
                                onChange={e => setSolidColor(e.target.value)}
                            />
                            <input
                                type="text"
                                value={solidColor}
                                maxLength={7}
                                onChange={e => setSolidColor(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Gradient fields */}
                    {composerType === 'gradient' && (
                        <>
                            <div className="lc-tc-color-row">
                                <label>From</label>
                                <input type="color" value={gradFrom} onChange={e => setGradFrom(e.target.value)} />
                                <input type="text" value={gradFrom} maxLength={7} onChange={e => setGradFrom(e.target.value)} />
                            </div>
                            <div className="lc-tc-color-row">
                                <label>To</label>
                                <input type="color" value={gradTo} onChange={e => setGradTo(e.target.value)} />
                                <input type="text" value={gradTo} maxLength={7} onChange={e => setGradTo(e.target.value)} />
                            </div>
                            <div className="lc-tc-angle-row">
                                <label>Angle</label>
                                <input
                                    type="range" min="0" max="360"
                                    value={gradAngle}
                                    onChange={e => setGradAngle(Number(e.target.value))}
                                />
                                <span className="lc-tc-angle-val">{gradAngle}°</span>
                            </div>
                        </>
                    )}

                    {/* Text color (shared) */}
                    <div className="lc-tc-color-row">
                        <label>Text</label>
                        <input type="color" value={tcTextColor} onChange={e => setTcTextColor(e.target.value)} />
                        <input type="text" value={tcTextColor} maxLength={7} onChange={e => setTcTextColor(e.target.value)} />
                    </div>

                    {/* Name + save */}
                    <div className="lc-tc-name-row">
                        <input
                            type="text"
                            placeholder="Theme name…"
                            value={themeName}
                            onChange={e => setThemeName(e.target.value)}
                        />
                        <button
                            className="lc-tc-save-btn"
                            disabled={!themeName.trim()}
                            onClick={() => {
                                router.post('/console/themes', {
                                    name:              themeName.trim(),
                                    bg_type:           composerType,
                                    bg_color:          composerType === 'solid' ? solidColor : null,
                                    bg_gradient_from:  composerType === 'gradient' ? gradFrom : null,
                                    bg_gradient_to:    composerType === 'gradient' ? gradTo   : null,
                                    bg_gradient_angle: composerType === 'gradient' ? gradAngle : null,
                                    text_color:        tcTextColor,
                                }, {
                                    onSuccess: () => { setThemeName(''); setComposerOpen(false); },
                                });
                            }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Output ── */}
            <div className="lc-panel-section">
                <h4>Output</h4>
                <div className="lc-field-row">
                    <label>Resolution</label>
                    <select>
                        <option>1920×1080</option>
                        <option>1280×720</option>
                        <option>3840×2160</option>
                    </select>
                </div>
            </div>

            {savePresetOpen && (
                <NameInputModal
                    title="Save Preset"
                    label="Preset name"
                    placeholder="e.g. Sunday Morning Service"
                    confirmLabel="Save"
                    onConfirm={name => {
                        router.post('/console/schedule-presets', { name }, {
                            onSuccess: () => setSavePresetOpen(false),
                        });
                    }}
                    onClose={() => setSavePresetOpen(false)}
                />
            )}

            {renameTheme && (
                <NameInputModal
                    title="Rename Theme"
                    label="Theme name"
                    initialValue={renameTheme.name}
                    confirmLabel="Rename"
                    onConfirm={name => {
                        router.patch(`/console/themes/${renameTheme.id}`, { name });
                        setRenameTheme(null);
                    }}
                    onClose={() => setRenameTheme(null)}
                />
            )}

            {addModalOpen && (
                <AddScheduleItemModal
                    songFolders={songFolders}
                    uncategorizedSongs={uncategorizedSongs}
                    verseFolders={verseFolders}
                    savedVerses={savedVerses}
                    mediaFolders={mediaFolders}
                    uncategorizedMedia={uncategorizedMedia}
                    slideDeckFolders={slideDeckFolders}
                    uncategorizedDecks={uncategorizedDecks}
                    onClose={() => setAddModalOpen(false)}
                />
            )}

            {ctxTheme && (
                <div
                    className="lc-theme-ctx"
                    style={{ top: ctxPos.y, left: ctxPos.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="lc-theme-ctx-item"
                        onClick={() => { router.patch(`/console/themes/${ctxTheme.id}/blank`); setCtxTheme(null); }}
                    >
                        {ctxTheme.is_blank_screen ? '✓ Used as Blank Screen' : '⬛ Set as Blank Screen'}
                    </div>
                    {!ctxTheme.is_system && <>
                        <div className="lc-theme-ctx-sep" />
                        <div
                            className="lc-theme-ctx-item"
                            onClick={() => {
                                setRenameTheme(ctxTheme);
                                setCtxTheme(null);
                            }}
                        >
                            ✏️ Rename
                        </div>
                        <div
                            className="lc-theme-ctx-item lc-theme-ctx-danger"
                            onClick={() => { router.delete(`/console/themes/${ctxTheme.id}`); setCtxTheme(null); }}
                        >
                            🗑️ Delete
                        </div>
                    </>}
                </div>
            )}

        </aside>
    );
}
