import React, { useState, useEffect, useRef } from 'react';

interface PerfOverlayProps {
    entityCount: number;
    visible?: boolean;
}

interface FrameStats {
    fps: number;
    frameTime: number;
    renderTime: number;
}

export const PerfOverlay: React.FC<PerfOverlayProps> = ({ entityCount, visible = false }) => {
    const [stats, setStats] = useState<FrameStats>({ fps: 0, frameTime: 0, renderTime: 0 });
    const framesRef = useRef<number[]>([]);
    const renderStartRef = useRef(0);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        if (!visible) return;

        let running = true;
        const measure = () => {
            if (!running) return;
            const now = performance.now();
            framesRef.current.push(now);

            while (framesRef.current.length > 0 && framesRef.current[0]! < now - 1000) {
                framesRef.current.shift();
            }

            const fps = framesRef.current.length;
            const frameTime = fps > 0 ? 1000 / fps : 0;

            setStats({
                fps,
                frameTime: Math.round(frameTime * 10) / 10,
                renderTime: Math.round((now - renderStartRef.current) * 10) / 10,
            });
            renderStartRef.current = now;
            rafRef.current = requestAnimationFrame(measure);
        };

        rafRef.current = requestAnimationFrame(measure);
        return () => {
            running = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [visible]);

    if (!visible) return null;

    const fpsColor = stats.fps >= 55 ? '#10b981' : stats.fps >= 30 ? '#f59e0b' : '#ef4444';

    return (
        <div
            style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 20,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(100,116,139,0.2)',
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.5,
                pointerEvents: 'none',
            }}
        >
            <div style={{ color: fpsColor, fontWeight: 700 }}>{stats.fps} FPS</div>
            <div style={{ color: 'var(--slate-400)' }}>{entityCount} entities</div>
            <div style={{ color: 'var(--slate-500)' }}>{stats.frameTime}ms/frame</div>
        </div>
    );
};
