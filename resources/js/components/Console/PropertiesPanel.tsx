import { useState, useRef, useEffect } from 'react';
import {
    Bold, Italic, Layers, AlignLeft, AlignCenter, AlignRight,
    ArrowUp, ArrowDown, AlignJustify, Trash2, GripVertical,
    ChevronDown, Plus, ClipboardList,
} from 'lucide-react';

type ComposerType = 'solid' | 'gradient' | 'image';

const SCHEDULE_ITEMS = [
    { icon: '🎵', name: 'Amazing Grace' },
    { icon: '📖', name: 'John 3:16' },
    { icon: '🎵', name: 'How Great Is Our God' },
];

const THEMES = [
    { name: 'Dark Forest', bg: 'linear-gradient(135deg,#0d2200,#1e4700)', text: '#fff' },
    { name: 'Midnight',    bg: '#1a1a2e',                                  text: '#fff' },
    { name: 'Pure Black',  bg: '#000000',                                  text: '#fff' },
    { name: 'Deep Blue',   bg: 'linear-gradient(135deg,#0d1b47,#1a3a8f)', text: '#fff' },
];

const COLORS = [
    { value: '#ffffff', title: 'White'       },
    { value: '#8cc341', title: 'Green'       },
    { value: '#a8d966', title: 'Light Green' },
    { value: '#ffdd57', title: 'Yellow'      },
    { value: '#cccccc', title: 'Gray'        },
];

export default function PropertiesPanel() {
    const [presetOpen, setPresetOpen]           = useState(false);
    const [activeItem, setActiveItem]           = useState(0);
    const [bold, setBold]                       = useState(true);
    const [italic, setItalic]                   = useState(false);
    const [shadow, setShadow]                   = useState(false);
    const [textAlign, setTextAlign]             = useState<'left'|'center'|'right'>('left');
    const [textPos, setTextPos]                 = useState<'top'|'center'|'bottom'>('center');
    const [textColor, setTextColor]             = useState('#ffffff');
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
                                <div className="lc-preset-empty">No saved presets yet.</div>
                                <div className="lc-preset-footer">
                                    <button className="lc-preset-footer-btn">Save current</button>
                                    <button className="lc-preset-footer-btn danger">Start empty</button>
                                </div>
                            </div>
                        </div>

                        <button className="lc-add-sched-btn">+ Add</button>
                    </div>
                </div>

                <div className="lc-sched-list">
                    {SCHEDULE_ITEMS.map((item, idx) => (
                        <div
                            key={idx}
                            className={`lc-sched-row${activeItem === idx ? ' active' : ''}`}
                            onClick={() => setActiveItem(idx)}
                        >
                            <span className="lc-sr-icon">{item.icon}</span>
                            <div className="lc-sr-info">
                                <div className="lc-sr-name">{item.name}</div>
                            </div>
                            <div className="lc-sr-actions">
                                <button className="lc-sr-btn" title="Drag to reorder">
                                    <GripVertical />
                                </button>
                                <button className="lc-sr-btn remove" title="Remove">
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
                    {THEMES.map((theme, idx) => (
                        <div
                            key={idx}
                            className={`lc-theme-card${activeTheme === idx ? ' active' : ''}`}
                            style={{ background: theme.bg }}
                            onClick={() => setActiveTheme(idx)}
                        >
                            <span className="tc-label">{theme.name}</span>
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
                        {(['solid', 'gradient', 'image'] as ComposerType[]).map(t => (
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

                    {/* Image fields */}
                    {composerType === 'image' && (
                        <div className="lc-tc-image-zone">
                            <input type="file" accept="image/*" />
                            <span className="tz-icon">🖼️</span>
                            <div className="tz-hint">Click to upload — PNG or JPG</div>
                        </div>
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
                        <button className="lc-tc-save-btn">Add</button>
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

        </aside>
    );
}
