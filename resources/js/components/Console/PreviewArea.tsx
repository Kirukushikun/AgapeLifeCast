import { useState, useEffect, useRef } from 'react';
import type { SelectedSong, SavedVerse, MediaFile, SlideDeck, ThemeData } from '@/pages/Console/Index';

const SLIDE_W = 1280;
const SLIDE_H = 720;

function useSlideScale() {
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        if (!outer || !inner) return;

        const update = () => {
            const scale   = outer.clientWidth / SLIDE_W;
            const scaledH = SLIDE_H * scale;
            const offsetY = Math.max(0, (outer.clientHeight - scaledH) / 2);
            inner.style.transform = `translate(0,${offsetY}px) scale(${scale})`;
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(outer);
        return () => ro.disconnect();
    }, []);

    return { outerRef, innerRef };
}

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
    const { outerRef, innerRef } = useSlideScale();
    const screenStyle = theme ? { background: theme.css_bg } : {};
    const textStyle   = theme ? { color: theme.text_color } : {};

    return (
        <div ref={outerRef} className={`lc-preview-screen${blank ? ' is-blank' : ''}`} style={screenStyle}>
            <div ref={innerRef} className="lc-slide-inner" style={screenStyle}>
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
        </div>
    );
}

function SlideThumbnail({ text, theme, active, onClick }: {
    label: string | null;
    text: string;
    songTitle: string;
    theme: { css_bg: string; text_color: string } | null;
    active: boolean;
    onClick: () => void;
}) {
    const { outerRef, innerRef } = useSlideScale();
    const bgStyle   = theme ? { background: theme.css_bg } : {};
    const textStyle = theme ? { color: theme.text_color } : {};

    return (
        <div
            ref={outerRef}
            className={`lc-slide-thumb${active ? ' active' : ''}`}
            style={{ padding: 0 }}
            onClick={onClick}
        >
            <div ref={innerRef} className="lc-slide-inner" style={bgStyle}>
                <div className="lc-screen-ambient" />
                <div className="lc-screen-slide">
                    <div
                        className="lc-lyric-text"
                        style={textStyle}
                        dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br>') }}
                    />
                </div>
            </div>
        </div>
    );
}

function MediaScreen({ file }: { file: MediaFile }) {
    return (
        <div className="lc-preview-screen lc-media-screen">
            <img src={file.url} aria-hidden className="lc-media-ambient" />
            <div className="lc-media-slide">
                <img src={file.url} alt={file.title} className="lc-media-img" />
            </div>
        </div>
    );
}

function DeckSlideScreen({ url, alt }: { url: string; alt: string }) {
    return (
        <div className="lc-preview-screen lc-media-screen">
            <img src={url} aria-hidden className="lc-media-ambient" />
            <div className="lc-media-slide">
                <img src={url} alt={alt} className="lc-media-img" />
            </div>
        </div>
    );
}

function renderLiveScreen(snapshot: LiveSnapshot, liveMedia: MediaFile | null, isBlank: boolean, liveMediaKey: number, blankTheme: ThemeData | null) {
    if (isBlank)    return <SlideCanvas label={null} text="" blank songTitle="" theme={blankTheme} />;
    if (liveMedia)  return <MediaScreen key={liveMediaKey} file={liveMedia} />;
    if (!snapshot)  return <div className="lc-preview-screen is-blank" />;

    if (snapshot.kind === 'verse') {
        const { verse } = snapshot;
        return <SlideCanvas label={verse.reference} text={verse.content} blank={isBlank} songTitle={verse.translation} theme={null} />;
    }

    const slide = snapshot.song.slides[snapshot.slideIdx];
    if (!slide) return <div className="lc-preview-screen is-blank" />;
    return <SlideCanvas label={slide.label} text={slide.content} blank={isBlank} songTitle={snapshot.song.title} theme={snapshot.song.theme} />;
}

export default function PreviewArea({ selectedSong, selectedVerse, selectedDeck, volume, onVolumeChange, hasActiveAudio, liveMedia, liveMediaKey, onMediaLive, blankTheme }: {
    selectedSong: SelectedSong | null;
    selectedVerse: SavedVerse | null;
    selectedDeck: SlideDeck | null;
    volume: number;
    onVolumeChange: (v: number) => void;
    hasActiveAudio: boolean;
    liveMedia: MediaFile | null;
    liveMediaKey: number;
    onMediaLive: (file: MediaFile | null) => void;
    blankTheme: ThemeData | null;
}) {
    const slides = selectedSong?.slides ?? [];

    const [activeThumb, setActiveThumb]       = useState(0);
    const [previewIdx, setPreviewIdx]         = useState(0);
    const [activeDeckSlide, setActiveDeckSlide] = useState(0);
    const [liveSnapshot, setLiveSnapshot]     = useState<LiveSnapshot>(null);
    const [liveClick, setLiveClick]           = useState(false);
    const [isBlank, setIsBlank]               = useState(false);

    const isOnAir = !!liveMedia || !!liveSnapshot;

    // Reset song/verse preview when selection changes
    useEffect(() => {
        setActiveThumb(0);
        setPreviewIdx(0);
    }, [selectedSong?.id, selectedVerse?.id]);

    // Reset deck slide position when a new deck is selected
    useEffect(() => {
        setActiveDeckSlide(0);
    }, [selectedDeck?.id]);

    // Clear blank whenever something new is sent live from outside PreviewArea
    useEffect(() => {
        if (liveMedia) setIsBlank(false);
    }, [liveMedia]);

    const isDeckMode = !!selectedDeck && selectedDeck.status === 'ready' && selectedDeck.slides.length > 0;

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

    const handleDeckSlideClick = (idx: number) => {
        setActiveDeckSlide(idx);
        if (liveClick && selectedDeck) {
            sendDeckSlideLive(idx);
        }
    };

    const sendDeckSlideLive = (idx: number) => {
        if (!selectedDeck) return;
        const slide = selectedDeck.slides[idx];
        if (!slide) return;
        onMediaLive({
            id: slide.id,
            folder_id: null,
            title: `${selectedDeck.title} — Slide ${slide.sort_order}`,
            type: 'image',
            extension: 'png',
            mime_type: 'image/png',
            file_size: 0,
            width: null,
            height: null,
            duration_seconds: null,
            is_looping: false,
            url: slide.url,
        });
    };

    const handleSendLive = () => {
        if (isDeckMode) {
            sendDeckSlideLive(activeDeckSlide);
        } else if (selectedVerse) {
            sendLive({ kind: 'verse', verse: selectedVerse });
        } else if (selectedSong && slides[previewIdx]) {
            sendLive({ kind: 'slide', song: selectedSong, slideIdx: previewIdx });
        }
    };

    const handlePrev = () => {
        if (isDeckMode) {
            const next = Math.max(0, activeDeckSlide - 1);
            setActiveDeckSlide(next);
        } else {
            const next = Math.max(0, previewIdx - 1);
            setPreviewIdx(next);
            setActiveThumb(next);
        }
    };

    const handleNext = () => {
        if (isDeckMode) {
            const next = Math.min(selectedDeck!.slides.length - 1, activeDeckSlide + 1);
            setActiveDeckSlide(next);
        } else {
            const next = Math.min(slides.length - 1, previewIdx + 1);
            setPreviewIdx(next);
            setActiveThumb(next);
        }
    };

    // ── Preview screen ──
    const previewSlide = slides[previewIdx];
    const songTitle    = selectedSong?.title ?? '';
    const theme        = selectedSong?.theme ?? null;
    const verseText    = selectedVerse?.content ?? '';
    const verseLabel   = selectedVerse?.reference ?? '';
    const verseMeta    = selectedVerse?.translation ?? '';

    let previewScreen: React.ReactNode;
    if (isDeckMode) {
        const ds = selectedDeck!.slides[activeDeckSlide];
        previewScreen = <DeckSlideScreen url={ds.url} alt={`Slide ${ds.sort_order}`} />;
    } else if (selectedVerse) {
        previewScreen = <SlideCanvas label={verseLabel} text={verseText} songTitle={verseMeta} theme={null} />;
    } else if (previewSlide) {
        previewScreen = <SlideCanvas label={previewSlide.label} text={previewSlide.content} songTitle={songTitle} theme={theme} />;
    } else {
        previewScreen = <div className="lc-preview-screen is-blank" />;
    }

    // ── Slide list ──
    let slideList: React.ReactNode;
    if (isDeckMode) {
        slideList = selectedDeck!.slides.map((slide, idx) => (
            <div key={slide.id}>
                <div
                    className={`lc-slide-thumb lc-slide-thumb-img${activeDeckSlide === idx ? ' active' : ''}`}
                    onClick={() => handleDeckSlideClick(idx)}
                >
                    <img src={slide.url} alt={`Slide ${slide.sort_order}`} />
                </div>
                <div className="lc-slide-label">{slide.sort_order}</div>
            </div>
        ));
    } else if (selectedVerse) {
        slideList = (
            <div>
                <SlideThumbnail
                    label={verseLabel}
                    text={verseText}
                    songTitle={verseMeta}
                    theme={null}
                    active={true}
                    onClick={() => {}}
                />
                <div className="lc-slide-label">Verse</div>
            </div>
        );
    } else {
        slideList = slides.map((slide, idx) => (
            <div key={slide.id}>
                <SlideThumbnail
                    label={slide.label}
                    text={slide.content}
                    songTitle={songTitle}
                    theme={theme}
                    active={activeThumb === idx}
                    onClick={() => handleThumbClick(idx)}
                />
                <div className="lc-slide-label">{slide.label}</div>
            </div>
        ));
    }

    // ── Empty state ──
    if (!selectedVerse && !selectedDeck && slides.length === 0 && !liveMedia && !liveSnapshot) {
        return (
            <div className="lc-preview-area" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--lc-text-muted)', fontSize: '.85rem', fontFamily: 'Poppins, sans-serif' }}>
                    Select a song, verse, or media from the library to preview.
                </span>
            </div>
        );
    }

    const prevDisabled = isDeckMode ? activeDeckSlide === 0 : (!selectedSong || previewIdx === 0);
    const nextDisabled = isDeckMode
        ? activeDeckSlide >= selectedDeck!.slides.length - 1
        : (!selectedSong || previewIdx === slides.length - 1);

    const showSlideList = isDeckMode || selectedVerse !== null || slides.length > 0;

    // Show processing/failed message instead of slide list when deck isn't ready
    const deckNotReady = !!selectedDeck && !isDeckMode;

    return (
        <div className="lc-preview-area">

            {showSlideList && (
                <div className="lc-slide-list">
                    {slideList}
                </div>
            )}

            {deckNotReady && (
                <div className="lc-slide-list" style={{ justifyContent: 'flex-start' }}>
                    <div style={{ padding: '16px 10px', fontSize: '.78rem', color: 'var(--lc-text-muted)', textAlign: 'center' }}>
                        {selectedDeck!.status === 'processing'
                            ? '⏳ Converting slides, please wait…'
                            : '❌ Conversion failed. Try re-importing.'}
                    </div>
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
                        {renderLiveScreen(liveSnapshot, liveMedia, isBlank, liveMediaKey, blankTheme)}
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
