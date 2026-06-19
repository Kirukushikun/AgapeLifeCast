import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { MediaFolder } from '@/pages/Console/Index';

interface Props {
    folder: MediaFolder;
    onClose: () => void;
}

export default function MediaFolderDeleteModal({ folder, onClose }: Props) {
    const [mode, setMode]           = useState<'keep' | 'delete'>('keep');
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/console/media-folders/${folder.id}`, {
            data: { delete_files: mode === 'delete' },
            onSuccess: () => { setProcessing(false); onClose(); },
            onError:   () => setProcessing(false),
        });
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal" onClick={e => e.stopPropagation()}>
                <div className="lc-modal-header">
                    <span>Delete Folder</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="lc-modal-body">
                    <p className="lc-modal-desc">
                        You are about to delete <strong>{folder.name}</strong>.
                        What should happen to the files inside?
                    </p>
                    <div className="lc-radio-group">
                        <label className="lc-radio-option">
                            <input type="radio" checked={mode === 'keep'} onChange={() => setMode('keep')} />
                            <span>Remove folder only — keep files (move to root)</span>
                        </label>
                        <label className="lc-radio-option">
                            <input type="radio" checked={mode === 'delete'} onChange={() => setMode('delete')} />
                            <span>Delete folder <strong>and all files</strong> inside</span>
                        </label>
                    </div>
                </div>
                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button className="lc-modal-btn danger" onClick={handleDelete} disabled={processing}>
                        {processing ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
