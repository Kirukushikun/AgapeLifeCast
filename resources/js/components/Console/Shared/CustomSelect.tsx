import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    hasError?: boolean;
}

export default function CustomSelect({ value, onChange, options, placeholder = '— Select —', hasError }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} className={`lc-custom-select${hasError ? ' error' : ''}`}>
            <button
                type="button"
                className="lc-cs-trigger"
                onClick={() => setOpen(o => !o)}
            >
                <span className={`lc-cs-label${selected ? '' : ' lc-cs-placeholder'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={13} className={`lc-cs-chevron${open ? ' open' : ''}`} />
            </button>

            {open && (
                <div className="lc-cs-dropdown">
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            className={`lc-cs-option${opt.value === value ? ' selected' : ''}`}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
