import { useState } from 'react';

const SLIDES = [
    { label: 'Verse 1',      text: 'Amazing Grace,\nhow sweet\nthe sound' },
    { label: 'Verse 1 cont.', text: 'That saved a\nwretch like me' },
    { label: 'Verse 2',      text: 'I once was lost,\nbut now am found' },
    { label: 'Verse 2 cont.', text: 'Was blind,\nbut now I see' },
    { label: 'Verse 3',      text: '\'Twas grace that\ntaught my heart to fear' },
    { label: 'Verse 3 cont.', text: 'And grace my\nfears relieved' },
];

function SlideCanvas({ label, text, blank = false }: { label: string; text: string; blank?: boolean }) {
    return (
        <div className={`lc-preview-screen${blank ? ' is-blank' : ''}`}>
            <div className="lc-screen-ambient" />
            <div className="lc-screen-slide">
                <span className="lc-verse-label">{label}</span>
                <div
                    className="lc-lyric-text"
                    dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br>') }}
                />
                <span className="lc-song-title">Amazing Grace</span>
            </div>
        </div>
    );
}

export default function PreviewArea() {
    const [activeThumb, setActiveThumb] = useState(0);
    const [previewIdx, setPreviewIdx]   = useState(1);
    const [liveIdx, setLiveIdx]         = useState(0);
    const [liveClick, setLiveClick]     = useState(false);
    const [isBlank, setIsBlank]         = useState(false);
    const [isOnAir, setIsOnAir]         = useState(true);

    const handleThumbClick = (idx: number) => {
        setActiveThumb(idx);
        if (liveClick) {
            setLiveIdx(idx);
            setIsOnAir(true);
            setIsBlank(false);
        } else {
            setPreviewIdx(idx);
        }
    };

    const handleSendLive = () => {
        setLiveIdx(previewIdx);
        setIsOnAir(true);
        setIsBlank(false);
    };

    const handlePrev = () => {
        const next = Math.max(0, previewIdx - 1);
        setPreviewIdx(next);
        setActiveThumb(next);
    };

    const handleNext = () => {
        const next = Math.min(SLIDES.length - 1, previewIdx + 1);
        setPreviewIdx(next);
        setActiveThumb(next);
    };

    return (
        <div className="lc-preview-area">

            {/* ── Slide thumbnails ── */}
            <div className="lc-slide-list">
                {SLIDES.map((slide, idx) => (
                    <div key={idx}>
                        <div
                            className={`lc-slide-thumb${activeThumb === idx ? ' active' : ''}`}
                            onClick={() => handleThumbClick(idx)}
                        >
                            <span>{slide.text.split('\n').map((line, i) => (
                                <span key={i}>{line}{i < slide.text.split('\n').length - 1 && <br />}</span>
                            ))}</span>
                        </div>
                        <div className="lc-slide-label">{slide.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Dual screens + controls ── */}
            <div className="lc-preview-main">

                <div className={`lc-dual-screens${liveClick ? ' live-click-mode' : ''}`}>

                    {/* Preview screen */}
                    <div className="lc-screen-col lc-col-preview">
                        <div className="lc-screen-label">
                            <span className="lc-label-text">Preview</span>
                            <span className="lc-label-badge">Staged</span>
                        </div>
                        <SlideCanvas
                            label={SLIDES[previewIdx].label}
                            text={SLIDES[previewIdx].text}
                        />
                    </div>

                    {/* Live screen */}
                    <div className={`lc-screen-col lc-col-live${isOnAir ? ' on-air' : ''}`}>
                        <div className="lc-screen-label">
                            <span className="lc-label-text">Live</span>
                            <span className="lc-label-badge">
                                <span className="lc-pulse-dot" />
                                {isOnAir ? 'ON AIR' : 'OFFLINE'}
                            </span>
                        </div>
                        <SlideCanvas
                            label={SLIDES[liveIdx].label}
                            text={SLIDES[liveIdx].text}
                            blank={isBlank}
                        />
                    </div>

                </div>

                {/* Controls */}
                <div className="lc-preview-controls">

                    <div className="lc-ctrl-left">
                        <label
                            className={`lc-live-click-wrap${liveClick ? ' active' : ''}`}
                            title="Click any slide to instantly send to Live"
                            onClick={() => setLiveClick(v => !v)}
                        >
                            <div className="lc-mini-track">
                                <div className="lc-mini-thumb" />
                            </div>
                            <span className="lc-live-click-label">Live Click</span>
                        </label>
                    </div>

                    <div className="lc-ctrl-center">
                        <button className="lc-ctrl-btn" onClick={handlePrev}>◀ Prev</button>
                        <button className="lc-ctrl-btn" onClick={handleNext}>Next ▶</button>
                        <div className="lc-ctrl-divider" />
                        <button
                            className="lc-ctrl-btn btn-blank"
                            onClick={() => setIsBlank(v => !v)}
                        >
                            ■ {isBlank ? 'Unblank' : 'Blank Live'}
                        </button>
                        <button className="lc-ctrl-btn btn-live" onClick={handleSendLive}>
                            ▶ Send to Live
                        </button>
                    </div>

                    <div className="lc-ctrl-right" />

                </div>

            </div>
        </div>
    );
}
