import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { MediaFile } from '@/pages/Console/Index';

interface Props {
    file: MediaFile;
    onClose: () => void;
}

export default function MediaDeleteModal({ file, onClose }: Props) {
    const [processing, setProcessing] = useState(false);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/console/media/${file.id}`, {
            onSuccess: () => { setProcessing(false); onClose(); },
            onError:   () => setProcessing(false),
        });
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal" onClick={e => e.stopPropagation()}>
                <div className="lc-modal-header">
                    <span>Delete Media File</span>
                    <button className="lc-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="lc-modal-body">
                    <p className="lc-modal-desc">
                        Are you sure you want to delete <strong>{file.title}</strong>?
                        The file will be permanently removed from storage.
                    </p>
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
