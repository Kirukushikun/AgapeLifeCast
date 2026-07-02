import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { X, Check, AlertCircle, Loader } from 'lucide-react';
import CustomSelect from '@/components/Console/Shared/CustomSelect';
import type { MediaFolder } from '@/pages/Console/Index';

interface FileEntry {
    key: string;
    file: File;
    title: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    progress: number;
    error?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    mediaFolders: MediaFolder[];
}

function getXsrfToken(): string {
    return decodeURIComponent(
        document.cookie
            .split('; ')
            .find(r => r.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? ''
    );
}

function fileIcon(file: File): string {
    if (file.type.startsWith('video/')) return '🎬';
    if (file.type.startsWith('audio/')) return '🎧';
    return '🖼️';
}

function fileSizeMB(file: File): string {
    return (file.size / 1024 / 1024).toFixed(1) + ' MB';
}

export default function MediaUploadModal({ open, onClose, mediaFolders }: Props) {
    const [entries, setEntries]     = useState<FileEntry[]>([]);
    const [folderId, setFolderId]   = useState('');
    const [isLooping, setIsLooping] = useState(false);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const xhrRef   = useRef<XMLHttpRequest | null>(null);

    useEffect(() => {
        if (open) {
            setEntries([]);
            setFolderId('');
            setIsLooping(false);
            setUploading(false);
        }
        return () => { if (!open) xhrRef.current?.abort(); };
    }, [open]);

    if (!open) return null;

    const addFiles = (files: FileList | File[]) => {
        const arr = Array.from(files);
        setEntries(prev => [
            ...prev,
            ...arr.map(f => ({
                key:      `${Date.now()}-${Math.random()}`,
                file:     f,
                title:    f.name.replace(/\.[^.]+$/, ''),
                status:   'pending' as const,
                progress: 0,
            })),
        ]);
    };

    const removeEntry = (key: string) => {
        setEntries(prev => prev.filter(e => e.key !== key));
    };

    const updateTitle = (key: string, title: string) => {
        setEntries(prev => prev.map(e => e.key === key ? { ...e, title } : e));
    };

    const updateEntry = (key: string, patch: Partial<FileEntry>) => {
        setEntries(prev => prev.map(e => e.key === key ? { ...e, ...patch } : e));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    };

    const runQueue = (
        queue: { key: string; formData: FormData }[],
        idx: number,
        errorCount: number,
    ) => {
        if (idx >= queue.length) {
            setUploading(false);
            xhrRef.current = null;
            router.reload();
            if (errorCount === 0) onClose();
            return;
        }

        const { key, formData } = queue[idx];
        updateEntry(key, { status: 'uploading', progress: 0 });

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', ev => {
            if (ev.lengthComputable) {
                updateEntry(key, { progress: Math.round((ev.loaded / ev.total) * 100) });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 400) {
                updateEntry(key, { status: 'done', progress: 100 });
                runQueue(queue, idx + 1, errorCount);
            } else {
                let msg = 'Upload failed';
                try {
                    const body = JSON.parse(xhr.responseText);
                    msg = body.errors?.file?.[0] ?? body.message ?? msg;
                } catch { /* ignore */ }
                updateEntry(key, { status: 'error', error: msg });
                runQueue(queue, idx + 1, errorCount + 1);
            }
        });

        xhr.addEventListener('error', () => {
            updateEntry(key, { status: 'error', error: 'Network error' });
            runQueue(queue, idx + 1, errorCount + 1);
        });

        xhr.open('POST', '/console/media');
        xhr.setRequestHeader('X-XSRF-TOKEN', getXsrfToken());
        xhr.setRequestHeader('Accept', 'application/json, text/html, */*');
        xhr.send(formData);
    };

    const handleUploadAll = () => {
        const pending = entries.filter(e => e.status === 'pending');
        if (pending.length === 0) return;

        const queue = pending.map(e => {
            const fd = new FormData();
            fd.append('file', e.file);
            fd.append('title', e.title.trim() || e.file.name);
            if (folderId) fd.append('folder_id', folderId);
            fd.append('is_looping', isLooping ? '1' : '0');
            return { key: e.key, formData: fd };
        });

        setUploading(true);
        runQueue(queue, 0, 0);
    };

    const handleCancel = () => {
        xhrRef.current?.abort();
        onClose();
    };

    const pendingCount  = entries.filter(e => e.status === 'pending').length;
    const doneCount     = entries.filter(e => e.status === 'done').length;
    const errorCount    = entries.filter(e => e.status === 'error').length;
    const hasAV         = entries.some(e => e.file.type.startsWith('video/') || e.file.type.startsWith('audio/'));
    const allFinished   = uploading && pendingCount === 0 && entries.every(e => e.status !== 'uploading');

    return (
        <div className="lc-modal-backdrop" onClick={!uploading ? onClose : undefined}>
            <div className="lc-modal lc-upload-modal" onClick={e => e.stopPropagation()}>

                <div className="lc-modal-header">
                    <span>🎬 Import Media</span>
                    <button className="lc-modal-close" onClick={handleCancel} disabled={uploading}>✕</button>
                </div>

                <div className="lc-modal-body">

                    {/* Drop zone */}
                    <div
                        className={`lc-upload-zone${entries.length > 0 ? ' compact' : ''}`}
                        onClick={() => !uploading && inputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={!uploading ? handleDrop : undefined}
                    >
                        {entries.length === 0 ? (
                            <>
                                <span className="lc-upload-icon">📁</span>
                                <span className="lc-upload-hint">Click or drop files here</span>
                                <span className="lc-upload-types">Images · Videos · Audio · Multiple files OK</span>
                            </>
                        ) : (
                            <span className="lc-upload-hint" style={{ fontSize: '.78rem' }}>
                                + Add more files
                            </span>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*,video/*,audio/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* File queue */}
                    {entries.length > 0 && (
                        <div className="lc-upload-queue">
                            {entries.map(e => (
                                <div key={e.key} className={`lc-uq-row lc-uq-${e.status}`}>
                                    <span className="lc-uq-icon">{fileIcon(e.file)}</span>

                                    <div className="lc-uq-info">
                                        <input
                                            className="lc-uq-title"
                                            value={e.title}
                                            onChange={ev => updateTitle(e.key, ev.target.value)}
                                            disabled={e.status !== 'pending'}
                                            placeholder="Title"
                                        />
                                        <span className="lc-uq-meta">
                                            {fileSizeMB(e.file)}
                                            {e.status === 'uploading' && ` · ${e.progress}%`}
                                            {e.status === 'error' && ` · ${e.error}`}
                                        </span>
                                    </div>

                                    {e.status === 'uploading' && (
                                        <div className="lc-uq-progress-wrap">
                                            <div className="lc-uq-progress-bar" style={{ width: `${e.progress}%` }} />
                                        </div>
                                    )}

                                    <div className="lc-uq-status">
                                        {e.status === 'uploading' && <Loader size={13} className="lc-uq-spin" />}
                                        {e.status === 'done'      && <Check size={13} />}
                                        {e.status === 'error'     && <AlertCircle size={13} title={e.error} />}
                                    </div>

                                    {e.status === 'pending' && (
                                        <button className="lc-uq-remove" onClick={() => removeEntry(e.key)}>
                                            <X size={11} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Shared settings */}
                    {entries.length > 0 && (
                        <>
                            <div className="lc-modal-field">
                                <label className="lc-modal-label">Save to Folder</label>
                                <CustomSelect
                                    value={folderId}
                                    onChange={setFolderId}
                                    placeholder="No folder (root)"
                                    options={mediaFolders.map(f => ({ value: String(f.id), label: f.name }))}
                                />
                            </div>

                            {hasAV && (
                                <label className="lc-modal-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={isLooping}
                                        onChange={e => setIsLooping(e.target.checked)}
                                        disabled={uploading}
                                    />
                                    Loop playback
                                </label>
                            )}
                        </>
                    )}

                    {/* Summary when done */}
                    {allFinished && errorCount > 0 && (
                        <p className="lc-modal-error" style={{ marginTop: 6 }}>
                            {errorCount} file{errorCount > 1 ? 's' : ''} failed — others were saved. You can close this.
                        </p>
                    )}

                </div>

                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={handleCancel}>
                        {uploading ? 'Cancel' : 'Close'}
                    </button>

                    {pendingCount > 0 && (
                        <button
                            className="lc-modal-btn primary"
                            onClick={handleUploadAll}
                            disabled={uploading || pendingCount === 0}
                        >
                            {uploading
                                ? `Uploading… (${doneCount + errorCount}/${entries.length})`
                                : `Upload ${pendingCount} file${pendingCount > 1 ? 's' : ''}`}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
