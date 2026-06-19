import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { SavedVerse } from '@/pages/Console/Index';

interface Props {
    verse: SavedVerse;
    onClose: () => void;
}

export default function VerseDeleteModal({ verse, onClose }: Props) {
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/console/bible/${verse.id}`, {
            onFinish: () => { setProcessing(false); onClose(); },
        });
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal lc-modal-delete" onClick={e => e.stopPropagation()}>

                <div className="lc-modal-header">
                    <span>Delete Verse</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="lc-modal-body">
                    <p className="lc-delete-desc">
                        Are you sure you want to permanently delete{' '}
                        <strong>{verse.reference}</strong> ({verse.translation})?
                        This cannot be undone.
                    </p>
                </div>

                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="lc-modal-btn danger"
                        onClick={handleDelete}
                        disabled={processing}
                    >
                        {processing ? 'Deleting…' : 'Delete Verse'}
                    </button>
                </div>

            </div>
        </div>
    );
}
