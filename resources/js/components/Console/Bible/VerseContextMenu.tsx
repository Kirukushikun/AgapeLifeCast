import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import type { SavedVerse, VerseFolder } from '@/pages/Console/Index';

interface Props {
    x: number;
    y: number;
    verse: SavedVerse;
    currentFolderId: number | null;
    verseFolders: VerseFolder[];
    onClose: () => void;
    onDelete: (verse: SavedVerse) => void;
}

export default function VerseContextMenu({ x, y, verse, currentFolderId, verseFolders, onClose, onDelete }: Props) {
    const menuRef     = useRef<HTMLDivElement>(null);
    const subRef      = useRef<HTMLDivElement>(null);
    const moveRef     = useRef<HTMLDivElement>(null);
    const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [subOpen, setSubOpen] = useState(false);
    const [subPos,  setSubPos]  = useState({ top: 0, left: 0 });
    const [pos, setPos]         = useState({ top: y, left: x });

    useEffect(() => {
        const el = menuRef.current;
        if (!el) return;
        const { innerWidth, innerHeight } = window;
        const { offsetWidth: w, offsetHeight: h } = el;
        setPos({
            top:  y + h > innerHeight ? y - h : y,
            left: x + w > innerWidth  ? x - w : x,
        });
    }, [x, y]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!menuRef.current?.contains(target) && !subRef.current?.contains(target)) {
                onClose();
            }
        };
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const openSub = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        const rect = moveRef.current?.getBoundingClientRect();
        if (!rect) return;
        setSubPos({ top: rect.top, left: rect.right + 2 });
        setSubOpen(true);
    };
    const scheduleSub = () => { closeTimer.current = setTimeout(() => setSubOpen(false), 150); };
    const cancelSub   = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setSubOpen(true); };

    const handleMove = (targetFolderId: number | null) => {
        router.patch(`/console/bible/${verse.id}/move`, { folder_id: targetFolderId });
        onClose();
    };

    const otherFolders = verseFolders.filter(f => f.id !== currentFolderId);
    const canMoveToRoot = currentFolderId !== null;

    return (
        <>
            <div ref={menuRef} className="lc-ctx-menu" style={{ top: pos.top, left: pos.left }}>
                <div
                    ref={moveRef}
                    className="lc-ctx-item lc-ctx-has-sub"
                    onMouseEnter={openSub}
                    onMouseLeave={scheduleSub}
                >
                    📁 Move to
                    <span className="lc-ctx-sub-arrow">›</span>
                </div>

                <div className="lc-ctx-sep" />

                <div className="lc-ctx-item lc-ctx-danger" onClick={() => { onDelete(verse); onClose(); }}>
                    🗑️ Delete
                </div>
            </div>

            {subOpen && (
                <div
                    ref={subRef}
                    className="lc-ctx-submenu"
                    style={{ top: subPos.top, left: subPos.left }}
                    onMouseEnter={cancelSub}
                    onMouseLeave={scheduleSub}
                >
                    {canMoveToRoot && (
                        <div className="lc-ctx-sub-item" onClick={() => handleMove(null)}>
                            📂 No folder (root)
                        </div>
                    )}
                    {otherFolders.map(f => (
                        <div key={f.id} className="lc-ctx-sub-item" onClick={() => handleMove(f.id)}>
                            📁 {f.name}
                        </div>
                    ))}
                    {otherFolders.length === 0 && !canMoveToRoot && (
                        <div className="lc-ctx-sub-item lc-ctx-sub-empty">No other folders</div>
                    )}
                </div>
            )}
        </>
    );
}
