import { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import CustomSelect from '@/components/Console/Shared/CustomSelect';
import type { SongFolder, SlideData } from '@/pages/Console/Index';

const TYPE_META = {
    verse:  { label: 'Verse',      badgeClass: 'lc-ib-verse',  bgClass: 'lc-tagged-verse',  name: 'Verse',      key: 'V' },
    chorus: { label: 'Chorus',     badgeClass: 'lc-ib-chorus', bgClass: 'lc-tagged-chorus', name: 'Chorus',     key: 'C' },
    pre:    { label: 'Pre-Chorus', badgeClass: 'lc-ib-pre',    bgClass: 'lc-tagged-pre',    name: 'Pre-Chorus', key: 'P' },
    bridge: { label: 'Bridge',     badgeClass: 'lc-ib-bridge', bgClass: 'lc-tagged-bridge', name: 'Bridge',     key: 'B' },
    tag:    { label: 'Tag',        badgeClass: 'lc-ib-tag',    bgClass: 'lc-tagged-tag',    name: 'Tag',        key: 'T' },
    outro:  { label: 'Outro',      badgeClass: 'lc-ib-outro',  bgClass: 'lc-tagged-outro',  name: 'Outro',      key: 'O' },
} as const;

type TagType = keyof typeof TYPE_META;
interface SectionChip { type: TagType; badgeLabel: string; }

export interface EditSongData {
    id: number;
    title: string;
    author: string | null;
    folderId: number | null;
    slides: SlideData[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    songFolders: SongFolder[];
    editData?: EditSongData;
}

const KEY_MAP: Partial<Record<string, TagType>> = {
    v: 'verse', c: 'chorus', p: 'pre', b: 'bridge', t: 'tag', o: 'outro',
};

function labelToType(label: string | null): TagType | null {
    if (!label) return null;
    if (label.startsWith('V') || label === 'Verse') return 'verse';
    if (label === 'C' || label === 'Chorus') return 'chorus';
    if (label === 'PC' || label === 'Pre-Chorus') return 'pre';
    if (label === 'B' || label === 'Bridge') return 'bridge';
    if (label === 'T' || label === 'Tag') return 'tag';
    if (label === 'O' || label === 'Outro') return 'outro';
    return null;
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEditorHtml(slides: SlideData[]): string {
    return slides.map(slide => {
        const type  = labelToType(slide.label);
        const inner = escHtml(slide.content).replace(/\n/g, '<br>');
        if (!type) return inner;
        const meta = TYPE_META[type];
        return `<span class="lc-tagged-section ${meta.bgClass}" data-type="${type}"><span class="lc-inline-badge ${meta.badgeClass}" contenteditable="false">${escHtml(slide.label ?? meta.label)}</span>${inner}</span>`;
    }).join('<br>');
}

function domToText(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeName === 'BR') return '\n';
    if (node.nodeType === Node.ELEMENT_NODE) {
        const inner = Array.from(node.childNodes).map(domToText).join('');
        const tag   = (node as HTMLElement).tagName;
        return (tag === 'DIV' || tag === 'P') ? inner + '\n' : inner;
    }
    return '';
}

export default function SongModal({ open, onClose, songFolders, editData }: Props) {
    const form = useForm({
        title:     '',
        author:    '',
        folder_id: songFolders[0]?.id?.toString() ?? '',
        theme_id:  '',
        slides:    [] as { label: string; content: string }[],
    });

    const editorRef     = useRef<HTMLDivElement>(null);
    const editorHtmlRef = useRef('');

    const [step, setStep]                     = useState<1 | 2>(1);
    const [sections, setSections]             = useState<SectionChip[]>([]);
    const [hasSelection, setHasSelection]     = useState(false);
    const [noSlidesError, setNoSlidesError]   = useState(false);
    const [retagMenu, setRetagMenu]           = useState<{ el: HTMLElement; x: number; y: number } | null>(null);
    const [dragIdx, setDragIdx]               = useState<number | null>(null);
    const [dropIdx, setDropIdx]               = useState<number | null>(null);

    const updateSections = () => {
        const tagged = Array.from(editorRef.current?.querySelectorAll('.lc-tagged-section') ?? []);
        setSections(tagged.map(span => ({
            type:       span.getAttribute('data-type') as TagType,
            badgeLabel: span.querySelector('.lc-inline-badge')?.textContent ?? '',
        })));
    };

    // Reset when modal opens — skip step 1 for edits since metadata is already known
    useEffect(() => {
        if (!open) return;
        setStep(editData ? 2 : 1);
        setSections([]);
        setHasSelection(false);
        setNoSlidesError(false);
        setRetagMenu(null);
        editorHtmlRef.current = editData ? buildEditorHtml(editData.slides) : '';

        if (editData) {
            form.setData({
                title:     editData.title,
                author:    editData.author ?? '',
                folder_id: editData.folderId?.toString() ?? '',
                theme_id:  '',
                slides:    [],
            });
        } else {
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Populate editor whenever step becomes 2
    useEffect(() => {
        if (step !== 2 || !editorRef.current) return;
        editorRef.current.innerHTML = editorHtmlRef.current;
        updateSections();
        setTimeout(() => editorRef.current?.focus(), 50);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Track text selection to enable tag buttons / keyboard shortcuts
    useEffect(() => {
        const handler = () => {
            const sel = window.getSelection();
            setHasSelection(!!(sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)));
        };
        document.addEventListener('selectionchange', handler);
        return () => document.removeEventListener('selectionchange', handler);
    }, []);

    // Close retag menu when clicking outside it
    useEffect(() => {
        if (!retagMenu) return;
        const close = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.lc-retag-menu')) setRetagMenu(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [retagMenu]);

    if (!open) return null;

    // ── Helpers ──

    const renumberVerses = () => {
        let vc = 0;
        editorRef.current?.querySelectorAll('.lc-tagged-section[data-type="verse"]').forEach(span => {
            const badge = span.querySelector('.lc-inline-badge');
            if (badge) badge.textContent = 'Verse ' + (++vc);
        });
    };

    const tagSelection = (type: TagType) => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) return;

        const range  = sel.getRangeAt(0).cloneRange();
        const meta   = TYPE_META[type];
        const count  = editorRef.current.querySelectorAll('.lc-tagged-section[data-type="verse"]').length;
        const label  = type === 'verse' ? 'Verse ' + (count + 1) : meta.label;

        const badge           = document.createElement('span');
        badge.className       = `lc-inline-badge ${meta.badgeClass}`;
        badge.textContent     = label;
        badge.contentEditable = 'false';

        const wrap = document.createElement('span');
        wrap.className = `lc-tagged-section ${meta.bgClass}`;
        wrap.setAttribute('data-type', type);
        wrap.appendChild(badge);
        wrap.appendChild(range.extractContents());
        range.insertNode(wrap);

        sel.removeAllRanges();
        setHasSelection(false);
        renumberVerses();
        updateSections();
    };

    const applyRetag = (type: TagType) => {
        if (!retagMenu) return;
        const span = retagMenu.el;
        const meta = TYPE_META[type];
        span.className = `lc-tagged-section ${meta.bgClass}`;
        span.setAttribute('data-type', type);
        const badge = span.querySelector('.lc-inline-badge');
        if (badge) {
            badge.className = `lc-inline-badge ${meta.badgeClass}`;
            if (type !== 'verse') badge.textContent = meta.label;
        }
        renumberVerses();
        updateSections();
        setRetagMenu(null);
    };

    const removeTag = () => {
        if (!retagMenu) return;
        const span = retagMenu.el;
        const badge = span.querySelector('.lc-inline-badge');
        if (badge) badge.remove();
        const parent = span.parentNode!;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        span.remove();
        renumberVerses();
        updateSections();
        setRetagMenu(null);
    };

    // Clicking a badge opens the retag menu; clicking the section body just places the cursor
    const handleEditorClick = (e: React.MouseEvent) => {
        const badge = (e.target as HTMLElement).closest('.lc-inline-badge') as HTMLElement | null;
        if (!badge) return;
        e.preventDefault();
        const section = badge.closest('.lc-tagged-section') as HTMLElement | null;
        if (!section) return;
        const rect = badge.getBoundingClientRect();
        setRetagMenu({ el: section, x: rect.left, y: rect.bottom + 6 });
    };

    // Paste as plain text, converting \n → <br> so line breaks survive in the editor
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const frag = document.createDocumentFragment();
        text.split('\n').forEach((line, i) => {
            if (i > 0) frag.appendChild(document.createElement('br'));
            if (line) frag.appendChild(document.createTextNode(line));
        });
        range.insertNode(frag);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    };

    // Keyboard shortcuts: V C P B T O when text is selected in the editor
    const handleEditorKeyDown = (e: React.KeyboardEvent) => {
        if (!hasSelection || e.ctrlKey || e.metaKey || e.altKey) return;
        const type = KEY_MAP[e.key.toLowerCase()];
        if (type) { e.preventDefault(); tagSelection(type); }
    };

    const extractSlides = () =>
        Array.from(editorRef.current?.querySelectorAll('.lc-tagged-section') ?? []).map(span => {
            const badge = span.querySelector('.lc-inline-badge');
            const label = badge?.textContent ?? '';
            const clone = span.cloneNode(true) as HTMLElement;
            clone.querySelector('.lc-inline-badge')?.remove();
            const content = Array.from(clone.childNodes).map(domToText).join('').trim();
            return { label, content };
        }).filter(s => s.content.length > 0);

    const reorderSections = (from: number, to: number) => {
        const slides = extractSlides();
        if (from < 0 || to < 0 || from >= slides.length || to >= slides.length) return;
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        if (editorRef.current) {
            editorRef.current.innerHTML = buildEditorHtml(slides);
            renumberVerses();
            updateSections();
        }
    };

    const handleNext = () => {
        if (!form.data.title.trim()) {
            form.setError('title', 'Title is required');
            return;
        }
        form.clearErrors('title');
        setStep(2);
    };

    const handleBack = () => {
        editorHtmlRef.current = editorRef.current?.innerHTML ?? '';
        setStep(1);
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const handleSubmit = () => {
        const slides = extractSlides();
        if (slides.length === 0) { setNoSlidesError(true); return; }
        setNoSlidesError(false);
        form.transform(data => ({ ...data, slides }));
        if (editData) {
            form.patch(`/console/songs/${editData.id}`, { onSuccess: handleClose });
        } else {
            form.post('/console/songs', { onSuccess: handleClose });
        }
    };

    const isEdit = !!editData;

    return (
        <div className="lc-modal-backdrop" onClick={step === 1 ? handleClose : undefined}>
            <div
                className={`lc-modal lc-modal-song${step === 2 ? ' lc-modal-song-editor' : ''}`}
                onClick={e => e.stopPropagation()}
            >

                {/* Header */}
                <div className="lc-modal-header">
                    {step === 2 ? (
                        <div className="lc-modal-editor-heading">
                            <span className="lc-modal-editor-label">Lyrics Editor</span>
                            <span className="lc-modal-editor-song-name">{form.data.title || editData?.title}</span>
                        </div>
                    ) : (
                        <span>{isEdit ? 'Edit Song' : 'New Song'}</span>
                    )}
                    <button className="lc-modal-close" onClick={handleClose}>✕</button>
                </div>

                {/* ── Step 1: Song Details ── */}
                {step === 1 && (
                    <div className="lc-modal-body">
                        <div className="lc-form-cols">
                            <div className="lc-form-row">
                                <label className="lc-modal-label">Title *</label>
                                <input
                                    id="lc-song-title"
                                    className={`lc-modal-input${form.errors.title ? ' error' : ''}`}
                                    type="text"
                                    placeholder="e.g. Amazing Grace"
                                    value={form.data.title}
                                    onChange={e => form.setData('title', e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleNext(); } }}
                                    autoFocus
                                />
                                {form.errors.title && <span className="lc-modal-error">{form.errors.title}</span>}
                            </div>
                            <div className="lc-form-row">
                                <label className="lc-modal-label">Author</label>
                                <input
                                    className="lc-modal-input"
                                    type="text"
                                    placeholder="e.g. John Newton"
                                    value={form.data.author}
                                    onChange={e => form.setData('author', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="lc-form-row">
                            <label className="lc-modal-label">Folder</label>
                            <CustomSelect
                                value={form.data.folder_id}
                                onChange={v => form.setData('folder_id', v)}
                                placeholder="— No folder —"
                                hasError={!!form.errors.folder_id}
                                options={songFolders.map(f => ({ value: String(f.id), label: f.name }))}
                            />
                            {form.errors.folder_id && <span className="lc-modal-error">{form.errors.folder_id}</span>}
                        </div>
                    </div>
                )}

                {/* ── Step 2: Lyrics Editor ── */}
                {step === 2 && (
                    <div className="lc-song-editor-body">

                        <div className="lc-song-editor-toolbar">
                            <p className="lc-song-editor-instruct">
                                Select lines → click or press a key to tag. Click a badge to change type. Drag chips to reorder.
                            </p>
                            <div className="lc-tag-buttons">
                                {(Object.entries(TYPE_META) as [TagType, typeof TYPE_META[TagType]][]).map(([type, meta]) => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={`lc-tag-btn lc-tag-btn-${type}${hasSelection ? ' ready' : ''}`}
                                        onMouseDown={e => { e.preventDefault(); tagSelection(type); }}
                                    >
                                        {meta.name} <kbd className="lc-tag-kbd">{meta.key}</kbd>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div
                            ref={editorRef}
                            className={`lc-lyrics-editor lc-lyrics-editor-full${noSlidesError ? ' error' : ''}`}
                            contentEditable
                            suppressContentEditableWarning
                            spellCheck={false}
                            data-placeholder="Paste your full song lyrics here…"
                            onClick={handleEditorClick}
                            onKeyDown={handleEditorKeyDown}
                            onPaste={handlePaste}
                            onInput={updateSections}
                        />

                        {noSlidesError && (
                            <span className="lc-modal-error">Tag at least one section before saving.</span>
                        )}

                        {sections.length > 0 && (
                            <div className="lc-sections-summary">
                                {sections.map((s, i) => (
                                    <div
                                        key={i}
                                        className={`lc-section-chip${dropIdx === i && dragIdx !== null && dragIdx !== i ? ' lc-chip-drop' : ''}`}
                                        draggable
                                        onDragStart={() => setDragIdx(i)}
                                        onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
                                        onDragLeave={() => setDropIdx(null)}
                                        onDrop={e => {
                                            e.preventDefault();
                                            if (dragIdx !== null && dragIdx !== i) reorderSections(dragIdx, i);
                                            setDragIdx(null);
                                            setDropIdx(null);
                                        }}
                                        onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                                    >
                                        <span className="lc-chip-drag-handle" aria-hidden>⠿</span>
                                        <span className={`lc-section-chip-badge lc-ib-${s.type}`}>{s.badgeLabel}</span>
                                        {TYPE_META[s.type].name}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                )}

                {/* Retag context menu — click a badge to open */}
                {retagMenu && (
                    <div
                        className="lc-retag-menu"
                        style={{ left: retagMenu.x, top: retagMenu.y }}
                    >
                        {(Object.entries(TYPE_META) as [TagType, typeof TYPE_META[TagType]][]).map(([type, meta]) => (
                            <button
                                key={type}
                                className={`lc-retag-menu-btn lc-retag-btn-${type}`}
                                onMouseDown={e => { e.preventDefault(); applyRetag(type); }}
                            >
                                {meta.name}
                            </button>
                        ))}
                        <div className="lc-retag-menu-sep" />
                        <button
                            className="lc-retag-menu-btn lc-retag-btn-remove"
                            onMouseDown={e => { e.preventDefault(); removeTag(); }}
                        >
                            Remove tag
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="lc-modal-footer">
                    {step === 1 ? (
                        <>
                            <button type="button" className="lc-modal-btn" onClick={handleClose}>Cancel</button>
                            <button type="button" className="lc-modal-btn primary" onClick={handleNext}>
                                Lyrics →
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="lc-modal-btn" onClick={handleBack}>← Back</button>
                            <button
                                type="button"
                                className="lc-modal-btn primary"
                                disabled={form.processing}
                                onClick={handleSubmit}
                            >
                                {form.processing ? 'Saving…' : isEdit ? 'Update Song' : 'Save Song'}
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
