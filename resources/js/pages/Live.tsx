import { useState, useEffect, useRef } from 'react';

const CHANNEL = 'lifecast-live';

interface SlideContent {
    kind: 'slide';
    label: string | null;
    text: string;
    songTitle: string;
    theme: { css_bg: string; text_color: string } | null;
    blank: boolean;
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
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(container);
        return () => ro.disconnect();
    }, [outputRatio]);

    return { containerRef, viewportRef };
}

function LiveSlide({ content, outputRatio }: { content: SlideContent; outputRatio: string }) {
    const { containerRef, viewportRef } = useViewportRatio(outputRatio);
    const screenStyle = content.theme ? { background: content.theme.css_bg } : { background: '#111' };
    const textStyle   = content.theme ? { color: content.theme.text_color } : {};

    return (
        <div ref={containerRef} className="lc-live-output" style={screenStyle}>
            <div className="lc-screen-ambient" />
            <div ref={viewportRef} className="lc-output-viewport">
                <div className="lc-slide-content" style={screenStyle}>
                    {!content.blank && content.label && (
                        <span className="lc-verse-label">{content.label}</span>
                    )}
                    {!content.blank && (
                        <div
                            className="lc-lyric-text"
                            style={textStyle}
                            dangerouslySetInnerHTML={{ __html: content.text.replace(/\n/g, '<br>') }}
                        />
                    )}
                    {!content.blank && (
                        <span className="lc-song-title">{content.songTitle}</span>
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
    const [state, setState] = useState<LiveState>({ content: null, outputRatio: '16/9' });

    useEffect(() => {
        const channel = new BroadcastChannel(CHANNEL);

        channel.onmessage = (e: MessageEvent) => {
            if (e.data?.type === 'state') {
                setState({ content: e.data.content, outputRatio: e.data.outputRatio });
            }
        };

        // Ask the console for its current state immediately
        channel.postMessage({ type: 'request-state' });

        return () => channel.close();
    }, []);

    const { content, outputRatio } = state;

    if (!content) {
        return <div className="lc-live-output" />;
    }

    if (content.kind === 'media') {
        return <LiveMedia content={content} outputRatio={outputRatio} />;
    }

    return <LiveSlide content={content} outputRatio={outputRatio} />;
}
