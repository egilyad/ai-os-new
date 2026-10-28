import React from 'react';
import { memoryService } from '../../kernel/instances';
import { agentService, sessionManager } from '../../kernel/instances';

const TYPE_COLOR: Record<string, string> = {
    episodic: '#22d3ee',
    semantic: '#a78bfa',
    working: '#f59e0b',
    note: '#34d399',
    lesson: '#f472b6',
    issue: '#f87171',
    decision: '#60a5fa',
    default: '#64748b',
};

function safeCall<T>(fn: () => T, fallback: T): T {
    try {
        return fn();
    } catch {
        return fallback;
    }
}

const CELL = 11;
const GAP = 1;
const COLS = 60;
const ROWS = 26;

const CoverageLens: React.FC = () => {
    const memStats = safeCall(() => memoryService.getStats?.(), null);
    const agents = safeCall(() => agentService.getAgents?.(), []);
    const sessions = safeCall(() => sessionManager.getDebateHistory?.(), []);

    const byType = memStats?.byType ?? {};
    const total = memStats?.totalEntries ?? 0;
    const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);

    const maxCells = COLS * ROWS;
    let usedCells = 0;
    const cells = typeEntries.map(([t, count]) => {
        const area = Math.max(1, Math.round((count / Math.max(1, total)) * maxCells));
        usedCells += area;
        return { type: t, count, area };
    });

    // normalize overshoot
    const normFactor = usedCells > maxCells ? maxCells / usedCells : 1;
    const normalized = cells.map((c) => ({ ...c, area: Math.max(1, Math.round(c.area * normFactor)) }));

    const W = COLS * (CELL + GAP) + GAP;
    const H = ROWS * (CELL + GAP) + GAP;

    const rects: Array<{ x: number; y: number; type: string }> = [];
    let cellIndex = 0;
    normalized.forEach((c) => {
        const limit = Math.min(c.area, maxCells - cellIndex);
        for (let i = 0; i < limit; i += 1) {
            const col = cellIndex % COLS;
            const row = Math.floor(cellIndex / COLS);
            rects.push({ x: GAP + col * (CELL + GAP), y: GAP + row * (CELL + GAP), type: c.type });
            cellIndex += 1;
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-300)' }}>
                Карта покрытия памяти (treemap)
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--slate-400)' }}>
                <span>записей: <b>{total}</b></span>
                <span>агентов: <b>{agents.length}</b></span>
                <span>дебат-сессий: <b>{sessions.length}</b></span>
            </div>

            {typeEntries.length === 0 ? (
                <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                    Нет записей памяти — добавь заметки или результаты исследований.
                </div>
            ) : (
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {rects.map((r, i) => (
                        <rect key={i} x={r.x} y={r.y} width={CELL} height={CELL} rx={2} fill={TYPE_COLOR[r.type] ?? TYPE_COLOR.default} opacity={0.85} />
                    ))}
                </svg>
            )}

            {typeEntries.length > 0 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--slate-300)' }}>
                    {typeEntries.map(([t, count]) => (
                        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: TYPE_COLOR[t] ?? TYPE_COLOR.default }} />
                            {t} · {count}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoverageLens;
