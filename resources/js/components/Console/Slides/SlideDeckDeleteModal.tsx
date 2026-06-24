import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { SlideDeck } from '@/pages/Console/Index';

interface Props {
    deck: SlideDeck;
    onClose: () => void;
}

export default function SlideDeckDeleteModal({ deck, onClose }: Props) {
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/console/slide-decks/${deck.id}`, {
            onFinish: () => { setProcessing(false); onClose(); },
        });
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal lc-modal-sm" onClick={e => e.stopPropagation()}>
                <div className="lc-modal-header">
                    <span>Delete Slide Deck</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="lc-modal-body">
                    <p className="lc-delete-desc">Delete <strong>"{deck.title}"</strong>?</p>
                    <p style={{ fontSize: '12px', color: 'var(--lc-text-muted)', margin: 0 }}>
                        All {deck.slide_count} slide image{deck.slide_count !== 1 ? 's' : ''} will be permanently removed. This cannot be undone.
                    </p>
                </div>
                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button className="lc-modal-btn danger" onClick={handleDelete} disabled={processing}>
                        {processing ? 'Deleting…' : 'Delete Deck'}
                    </button>
                </div>
            </div>
        </div>
    );
}
