import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { SlideDeckFolder } from '@/pages/Console/Index';

interface Props {
    folder: SlideDeckFolder;
    onClose: () => void;
}

export default function SlideDeckFolderDeleteModal({ folder, onClose }: Props) {
    const [mode, setMode]           = useState<'keep' | 'delete'>('keep');
    const [processing, setProcessing] = useState(false);
    const count = folder.decks.length;

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/console/slide-deck-folders/${folder.id}`, {
            data: { delete_decks: mode === 'delete' },
            onFinish: () => { setProcessing(false); onClose(); },
        });
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal lc-modal-delete" onClick={e => e.stopPropagation()}>
                <div className="lc-modal-header">
                    <span>Delete Folder</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="lc-modal-body">
                    <p className="lc-delete-desc">
                        <strong>"{folder.name}"</strong> contains <strong>{count} deck{count !== 1 ? 's' : ''}</strong>.
                        {' '}What would you like to do?
                    </p>
                    <div className="lc-delete-options">
                        <label className={`lc-delete-option${mode === 'keep' ? ' selected' : ''}`}>
                            <input type="radio" name="slide-folder-delete" value="keep" checked={mode === 'keep'} onChange={() => setMode('keep')} />
                            <div className="lc-do-body">
                                <div className="lc-do-title">Remove folder only</div>
                                <div className="lc-do-desc">Decks inside become uncategorized and stay in your library.</div>
                            </div>
                        </label>
                        <label className={`lc-delete-option lc-do-danger${mode === 'delete' ? ' selected' : ''}`}>
                            <input type="radio" name="slide-folder-delete" value="delete" checked={mode === 'delete'} onChange={() => setMode('delete')} />
                            <div className="lc-do-body">
                                <div className="lc-do-title">Delete folder and all decks</div>
                                <div className="lc-do-desc">All {count} deck{count !== 1 ? 's' : ''} and their slide images will be permanently deleted.</div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button
                        className={`lc-modal-btn${mode === 'delete' ? ' danger' : ' warning'}`}
                        onClick={handleDelete}
                        disabled={processing}
                    >
                        {processing ? 'Deleting…' : mode === 'delete' ? 'Delete All' : 'Remove Folder'}
                    </button>
                </div>
            </div>
        </div>
    );
}
