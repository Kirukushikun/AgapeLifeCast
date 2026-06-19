import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import CustomSelect from '@/components/Console/Shared/CustomSelect';
import type { VerseFolder } from '@/pages/Console/Index';

interface VerseChunk {
    number: number | null;
    text: string;
}

interface SearchResult {
    reference: string;
    content: string;
    verses: VerseChunk[];
    version: string;
    testament: 'old' | 'new';
}

interface Props {
    open: boolean;
    onClose: () => void;
    verseFolders: VerseFolder[];
}

const VERSIONS = [
    { value: 'NIV', label: 'NIV — New International' },
    { value: 'TCB', label: 'TCB — Contemporary Bible' },
    { value: 'GNT', label: 'GNT — Good News' },
];

export default function BibleModal({ open, onClose, verseFolders }: Props) {
    const [version, setVersion]         = useState('NIV');
    const [reference, setReference]     = useState('');
    const [searching, setSearching]     = useState(false);
    const [result, setResult]           = useState<SearchResult | null>(null);
    const [error, setError]             = useState<string | null>(null);
    const [saving, setSaving]           = useState(false);
    const [folderId, setFolderId]       = useState('');

    // Manual entry mode
    const [manualMode, setManualMode]           = useState(false);
    const [manualRef, setManualRef]             = useState('');
    const [manualContent, setManualContent]     = useState('');
    const [manualTestament, setManualTestament] = useState<'old' | 'new'>('new');

    const inputRef       = useRef<HTMLInputElement>(null);
    const manualRefRef   = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setReference('');
            setResult(null);
            setError(null);
            setSaving(false);
            setFolderId('');
            setManualMode(false);
            setManualRef('');
            setManualContent('');
            setManualTestament('new');
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [open]);

    useEffect(() => {
        if (manualMode) {
            setTimeout(() => manualRefRef.current?.focus(), 60);
        }
    }, [manualMode]);

    if (!open) return null;

    const handleSearch = async () => {
        const ref = reference.trim();
        if (!ref) return;
        setSearching(true);
        setResult(null);
        setError(null);
        try {
            const res = await fetch(
                `/console/bible/search?reference=${encodeURIComponent(ref)}&version=${version}`,
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Search failed.');
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setSearching(false);
        }
    };

    const handleSave = () => {
        setSaving(true);
        if (manualMode) {
            router.post('/console/bible', {
                reference:   manualRef.trim(),
                content:     manualContent.trim(),
                translation: version,
                testament:   manualTestament,
                folder_id:   folderId || null,
            }, {
                onSuccess: () => { setSaving(false); onClose(); },
                onError:   () => setSaving(false),
            });
        } else {
            if (!result) return;
            router.post('/console/bible', {
                reference:   result.reference,
                content:     result.content,
                translation: result.version,
                testament:   result.testament,
                folder_id:   folderId || null,
            }, {
                onSuccess: () => { setSaving(false); onClose(); },
                onError:   () => setSaving(false),
            });
        }
    };

    const canSave = manualMode
        ? Boolean(manualRef.trim() && manualContent.trim())
        : Boolean(result);

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal lc-modal-bible" onClick={e => e.stopPropagation()}>

                <div className="lc-modal-header">
                    <span>📖 {manualMode ? 'Add Verse — Manual Entry' : 'Add Bible Verse'}</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="lc-modal-body">

                    {manualMode ? (
                        <>
                            <p className="lc-bible-instruction">
                                <strong>Type or paste the verse</strong> — fill in the reference,
                                pick a translation, mark the testament, then paste the text below.
                            </p>

                            <div className="lc-modal-field">
                                <label className="lc-modal-label">Reference</label>
                                <input
                                    ref={manualRefRef}
                                    className="lc-modal-input"
                                    type="text"
                                    placeholder="e.g. John 3:16"
                                    value={manualRef}
                                    onChange={e => setManualRef(e.target.value)}
                                />
                            </div>

                            <div className="lc-bible-manual-row">
                                <div className="lc-bible-version-wrap">
                                    <CustomSelect
                                        value={version}
                                        onChange={setVersion}
                                        options={VERSIONS}
                                    />
                                </div>
                                <div className="lc-bible-testament-wrap">
                                    <button
                                        type="button"
                                        className={`lc-testament-btn${manualTestament === 'old' ? ' active' : ''}`}
                                        onClick={() => setManualTestament('old')}
                                    >OT</button>
                                    <button
                                        type="button"
                                        className={`lc-testament-btn${manualTestament === 'new' ? ' active' : ''}`}
                                        onClick={() => setManualTestament('new')}
                                    >NT</button>
                                </div>
                            </div>

                            <div className="lc-modal-field">
                                <label className="lc-modal-label">Verse Text</label>
                                <textarea
                                    className="lc-modal-input lc-bible-manual-textarea"
                                    placeholder="Type or paste the verse text here…"
                                    value={manualContent}
                                    onChange={e => setManualContent(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="lc-bible-instruction">
                                <strong>Search a verse reference</strong> — type a book, chapter and verse
                                (e.g. <em>John 3:16</em> or <em>Psalm 23:1-3</em>), pick a translation,
                                then preview before saving.
                            </p>

                            <div className="lc-bible-search-row">
                                <div className="lc-bible-version-wrap">
                                    <CustomSelect
                                        value={version}
                                        onChange={setVersion}
                                        options={VERSIONS}
                                    />
                                </div>
                                <input
                                    ref={inputRef}
                                    className="lc-modal-input lc-bible-ref-input"
                                    type="text"
                                    placeholder="e.g. John 3:16 or Romans 8:28-30"
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                                />
                                <button
                                    className="lc-modal-btn primary lc-bible-search-btn"
                                    onClick={handleSearch}
                                    disabled={searching || !reference.trim()}
                                >
                                    {searching ? 'Searching…' : 'Search'}
                                </button>
                            </div>

                            <div className={`lc-bible-preview${result ? ' has-result' : ''}`}>
                                {!result && !error && !searching && (
                                    <div className="lc-bible-empty">
                                        <span className="bp-icon">📖</span>
                                        <p>Enter a verse reference above to preview it here</p>
                                    </div>
                                )}
                                {searching && (
                                    <div className="lc-bible-loading">Searching…</div>
                                )}
                                {error && !searching && (
                                    <div className="lc-bible-error">{error}</div>
                                )}
                                {result && !searching && (
                                    <div className="lc-bible-result">
                                        <div className="lc-bible-result-ref">{result.reference}</div>
                                        <div className="lc-bible-result-text">
                                            "
                                            {result.verses.map((v, i) => (
                                                <span key={i}>
                                                    {v.number !== null && (
                                                        <sup className="lc-verse-num">{v.number}</sup>
                                                    )}
                                                    {v.text}
                                                    {i < result.verses.length - 1 && ' '}
                                                </span>
                                            ))}
                                            "
                                        </div>
                                        <div className="lc-bible-result-meta">{result.version}</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Folder selection — always visible */}
                    <div className="lc-modal-field">
                        <label className="lc-modal-label">Save to Folder</label>
                        <CustomSelect
                            value={folderId}
                            onChange={setFolderId}
                            placeholder="No folder (root)"
                            options={verseFolders.map(f => ({ value: String(f.id), label: f.name }))}
                        />
                    </div>

                </div>

                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="lc-modal-btn"
                        onClick={() => setManualMode(m => !m)}
                    >
                        {manualMode ? '← Search' : 'Enter Manually'}
                    </button>
                    <button
                        className="lc-modal-btn primary"
                        onClick={handleSave}
                        disabled={!canSave || saving}
                    >
                        {saving ? 'Saving…' : 'Save to Library'}
                    </button>
                </div>

            </div>
        </div>
    );
}
