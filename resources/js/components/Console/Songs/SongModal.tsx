import { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import CustomSelect from '@/components/Console/Shared/CustomSelect';
import type { SongFolder, SlideData } from '@/pages/Console/Index';

const TYPE_META = {
    verse:  { label: 'Verse',  badgeClass: 'lc-ib-verse',  bgClass: 'lc-tagged-verse',  name: 'Verse' },
    chorus: { label: 'Chorus',  badgeClass: 'lc-ib-chorus', bgClass: 'lc-tagged-chorus', name: 'Chorus' },
    pre:    { label: 'Pre-Chorus', badgeClass: 'lc-ib-pre',    bgClass: 'lc-tagged-pre',    name: 'Pre-Chorus' },
    bridge: { label: 'Bridge',  badgeClass: 'lc-ib-bridge', bgClass: 'lc-tagged-bridge', name: 'Bridge' },
    tag:    { label: 'Tag',  badgeClass: 'lc-ib-tag',    bgClass: 'lc-tagged-tag',    name: 'Tag' },
    outro:  { label: 'Outro',  badgeClass: 'lc-ib-outro',  bgClass: 'lc-tagged-outro',  name: 'Outro' },
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

function labelToType(label: string | null): TagType | null {
    if (!label) return null;
    if (label.startsWith('V')) return 'verse';
    if (label === 'C') return 'chorus';
    if (label === 'PC') return 'pre';
    if (label === 'B') return 'bridge';
    if (label === 'T') return 'tag';
    if (label === 'O') return 'outro';
    return null;
}

function escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildEditorHtml(slides: SlideData[]): string {
    return slides.map(slide => {
        const type = labelToType(slide.label);
        const inner = escHtml(slide.content).replace(/\n/g, '<br>');
        if (!type) return inner;
        const meta = TYPE_META[type];
        return `<span class="lc-tagged-section ${meta.bgClass}" data-type="${type}"><span class="lc-inline-badge ${meta.badgeClass}" contenteditable="false">${escHtml(slide.label ?? meta.label)}</span>${inner}</span>`;
    }).join('<br>');
}

export default function SongModal({ open, onClose, songFolders, editData }: Props) {
    const form = useForm({
        title:     '',
        author:    '',
        folder_id: songFolders[0]?.id?.toString() ?? '',
        theme_id:  '',
        slides:    [] as { label: string; content: string }[],
    });

    const editorRef = useRef<HTMLDivElement>(null);
    const [sections, setSections]         = useState<SectionChip[]>([]);
    const [hasSelection, setHasSelection] = useState(false);
    const [noSlidesError, setNoSlidesError] = useState(false);

    const updateSections = () => {
        const tagged = Array.from(editorRef.current?.querySelectorAll('.lc-tagged-section') ?? []);
        setSections(tagged.map(span => ({
            type: span.getAttribute('data-type') as TagType,
            badgeLabel: span.querySelector('.lc-inline-badge')?.textContent ?? '',
        })));
    };

    // Reset / pre-fill editor when modal opens
    useEffect(() => {
        if (!open || !editorRef.current) return;
        setSections([]);
        setHasSelection(false);
        setNoSlidesError(false);

        if (editData) {
            form.setData({
                title:     editData.title,
                author:    editData.author ?? '',
                folder_id: editData.folderId?.toString() ?? '',
                theme_id:  '',
                slides:    [],
            });
            editorRef.current.innerHTML = buildEditorHtml(editData.slides);
            updateSections();
        } else {
            form.reset();
            editorRef.current.innerHTML = '';
        }

        setTimeout(() => document.getElementById('lc-song-title')?.focus(), 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Track selection to enable/disable tag buttons
    useEffect(() => {
        const handler = () => {
            const sel = window.getSelection();
            setHasSelection(!!(sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)));
        };
        document.addEventListener('selectionchange', handler);
        return () => document.removeEventListener('selectionchange', handler);
    }, []);

    if (!open) return null;

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

        const range = sel.getRangeAt(0).cloneRange();
        const meta  = TYPE_META[type];

        const verseCount = editorRef.current.querySelectorAll('.lc-tagged-section[data-type="verse"]').length;
        const label = type === 'verse' ? 'Verse ' + (verseCount + 1) : meta.label;

        const badge = document.createElement('span');
        badge.className       = `lc-inline-badge ${meta.badgeClass}`;
        badge.textContent     = label;
        badge.contentEditable = 'false';

        const wrap = document.createElement('span');
        wrap.className    = `lc-tagged-section ${meta.bgClass}`;
        wrap.setAttribute('data-type', type);
        wrap.appendChild(badge);
        wrap.appendChild(range.extractContents());
        range.insertNode(wrap);

        sel.removeAllRanges();
        setHasSelection(false);
        renumberVerses();
        updateSections();
    };

    const handleEditorClick = (e: React.MouseEvent) => {
        const span = (e.target as HTMLElement).closest('.lc-tagged-section') as HTMLElement | null;
        if (!span) return;
        const badge = span.querySelector('.lc-inline-badge');
        if (badge) badge.remove();
        const parent = span.parentNode!;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        span.remove();
        renumberVerses();
        updateSections();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const extractSlides = () => {
        return Array.from(editorRef.current?.querySelectorAll('.lc-tagged-section') ?? []).map(span => {
            const badge = span.querySelector('.lc-inline-badge');
            const label = badge?.textContent ?? '';
            const clone = span.cloneNode(true) as HTMLElement;
            clone.querySelector('.lc-inline-badge')?.remove();
            return { label, content: clone.textContent?.trim() ?? '' };
        }).filter(s => s.content.length > 0);
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="lc-modal-backdrop" onClick={handleClose}>
            <div className="lc-modal lc-modal-song" onClick={e => e.stopPropagation()}>

                <div className="lc-modal-header">
                    <span>{isEdit ? 'Edit Song' : 'Add Song'}</span>
                    <button className="lc-modal-close" onClick={handleClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="lc-modal-body lc-modal-scrollable">

                        {/* ── Song meta ── */}
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

                        {/* ── Lyrics editor ── */}
                        <div className="lc-tag-instruction">
                            <strong>Paste your lyrics below.</strong> Select any lines, then click a section button to tag them — Verse auto-numbers (V1, V2…). Click a tagged block to remove its tag.
                        </div>

                        <div className="lc-tag-buttons">
                            {(Object.entries(TYPE_META) as [TagType, typeof TYPE_META[TagType]][]).map(([type, meta]) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`lc-tag-btn lc-tag-btn-${type}${hasSelection ? ' ready' : ''}`}
                                    onMouseDown={e => { e.preventDefault(); tagSelection(type); }}
                                >
                                    {meta.name}
                                </button>
                            ))}
                        </div>

                        <div
                            ref={editorRef}
                            className={`lc-lyrics-editor${noSlidesError ? ' error' : ''}`}
                            contentEditable
                            suppressContentEditableWarning
                            spellCheck={false}
                            data-placeholder="Paste your full song lyrics here…"
                            onClick={handleEditorClick}
                            onPaste={handlePaste}
                            onInput={updateSections}
                        />

                        {noSlidesError && (
                            <span className="lc-modal-error">Tag at least one section before saving.</span>
                        )}

                        {/* ── Sections summary ── */}
                        {sections.length > 0 && (
                            <div className="lc-sections-summary">
                                {sections.map((s, i) => (
                                    <div key={i} className="lc-section-chip">
                                        <span className={`lc-section-chip-badge lc-ib-${s.type}`}>{s.badgeLabel}</span>
                                        {TYPE_META[s.type].name}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    <div className="lc-modal-footer">
                        <button type="button" className="lc-modal-btn" onClick={handleClose}>Cancel</button>
                        <button type="submit" className="lc-modal-btn primary" disabled={form.processing}>
                            {form.processing ? 'Saving…' : isEdit ? 'Update Song' : 'Save Song'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
