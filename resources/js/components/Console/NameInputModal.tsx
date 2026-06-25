import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
    title: string;
    label: string;
    initialValue?: string;
    placeholder?: string;
    confirmLabel?: string;
    onConfirm: (value: string) => void;
    onClose: () => void;
}

export default function NameInputModal({
    title,
    label,
    initialValue = '',
    placeholder = '',
    confirmLabel = 'Save',
    onConfirm,
    onClose,
}: Props) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSubmit = () => {
        if (!value.trim()) return;
        onConfirm(value.trim());
    };

    return (
        <div className="lc-modal-backdrop" onClick={onClose}>
            <div className="lc-modal" onClick={e => e.stopPropagation()}>
                <div className="lc-modal-header">
                    {title}
                    <button className="lc-modal-close" onClick={onClose}><X size={14} /></button>
                </div>
                <div className="lc-modal-body">
                    <div>
                        <label className="lc-modal-label">{label}</label>
                        <input
                            ref={inputRef}
                            className="lc-modal-input"
                            type="text"
                            value={value}
                            placeholder={placeholder}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                        />
                    </div>
                </div>
                <div className="lc-modal-footer">
                    <button className="lc-modal-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="lc-modal-btn primary"
                        disabled={!value.trim()}
                        onClick={handleSubmit}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
