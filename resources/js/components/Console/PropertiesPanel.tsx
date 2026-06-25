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
    TextStyleData,
} from '@/pages/Console/Index';

type ComposerType = 'solid' | 'gradient' | 'image';


const RATIOS: { label: string; value: string }[] = [
    { label: '16:9', value: '16/9' },
    { label: '4:3',  value: '4/3'  },
    { label: '1:1',  value: '1/1'  },
    { label: '9:16', value: '9/16' },
];

export default function PropertiesPanel({
    schedule, themes, selectedSong, selectedVerse, selectedDeck,
    songFolders, uncategorizedSongs,
    verseFolders, savedVerses,
    mediaFolders, uncategorizedMedia,
    slideDeckFolders, uncategorizedDecks,
    presets,
    outputRatio,
    onRatioChange,
    onScheduleItemClick,
    onVerseThemeChange,
    textStyle,
    onTextStyleChange,
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
    outputRatio: string;
    onRatioChange: (ratio: string) => void;
    onScheduleItemClick: (type: string, schedulableId: number) => void;
    onVerseThemeChange: (themeId: number | null, theme: { css_bg: string; text_color: string } | null) => void;
    textStyle: TextStyleData;
    onTextStyleChange: (patch: Partial<TextStyleData>) => void;
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
                    <select value={textStyle.font} onChange={e => onTextStyleChange({ font: e.target.value })}>
                        <option value="Segoe UI">Segoe UI</option>
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Poppins">Poppins</option>
                    </select>
                </div>

                <div className="lc-field-row">
                    <label>Size</label>
                    <input
                        type="range" min="20" max="120" step="2"
                        value={textStyle.fontSize}
                        onChange={e => onTextStyleChange({ fontSize: Number(e.target.value) })}
                    />
                </div>

                <div className="lc-field-row">
                    <label>Text Color</label>
                    <div className="lc-tc-color-row" style={{ marginBottom: 0 }}>
                        <input
                            type="color"
                            value={textStyle.textColor}
                            onChange={e => onTextStyleChange({ textColor: e.target.value })}
                        />
                        <input
                            type="text"
                            value={textStyle.textColor}
                            maxLength={7}
                            onChange={e => onTextStyleChange({ textColor: e.target.value })}
                        />
                        {textStyle.textColor !== '#ffffff' && (
                            <button className="lc-color-reset-btn" title="Reset to white" onClick={() => onTextStyleChange({ textColor: '#ffffff' })}>
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Label Color</label>
                    <div className="lc-tc-color-row" style={{ marginBottom: 0 }}>
                        <input
                            type="color"
                            value={textStyle.labelColor}
                            onChange={e => onTextStyleChange({ labelColor: e.target.value })}
                        />
                        <input
                            type="text"
                            value={textStyle.labelColor}
                            maxLength={7}
                            onChange={e => onTextStyleChange({ labelColor: e.target.value })}
                        />
                        {textStyle.labelColor !== '#8cc341' && (
                            <button className="lc-color-reset-btn" title="Reset to green" onClick={() => onTextStyleChange({ labelColor: '#8cc341' })}>
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Style</label>
                    <div className="lc-style-toggles">
                        <button
                            className={`lc-style-btn${textStyle.bold ? ' active' : ''}`}
                            title="Bold"
                            onClick={() => onTextStyleChange({ bold: !textStyle.bold })}
                        ><Bold /></button>
                        <button
                            className={`lc-style-btn${textStyle.italic ? ' active' : ''}`}
                            title="Italic"
                            onClick={() => onTextStyleChange({ italic: !textStyle.italic })}
                        ><Italic /></button>
                        <button
                            className={`lc-style-btn${textStyle.shadow ? ' active' : ''}`}
                            title="Text Shadow"
                            onClick={() => onTextStyleChange({ shadow: !textStyle.shadow })}
                        ><Layers /></button>
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Align</label>
                    <div className="lc-style-toggles">
                        <button
                            className={`lc-style-btn${textStyle.textAlign === 'left' ? ' active' : ''}`}
                            title="Left"
                            onClick={() => onTextStyleChange({ textAlign: 'left' })}
                        ><AlignLeft /></button>
                        <button
                            className={`lc-style-btn${textStyle.textAlign === 'center' ? ' active' : ''}`}
                            title="Center"
                            onClick={() => onTextStyleChange({ textAlign: 'center' })}
                        ><AlignCenter /></button>
                        <button
                            className={`lc-style-btn${textStyle.textAlign === 'right' ? ' active' : ''}`}
                            title="Right"
                            onClick={() => onTextStyleChange({ textAlign: 'right' })}
                        ><AlignRight /></button>
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Position</label>
                    <div className="lc-style-toggles">
                        <button
                            className={`lc-style-btn${textStyle.textPos === 'top' ? ' active' : ''}`}
                            title="Top"
                            onClick={() => onTextStyleChange({ textPos: 'top' })}
                        ><ArrowUp /></button>
                        <button
                            className={`lc-style-btn${textStyle.textPos === 'center' ? ' active' : ''}`}
                            title="Center"
                            onClick={() => onTextStyleChange({ textPos: 'center' })}
                        ><AlignJustify /></button>
                        <button
                            className={`lc-style-btn${textStyle.textPos === 'bottom' ? ' active' : ''}`}
                            title="Bottom"
                            onClick={() => onTextStyleChange({ textPos: 'bottom' })}
                        ><ArrowDown /></button>
                    </div>
                </div>

                <div className="lc-field-row">
                    <label>Spacing</label>
                    <input
                        type="range" min="1" max="3" step="0.1"
                        value={textStyle.lineSpacing}
                        onChange={e => onTextStyleChange({ lineSpacing: Number(e.target.value) })}
                    />
                </div>

                <div className="lc-field-row">
                    <label>Transition</label>
                    <select
                        value={textStyle.transition ?? 'fade'}
                        onChange={e => onTextStyleChange({ transition: e.target.value as TextStyleData['transition'] })}
                    >
                        <option value="none">None</option>
                        <option value="fade">Fade</option>
                        <option value="zoom">Zoom Fade</option>
                        <option value="slide">Slide</option>
                    </select>
                </div>
            </div>

            {/* ── Theme ── */}
            <div className="lc-panel-section">
                <h4>Theme</h4>

                <div className="lc-theme-cards">
                    {themes.map(theme => (
                        <div
                            key={theme.id}
                            className={`lc-theme-card${
                                (selectedVerse ? selectedVerse.theme_id : selectedSong?.theme_id) === theme.id
                                    ? ' active' : ''
                            }`}
                            style={{ background: theme.css_bg }}
                            onClick={() => {
                                if (selectedVerse) {
                                    onVerseThemeChange(theme.id, { css_bg: theme.css_bg, text_color: theme.text_color });
                                    router.patch(`/console/bible/${selectedVerse.id}/theme`, { theme_id: theme.id }, {
                                        preserveState: true, preserveScroll: true,
                                    });
                                } else if (selectedSong) {
                                    router.patch(`/console/songs/${selectedSong.id}/theme`, { theme_id: theme.id }, {
                                        preserveState: true, preserveScroll: true, only: ['selectedSong'],
                                    });
                                }
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

                {(selectedVerse ? selectedVerse.theme_id : selectedSong?.theme_id) && (
                    <button
                        className="lc-theme-clear-btn"
                        onClick={() => {
                            if (selectedVerse) {
                                onVerseThemeChange(null, null);
                                router.patch(`/console/bible/${selectedVerse.id}/theme`, { theme_id: null }, {
                                    preserveState: true, preserveScroll: true,
                                });
                            } else if (selectedSong) {
                                router.patch(`/console/songs/${selectedSong.id}/theme`, { theme_id: null }, {
                                    preserveState: true, preserveScroll: true, only: ['selectedSong'],
                                });
                            }
                        }}
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
                    <label>Aspect Ratio</label>
                    <div className="lc-style-toggles">
                        {RATIOS.map(r => (
                            <button
                                key={r.value}
                                className={`lc-style-btn${outputRatio === r.value ? ' active' : ''}`}
                                onClick={() => onRatioChange(r.value)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
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
