import { useState, useEffect, useRef } from 'react';

const CHANNEL = 'lifecast-live';
const FADE_MS = 300;

interface TextStyle {
    font: string;
    fontSize: number;
    bold: boolean;
    italic: boolean;
    shadow: boolean;
    textAlign: 'left' | 'center' | 'right';
    textPos: 'top' | 'center' | 'bottom';
    lineSpacing: number;
    textColor: string;
    labelColor: string;
    transition: 'none' | 'fade' | 'zoom' | 'slide';
}

const DEFAULT_TEXT_STYLE: TextStyle = {
    font: 'Segoe UI',
    fontSize: 48,
    bold: true,
    italic: false,
    shadow: false,
    textAlign: 'center',
    textPos: 'center',
    lineSpacing: 1.7,
    textColor: '#ffffff',
    labelColor: '#8cc341',
    transition: 'fade',
};

function transitionStyle(visible: boolean, type: string): React.CSSProperties {
    if (type === 'none') return {};
    const opacity = visible ? 1 : 0;
    if (type === 'zoom') return {
        opacity,
        transform: visible ? 'scale(1)' : 'scale(0.96)',
        transition: 'opacity 300ms ease, transform 300ms ease',
    };
    if (type === 'slide') return {
        opacity,
        transform: visible ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'opacity 300ms ease, transform 300ms ease',
    };
    return { opacity, transition: 'opacity 300ms ease' };
}

interface SlideContent {
    kind: 'slide';
    label: string | null;
    text: string;
    songTitle: string;
    theme: { css_bg: string; text_color: string } | null;
    blank: boolean;
    textStyle: TextStyle;
}

interface MediaContent {
    kind: 'media';
    url: string;
    title: string;
}

interface LiveState {
    content: SlideContent | MediaContent | null;
    outputRatio: string;
}

function useViewportRatio(outputRatio: string) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef  = useRef<HTMLDivElement>(null);
    const [vpHeight, setVpHeight] = useState(1080);

    useEffect(() => {
        const container = containerRef.current;
        const viewport  = viewportRef.current;
        if (!container || !viewport) return;

        const update = () => {
            const [rw, rh] = outputRatio.split('/').map(Number);
            const ratio    = rw / rh;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const vpW = cw / ch > ratio ? ch * ratio : cw;
            const vpH = cw / ch > ratio ? ch         : cw / ratio;
            viewport.style.width  = `${vpW}px`;
            viewport.style.height = `${vpH}px`;
            setVpHeight(vpH);
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(container);
        return () => ro.disconnect();
    }, [outputRatio]);

    return { containerRef, viewportRef, vpHeight };
}

function LiveSlide({ content, outputRatio }: { content: SlideContent; outputRatio: string }) {
    const { containerRef, viewportRef, vpHeight } = useViewportRatio(outputRatio);
    const ts        = content.textStyle ?? DEFAULT_TEXT_STYLE;
    const fontScale = vpHeight > 0 ? vpHeight / 720 : 1;
    const screenStyle = content.theme ? { background: content.theme.css_bg } : { background: '#111' };
    const contentStyle = {
        ...screenStyle,
        justifyContent: ts.textPos === 'top' ? 'flex-start' : ts.textPos === 'bottom' ? 'flex-end' : 'center',
    };
    const lyricStyle: React.CSSProperties = {
        color:      ts.textColor ?? '#ffffff',
        fontFamily: ts.font,
        fontSize:   `${Math.round(ts.fontSize * fontScale)}px`,
        fontWeight: ts.bold ? 700 : 400,
        fontStyle:  ts.italic ? 'italic' : 'normal',
        textShadow: ts.shadow ? '0 2px 8px rgba(0,0,0,0.85)' : 'none',
        textAlign:  ts.textAlign,
        lineHeight: ts.lineSpacing,
    };

    return (
        <div ref={containerRef} className="lc-live-output" style={screenStyle}>
            <div className="lc-screen-ambient" />
            <div ref={viewportRef} className="lc-output-viewport">
                <div className="lc-slide-content" style={contentStyle}>
                    {!content.blank && content.label && (
                        <span className="lc-verse-label" style={{ color: ts.labelColor }}>{content.label}</span>
                    )}
                    {!content.blank && (
                        <div
                            className="lc-lyric-text"
                            style={lyricStyle}
                            dangerouslySetInnerHTML={{ __html: content.text.replace(/\n/g, '<br>') }}
                        />
                    )}
                    {!content.blank && (
                        <span className="lc-song-title" style={{ color: ts.labelColor }}>{content.songTitle}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function LiveMedia({ content, outputRatio }: { content: MediaContent; outputRatio: string }) {
    const { containerRef, viewportRef } = useViewportRatio(outputRatio);

    return (
        <div ref={containerRef} className="lc-live-output" style={{ background: '#060606' }}>
            <img src={content.url} aria-hidden className="lc-media-ambient" />
            <div ref={viewportRef} className="lc-output-viewport">
                <img
                    src={content.url}
                    alt={content.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
            </div>
        </div>
    );
}

export default function Live() {
    const [displayState, setDisplayState] = useState<LiveState>({ content: null, outputRatio: '16/9' });
    const [visible, setVisible]           = useState(true);
    const pendingRef    = useRef<LiveState | null>(null);
    const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
    const transitionRef = useRef<string>('fade');

    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL);

        channel.onmessage = (e: MessageEvent) => {
            if (e.data?.type === 'state') {
                const next: LiveState = { content: e.data.content, outputRatio: e.data.outputRatio };
                const t = next.content?.kind === 'slide'
                    ? (next.content.textStyle?.transition ?? 'fade')
                    : 'fade';

                pendingRef.current = next;
                if (timerRef.current) clearTimeout(timerRef.current);

                if (t === 'none') {
                    transitionRef.current = t;
                    setDisplayState(next);
                    return;
                }

                transitionRef.current = t;
                setVisible(false);
                timerRef.current = setTimeout(() => {
                    setDisplayState(pendingRef.current!);
                    setVisible(true);
                }, FADE_MS);
            }
        };

        channel.postMessage({ type: 'request-state' });

        return () => {
            channel.close();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const { content, outputRatio } = displayState;

    const inner = !content
        ? <div className="lc-live-output" />
        : content.kind === 'media'
            ? <LiveMedia content={content} outputRatio={outputRatio} />
            : <LiveSlide content={content} outputRatio={outputRatio} />;

    return (
        <div style={{ ...transitionStyle(visible, transitionRef.current), position: 'fixed', inset: 0 }}>
            {inner}
        </div>
    );
}
