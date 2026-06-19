import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import CustomSelect from '@/components/Console/Shared/CustomSelect';
import type { MediaFolder } from '@/pages/Console/Index';

interface Props {
    open: boolean;
    onClose: () => void;
    mediaFolders: MediaFolder[];
}

export default function MediaUploadModal({ open, onClose, mediaFolders }: Props) {
    const [file, setFile]         = useState<File | null>(null);
    const [title, setTitle]       = useState('');
    const [folderId, setFolderId] = useState('');
    const [isLooping, setIsLooping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setFile(null);
            setTitle('');
            setFolderId('');
            setIsLooping(false);
            setUploading(false);
            setError(null);
        }
    }, [open]);

    if (!open) return null;

    const handleFile = (picked: File) => {
        setFile(picked);
        if (!title) setTitle(picked.name.replace(/\.[^.]+$/, ''));
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleUpload = () => {
        if (!file || !title.trim()) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title.trim());
        if (folderId) formData.append('folder_id', folderId);
        formData.append('is_looping', isLooping ? '1' : '0');

        router.post('/console/media', formData as never, {
            forceFormData: true,
            onSuccess: () => { setUploading(false); onClose(); },
            onError: (errs) => {
                setUploading(false);
                const first = Object.values(errs)[0];
                setError(typeof first === 'string' ? first : 'Upload failed.');
            },
        });
    };

    const isAV = file && (file.type.startsWith('video/') || file.type.startsWith('audio/'));

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal" onClick={e => e.stopPropagation()}>

                <div className="lc-modal-header">
                    <span>🎬 Import Media</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="lc-modal-body">

                    <div
                        className={`lc-upload-zone${file ? ' has-file' : ''}`}
                        onClick={() => inputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <span className="lc-upload-filename">{file.name}</span>
                        ) : (
                            <>
                                <span className="lc-upload-icon">📁</span>
                                <span className="lc-upload-hint">Click or drop a file here</span>
                                <span className="lc-upload-types">Images · Videos · Audio (max 100 MB)</span>
                            </>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*,video/*,audio/*"
                            style={{ display: 'none' }}
                            onChange={handleInputChange}
                        />
                    </div>

                    {error && <p className="lc-modal-error" style={{ marginTop: 8 }}>{error}</p>}

                    <div className="lc-modal-field">
                        <label className="lc-modal-label">Title</label>
                        <input
                            className="lc-modal-input"
                            type="text"
                            placeholder="File title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="lc-modal-field">
                        <label className="lc-modal-label">Save to Folder</label>
                        <CustomSelect
                            value={folderId}
                            onChange={setFolderId}
                            placeholder="No folder (root)"
                            options={mediaFolders.map(f => ({ value: String(f.id), label: f.name }))}
                        />
                    </div>

                    {isAV && (
                        <label className="lc-modal-checkbox">
                            <input
                                type="checkbox"
                                checked={isLooping}
                                onChange={e => setIsLooping(e.target.checked)}
                            />
                            Loop playback
                        </label>
                    )}

                </div>

                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="lc-modal-btn primary"
                        onClick={handleUpload}
                        disabled={!file || !title.trim() || uploading}
                    >
                        {uploading ? 'Uploading…' : 'Upload to Library'}
                    </button>
                </div>

            </div>
        </div>
    );
}
