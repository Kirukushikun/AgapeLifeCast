import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import type { MediaFile, MediaFolder } from '@/pages/Console/Index';

interface Props {
    x: number;
    y: number;
    file: MediaFile;
    currentFolderId: number | null;
    mediaFolders: MediaFolder[];
    onClose: () => void;
    onDelete: (file: MediaFile) => void;
}

export default function MediaContextMenu({ x, y, file, currentFolderId, mediaFolders, onClose, onDelete }: Props) {
    const [showMove, setShowMove] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const moveToFolder = (folderId: number | null) => {
        router.patch(`/console/media/${file.id}/move`, { folder_id: folderId });
        onClose();
    };

    const moveFolderOptions: { id: number | null; name: string }[] = [
        ...(currentFolderId !== null ? [{ id: null, name: 'No folder (root)' }] : []),
        ...mediaFolders.filter(f => f.id !== currentFolderId),
    ];

    return (
        <div ref={ref} className="lc-ctx-menu" style={{ top: y, left: x }}>
            {moveFolderOptions.length > 0 && (
                <div
                    className="lc-ctx-item has-sub"
                    onMouseEnter={() => setShowMove(true)}
                    onMouseLeave={() => setShowMove(false)}
                >
                    <span>Move to…</span>
                    <span className="lc-ctx-arrow">▶</span>
                    {showMove && (
                        <div className="lc-ctx-sub">
                            {moveFolderOptions.map(opt => (
                                <div
                                    key={opt.id ?? 'root'}
                                    className="lc-ctx-item"
                                    onClick={() => moveToFolder(opt.id)}
                                >
                                    {opt.id === null ? '📂 No folder (root)' : `📁 ${opt.name}`}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="lc-ctx-divider" />
            <div className="lc-ctx-item danger" onClick={() => onDelete(file)}>
                Delete
            </div>
        </div>
    );
}
