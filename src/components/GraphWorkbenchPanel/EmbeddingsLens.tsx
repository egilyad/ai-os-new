import React, { useMemo, useState } from 'react';
import { memoryService } from '../../kernel/instances';

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Point {
    id: string;
    text: string;
    type: string;
    x: number;
    y: number;
    dims: number;
}

const TYPE_COLOR: Record<string, string> = {
    episodic: '#22d3ee',
    semantic: '#a78bfa',
    working: '#f59e0b',
    note: '#34d399',
    lesson: '#f472b6',
    issue: '#f87171',
    decision: '#60a5fa',
    default: '#94a3b8',
};

const W = 640;
const H = 400;
const PAD = 20;

const EmbeddingsLens: React.FC = () => {
    const [hover, setHover] = useState<Point | null>(null);

    const { points, dim, total, projected } = useMemo(() => {
        let entries: Array<Record<string, unknown>> = [];
        try {
            entries = (memoryService.getMemories?.() ?? []) as Array<Record<string, unknown>>;
        } catch {
            entries = [];
        }
        const withVec = entries.filter(
            (e) => Array.isArray(e.vector) || Array.isArray(e.embedding),
        );
        const dims = withVec[0]
            ? ((withVec[0].vector as number[])?.length ||
                  (withVec[0].embedding as number[])?.length ||
                  384)
            : 384;

        const rnd = mulberry32(1337);
        const r1: number[] = [];
        const r2: number[] = [];
        for (let i = 0; i < dims; i += 1) {
            r1.push(rnd() * 2 - 1);
            r2.push(rnd() * 2 - 1);
        }

        const raw: Point[] = withVec.map((e) => {
            const v = ((e.vector as number[]) ?? (e.embedding as number[])) as number[];
            let x = 0;
            let y = 0;
            for (let i = 0; i < v.length; i += 1) {
                x += v[i] * (r1[i] ?? 0);
                y += v[i] * (r2[i] ?? 0);
            }
            return {
                id: String(e.id ?? ''),
                text: String(e.content ?? e.text ?? '').slice(0, 90),
                type: String(e.type ?? 'default'),
                x,
                y,
                dims: v.length,
            };
        });

        let xs = raw.map((p) => p.x);
        let ys = raw.map((p) => p.y);
        if (xs.length === 0) {
            xs = [0];
            ys = [0];
        }
        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);
        const xSpan = xMax - xMin || 1;
        const ySpan = yMax - yMin || 1;

        const scaled = raw.map((p) => ({
            ...p,
            x: PAD + ((p.x - xMin) / xSpan) * (W - PAD * 2),
            y: PAD + ((p.y - yMin) / ySpan) * (H - PAD * 2),
        }));

        return { points: scaled, dim: dims, total: entries.length, projected: withVec.length };
    }, []);

    if (projected === 0) {
        return (
            <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                Нет записей памяти с эмбеддингами — включи семантический режим, чтобы появились векторы.
            </div>
        );
    }

    const usedColors = new Set(points.map((p) => p.type));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-300)' }}>
                Карта эмбеддингов памяти
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                {projected} записей с векторами (dims {dim}) из {total} · проекция: случайная 2D (детерминированная)
            </div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                {points.map((p) => (
                    <circle
                        key={p.id}
                        cx={p.x}
                        cy={p.y}
                        r={4}
                        fill={TYPE_COLOR[p.type] ?? TYPE_COLOR.default}
                        opacity={0.85}
                        onMouseEnter={() => setHover(p)}
                        onMouseLeave={() => setHover(null)}
                    >
                        <title>{`${p.type} · ${p.text}`}</title>
                    </circle>
                ))}
            </svg>
            {hover && (
                <div style={{ position: 'fixed', zIndex: 20, pointerEvents: 'none', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--slate-200)', fontSize: 12, maxWidth: 320, maxHeight: 140, overflow: 'hidden' }}>
                    <b>{hover.type}</b> · dims {hover.dims}
                    <div style={{ marginTop: 4, color: 'var(--slate-400)' }}>{hover.text}</div>
                </div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--slate-300)' }}>
                {[...usedColors].map((t) => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLOR[t] ?? TYPE_COLOR.default }} />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default EmbeddingsLens;
