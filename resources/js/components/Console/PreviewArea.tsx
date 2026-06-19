import { useState, useEffect } from 'react';
import type { SelectedSong } from '@/pages/Console/Index';

interface SlideCanvasProps {
    label: string | null;
    text: string;
    blank?: boolean;
    songTitle: string;
    theme: { css_bg: string; text_color: string } | null;
}

function SlideCanvas({ label, text, blank = false, songTitle, theme }: SlideCanvasProps) {
    const screenStyle = theme ? { background: theme.css_bg } : {};
    const textStyle   = theme ? { color: theme.text_color } : {};

    return (
        <div className={`lc-preview-screen${blank ? ' is-blank' : ''}`} style={screenStyle}>
            <div className="lc-screen-ambient" />
            <div className="lc-screen-slide">
                {label && <span className="lc-verse-label">{label}</span>}
                <div
                    className="lc-lyric-text"
                    style={textStyle}
                    dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br>') }}
                />
                <span className="lc-song-title">{songTitle}</span>
            </div>
        </div>
    );
}

export default function PreviewArea({ selectedSong }: { selectedSong: SelectedSong | null }) {
    const slides = selectedSong?.slides ?? [];

    const [activeThumb, setActiveThumb] = useState(0);
    const [previewIdx, setPreviewIdx]   = useState(0);
    const [liveIdx, setLiveIdx]         = useState(0);
    const [liveClick, setLiveClick]     = useState(false);
    const [isBlank, setIsBlank]         = useState(false);
    const [isOnAir, setIsOnAir]         = useState(false);

    // Reset preview state whenever the selected song changes
    useEffect(() => {
        setActiveThumb(0);
        setPreviewIdx(0);
        setLiveIdx(0);
        setIsBlank(false);
    }, [selectedSong?.id]);

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
        const next = Math.min(slides.length - 1, previewIdx + 1);
        setPreviewIdx(next);
        setActiveThumb(next);
    };

    const previewSlide = slides[previewIdx];
    const liveSlide    = slides[liveIdx];
    const songTitle    = selectedSong?.title ?? '';
    const theme        = selectedSong?.theme ?? null;

    if (slides.length === 0) {
        return (
            <div className="lc-preview-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--lc-text-muted)', fontSize: '.85rem', fontFamily: 'Poppins, sans-serif' }}>
                    Select a song from the library to preview slides.
                </span>
            </div>
        );
    }

    return (
        <div className="lc-preview-area">

            {/* ── Slide thumbnails ── */}
            <div className="lc-slide-list">
                {slides.map((slide, idx) => (
                    <div key={slide.id}>
                        <div
                            className={`lc-slide-thumb${activeThumb === idx ? ' active' : ''}`}
                            onClick={() => handleThumbClick(idx)}
                        >
                            <span>{slide.content.split('\n').map((line, i, arr) => (
                                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
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
                        {previewSlide && (
                            <SlideCanvas
                                label={previewSlide.label}
                                text={previewSlide.content}
                                songTitle={songTitle}
                                theme={theme}
                            />
                        )}
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
                        {liveSlide && (
                            <SlideCanvas
                                label={liveSlide.label}
                                text={liveSlide.content}
                                blank={isBlank}
                                songTitle={songTitle}
                                theme={theme}
                            />
                        )}
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
                        <button className="lc-ctrl-btn" onClick={handlePrev} disabled={previewIdx === 0}>◀ Prev</button>
                        <button className="lc-ctrl-btn" onClick={handleNext} disabled={previewIdx === slides.length - 1}>Next ▶</button>
                        <div className="lc-ctrl-divider" />
                        <button className="lc-ctrl-btn btn-blank" onClick={() => setIsBlank(v => !v)}>
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
