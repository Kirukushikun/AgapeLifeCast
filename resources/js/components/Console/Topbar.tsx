import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { router } from '@inertiajs/react';

type MenuItem = { label: string; action?: () => void } | { separator: true };

function getSnapshot() { return localStorage.getItem('lc-dark-mode') === 'true'; }
function getServerSnapshot() { return false; }
function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
}

export default function Topbar() {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [importing, setImporting]   = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggleDark = () => {
        const next = !isDark;
        localStorage.setItem('lc-dark-mode', String(next));
        document.documentElement.classList.toggle('dark', next);
        window.dispatchEvent(new StorageEvent('storage', { key: 'lc-dark-mode' }));
    };

    useEffect(() => {
        const dark = localStorage.getItem('lc-dark-mode') === 'true';
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeMenu = () => setActiveMenu(null);
    const toggleMenu = (menu: string) => setActiveMenu(prev => (prev === menu ? null : menu));

    const handleExport = () => {
        closeMenu();
        window.location.href = '/console/export';
    };

    const handleImportClick = () => {
        closeMenu();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const form = new FormData();
        form.append('file', file);

        router.post('/console/import', form, {
            onFinish: () => {
                setImporting(false);
                if (e.target) e.target.value = '';
            },
        });
    };

    const menuConfigs: Record<string, MenuItem[]> = {
        schedule: [
            { label: 'Add to Schedule' },
            { label: 'View Schedule' },
            { label: 'Import Schedule' },
        ],
        display: [
            { label: 'Show Live Output', action: () => { closeMenu(); window.open('/live', 'lifecast-live-window'); } },
            { label: 'Preview Screen' },
            { label: 'Output Settings' },
        ],
        settings: [
            { label: 'Preferences' },
            { label: 'Theme Settings' },
            { label: 'Keyboard Shortcuts' },
            { separator: true },
            { label: 'Export Data', action: handleExport },
            { label: 'Import Data', action: handleImportClick },
        ],
        help: [
            { label: 'Call iverson pogi' },
        ],
    };

    return (
        <header className="lc-topbar">
            <div className="lc-logo">
                <img src="/images/LCMI-White-logo-2048x650.png" alt="LCMI" />
                <span className="lc-logo-name">LifeCast</span>
            </div>

            <div className="lc-sep" />

            <nav className="lc-topbar-nav" ref={containerRef}>
                {(['schedule', 'display', 'settings', 'help'] as const).map(menuKey => (
                    <div key={menuKey} className="lc-menu-group">
                        <button
                            type="button"
                            className="lc-menu-trigger"
                            onClick={() => toggleMenu(menuKey)}
                            aria-expanded={activeMenu === menuKey}
                            aria-haspopup="true"
                        >
                            {menuKey.charAt(0).toUpperCase() + menuKey.slice(1)}
                        </button>

                        <div className={`lc-submenu-panel ${activeMenu === menuKey ? 'open' : ''}`}>
                            {menuConfigs[menuKey].map((item, i) =>
                                'separator' in item ? (
                                    <div key={i} className="lc-submenu-sep" />
                                ) : (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => { item.action?.(); closeMenu(); }}
                                    >
                                        {item.label}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="lc-spacer" />

            <div className="lc-actions">
                {importing && <span className="lc-import-status">Importing…</span>}

                <button
                    className="lc-btn-open-live"
                    onClick={() => window.open('/live', 'lifecast-live-window')}
                >
                    <span className="lc-live-dot" />
                    Open Live Window
                </button>

                <label
                    className="lc-theme-toggle"
                    title="Toggle dark mode"
                    onClick={toggleDark}
                >
                    <div className="lc-toggle-track">
                        <div className="lc-toggle-thumb" suppressHydrationWarning>
                            {isDark ? '🌙' : '☀️'}
                        </div>
                    </div>
                </label>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </header>
    );
}
