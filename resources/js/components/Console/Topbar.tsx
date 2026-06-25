import { useState, useEffect } from 'react';

export default function Topbar() {
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('lc-dark-mode');
        if (stored !== null) return stored === 'true';
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('lc-dark-mode', String(isDark));
    }, [isDark]);

    return (
        <header className="lc-topbar">
            <div className="lc-logo">
                <img src="/images/LCMI-White-logo-2048x650.png" alt="LCMI" />
                <span className="lc-logo-name">LifeCast</span>
            </div>

            <div className="lc-sep" />

            <nav>
                <button>Schedule</button>
                <button>Display</button>
                <button>Settings</button>
                <button>Help</button>
            </nav>

            <div className="lc-spacer" />

            <div className="lc-actions">
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
                    onClick={() => setIsDark(d => !d)}
                >
                    <div className="lc-toggle-track">
                        <div className="lc-toggle-thumb">
                            {isDark ? '🌙' : '☀️'}
                        </div>
                    </div>
                </label>
            </div>
        </header>
    );
}
