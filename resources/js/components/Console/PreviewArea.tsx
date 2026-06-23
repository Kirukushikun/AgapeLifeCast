import { useState, useEffect, useRef } from 'react';
import type { SelectedSong, SavedVerse, MediaFile } from '@/pages/Console/Index';

// What is currently frozen on the Live screen — only changes on explicit "Send to Live"
type LiveSnapshot =
    | { kind: 'slide'; song: SelectedSong; slideIdx: number }
    | { kind: 'verse'; verse: SavedVerse }
    | null;

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

function MediaScreen({ file, startTime = 0, volume = 1 }: { file: MediaFile; startTime?: number; volume?: number }) {
    const liveVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = liveVideoRef.current;
        if (!video) return;

        const start = async () => {
            // Start muted — guarantees autoplay permission in all browsers
            video.muted = true;
            if (startTime > 0) video.currentTime = startTime;
            try {
                await video.play();
                // Play succeeded; now unmute so the live screen handles audio
                video.muted = false;
                video.volume = volume;
            } catch {
                // Autoplay blocked entirely — video stays silent but visible
            }
        };

        if (video.readyState >= 1) {
            start();
        } else {
            video.addEventListener('loadedmetadata', start, { once: true });
            return () => video.removeEventListener('loadedmetadata', start);
        }
    }, [file.id]);

    // Volume changes after initial mount
    useEffect(() => {
        const video = liveVideoRef.current;
        if (video && !video.muted) video.volume = volume;
    }, [volume]);

    return (
        <div className="lc-preview-screen lc-media-screen">
            {/* Ambient: blurred fill, always loops silently */}
            {file.type === 'image' && (
                <img src={file.url} aria-hidden className="lc-media-ambient" />
            )}
            {file.type === 'video' && (
                <video src={file.url} aria-hidden className="lc-media-ambient" autoPlay muted loop playsInline />
            )}
            {/* 16:9 content box */}
            <div className="lc-media-slide">
                {file.type === 'image' && (
                    <img src={file.url} alt={file.title} className="lc-media-img" />
                )}
                {file.type === 'video' && (
                    <video
                        ref={liveVideoRef}
                        src={file.url}
                        className="lc-media-video"
                        muted
                        loop={file.is_looping}
                        playsInline
                    />
                )}
            </div>
        </div>
    );
}

function renderLiveScreen(snapshot: LiveSnapshot, liveMedia: MediaFile | null, isBlank: boolean, liveMediaStartTime: number, volume: number) {
    if (liveMedia) return <MediaScreen file={liveMedia} startTime={liveMediaStartTime} volume={volume} />;
    if (!snapshot)  return <div className="lc-preview-screen is-blank" />;

    if (snapshot.kind === 'verse') {
        const { verse } = snapshot;
        return <SlideCanvas label={verse.reference} text={verse.content} blank={isBlank} songTitle={verse.translation} theme={null} />;
    }

    const slide = snapshot.song.slides[snapshot.slideIdx];
    if (!slide) return <div className="lc-preview-screen is-blank" />;
    return <SlideCanvas label={slide.label} text={slide.content} blank={isBlank} songTitle={snapshot.song.title} theme={snapshot.song.theme} />;
}

export default function PreviewArea({ selectedSong, selectedVerse, volume, onVolumeChange, hasActiveAudio, liveMedia, liveMediaStartTime }: {
    selectedSong: SelectedSong | null;
    selectedVerse: SavedVerse | null;
    volume: number;
    onVolumeChange: (v: number) => void;
    hasActiveAudio: boolean;
    liveMedia: MediaFile | null;
    liveMediaStartTime: number;
}) {
    const slides = selectedSong?.slides ?? [];

    const [activeThumb, setActiveThumb]     = useState(0);
    const [previewIdx, setPreviewIdx]       = useState(0);
    const [liveSnapshot, setLiveSnapshot]   = useState<LiveSnapshot>(null);
    const [liveClick, setLiveClick]         = useState(false);
    const [isBlank, setIsBlank]             = useState(false);

    const isOnAir = !!liveMedia || !!liveSnapshot;

    // Reset ONLY the preview when the selection changes — Live stays frozen
    useEffect(() => {
        setActiveThumb(0);
        setPreviewIdx(0);
    }, [selectedSong?.id, selectedVerse?.id]);

    const sendLive = (snapshot: LiveSnapshot) => {
        setLiveSnapshot(snapshot);
        setIsBlank(false);
    };

    const handleThumbClick = (idx: number) => {
        setActiveThumb(idx);
        if (liveClick && selectedSong) {
            sendLive({ kind: 'slide', song: selectedSong, slideIdx: idx });
        } else {
            setPreviewIdx(idx);
        }
    };

    const handleSendLive = () => {
        if (selectedVerse) {
            sendLive({ kind: 'verse', verse: selectedVerse });
        } else if (selectedSong && slides[previewIdx]) {
            sendLive({ kind: 'slide', song: selectedSong, slideIdx: previewIdx });
        }
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

    // ── Preview screen (follows current selection) ──
    const previewSlide = slides[previewIdx];
    const songTitle    = selectedSong?.title ?? '';
    const theme        = selectedSong?.theme ?? null;
    const verseText    = selectedVerse?.content ?? '';
    const verseLabel   = selectedVerse?.reference ?? '';
    const verseMeta    = selectedVerse?.translation ?? '';

    const previewScreen = selectedVerse
        ? <SlideCanvas label={verseLabel} text={verseText} songTitle={verseMeta} theme={null} />
        : previewSlide
            ? <SlideCanvas label={previewSlide.label} text={previewSlide.content} songTitle={songTitle} theme={theme} />
            : <div className="lc-preview-screen is-blank" />;

    // ── Slide list ──
    const slideList = selectedVerse ? (
        <div>
            <div className="lc-slide-thumb active"><span>{verseLabel}</span></div>
            <div className="lc-slide-label">Verse</div>
        </div>
    ) : slides.map((slide, idx) => (
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
    ));

    // ── Empty state ──
    if (!selectedVerse && slides.length === 0 && !liveMedia && !liveSnapshot) {
        return (
            <div className="lc-preview-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--lc-text-muted)', fontSize: '.85rem', fontFamily: 'Poppins, sans-serif' }}>
                    Select a song, verse, or media from the library to preview.
                </span>
            </div>
        );
    }

    const prevDisabled = !selectedSong || previewIdx === 0;
    const nextDisabled = !selectedSong || previewIdx === slides.length - 1;

    const showSlideList = selectedVerse !== null || slides.length > 0;

    return (
        <div className="lc-preview-area">

            {showSlideList && (
                <div className="lc-slide-list">
                    {slideList}
                </div>
            )}

            <div className="lc-preview-main">

                <div className={`lc-dual-screens${liveClick ? ' live-click-mode' : ''}`}>

                    <div className="lc-screen-col lc-col-preview">
                        <div className="lc-screen-label">
                            <span className="lc-label-text">Preview</span>
                            <span className="lc-label-badge">Staged</span>
                        </div>
                        {previewScreen}
                    </div>

                    <div className={`lc-screen-col lc-col-live${isOnAir ? ' on-air' : ''}`}>
                        <div className="lc-screen-label">
                            <span className="lc-label-text">Live</span>
                            <span className="lc-label-badge">
                                <span className="lc-pulse-dot" />
                                {isOnAir ? 'ON AIR' : 'OFFLINE'}
                            </span>
                        </div>
                        {renderLiveScreen(liveSnapshot, liveMedia, isBlank, liveMediaStartTime, volume)}
                    </div>

                </div>

                <div className="lc-preview-controls">
                    <div className="lc-ctrl-left">
                        <label
                            className={`lc-live-click-wrap${liveClick ? ' active' : ''}`}
                            title="Click any slide to instantly send to Live"
                            onClick={() => setLiveClick(v => !v)}
                        >
                            <div className="lc-mini-track"><div className="lc-mini-thumb" /></div>
                            <span className="lc-live-click-label">Live Click</span>
                        </label>
                    </div>
                    <div className="lc-ctrl-center">
                        <button className="lc-ctrl-btn" onClick={handlePrev} disabled={prevDisabled}><i className="fa-solid fa-caret-left"></i> Prev</button>
                        <button className="lc-ctrl-btn" onClick={handleNext} disabled={nextDisabled}>Next <i className="fa-solid fa-caret-right"></i></button>
                        <div className="lc-ctrl-divider" />
                        <button className="lc-ctrl-btn btn-blank" onClick={() => setIsBlank(v => !v)}>
                            <i className="fa-solid fa-stop"></i> {isBlank ? 'Unblank' : 'Blank Live'}
                        </button>
                        <button className="lc-ctrl-btn btn-live" onClick={handleSendLive}>
                            <i className="fa-solid fa-play"></i> Send to Live
                        </button>
                    </div>
                    <div className="lc-ctrl-right">
                        <div className={`lc-vol-ctrl${hasActiveAudio ? '' : ' disabled'}`}>
                            <i className="fa-solid fa-volume-low"></i>
                            <input
                                type="range"
                                className="lc-vol-slider"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                disabled={!hasActiveAudio}
                                onChange={e => onVolumeChange(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
