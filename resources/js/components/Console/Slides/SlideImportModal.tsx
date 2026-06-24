import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { UploadCloud, FileText, Image } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
}

type Mode = 'pdf' | 'images';

export default function SlideImportModal({ open, onClose }: Props) {
    const [mode, setMode]         = useState<Mode>('pdf');
    const [files, setFiles]       = useState<File[]>([]);
    const [title, setTitle]       = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setMode('pdf');
            setFiles([]);
            setTitle('');
            setUploading(false);
            setError(null);
        }
    }, [open]);

    if (!open) return null;

    const handleFiles = (picked: FileList | null) => {
        if (!picked || picked.length === 0) return;
        const arr = Array.from(picked);
        setFiles(arr);
        if (!title && arr[0]) setTitle(arr[0].name.replace(/\.[^.]+$/, ''));
        setError(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required.'); return; }
        if (files.length === 0) { setError('Please select a file.'); return; }

        setUploading(true);
        setError(null);

        const data = new FormData();
        data.append('title', title.trim());

        if (mode === 'pdf') {
            data.append('file', files[0]);
            router.post('/console/slide-decks', data, {
                forceFormData: true,
                onSuccess: () => onClose(),
                onError: (errs) => { setError(Object.values(errs)[0] as string); setUploading(false); },
                onFinish: () => setUploading(false),
            });
        } else {
            files.forEach(f => data.append('images[]', f));
            router.post('/console/slide-decks/images', data, {
                forceFormData: true,
                onSuccess: () => onClose(),
                onError: (errs) => { setError(Object.values(errs)[0] as string); setUploading(false); },
                onFinish: () => setUploading(false),
            });
        }
    };

    const accept = mode === 'pdf' ? '.pdf' : '.png,.jpg,.jpeg,.webp';
    const multiple = mode === 'images';
    const hint = mode === 'pdf'
        ? 'Drop a PDF file or click to browse'
        : 'Drop image files or click to browse (order = slide order)';

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal" onClick={e => e.stopPropagation()}>
                <div className="lc-modal-header">
                    <span className="lc-modal-title">Import Slide Deck</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="lc-modal-body">

                    {/* Mode toggle */}
                    <div className="lc-modal-field">
                        <label className="lc-modal-label">File type</label>
                        <div className="lc-slide-mode-toggle">
                            <button
                                type="button"
                                className={`lc-slide-mode-btn${mode === 'pdf' ? ' active' : ''}`}
                                onClick={() => { setMode('pdf'); setFiles([]); }}
                            >
                                <FileText size={14} /> PDF
                            </button>
                            <button
                                type="button"
                                className={`lc-slide-mode-btn${mode === 'images' ? ' active' : ''}`}
                                onClick={() => { setMode('images'); setFiles([]); }}
                            >
                                <Image size={14} /> Images
                            </button>
                        </div>
                    </div>

                    {/* Drop zone */}
                    <div
                        className="lc-upload-dropzone"
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <UploadCloud size={28} />
                        <span>{hint}</span>
                        {files.length > 0 && (
                            <span className="lc-upload-filenames">
                                {files.length === 1 ? files[0].name : `${files.length} files selected`}
                            </span>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept={accept}
                            multiple={multiple}
                            style={{ display: 'none' }}
                            onChange={e => handleFiles(e.target.files)}
                        />
                    </div>

                    {/* Title */}
                    <div className="lc-modal-field">
                        <label className="lc-modal-label">Title</label>
                        <input
                            type="text"
                            className="lc-modal-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Deck title"
                        />
                    </div>

                    {error && <p className="lc-modal-error">{error}</p>}

                    <div className="lc-modal-footer">
                        <button type="button" className="lc-modal-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="lc-modal-btn-primary" disabled={uploading}>
                            {uploading ? (mode === 'pdf' ? 'Uploading & processing…' : 'Uploading…') : 'Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
