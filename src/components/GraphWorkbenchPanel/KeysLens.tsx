import React, { useMemo } from 'react';
import { keyService } from '../../kernel/instances';
import type { ApiKey } from '../../kernel/types/metrics-types';

const STATUS_COLOR: Record<string, string> = {
    active: '#22c55e',
    inactive: '#64748b',
    error: '#ef4444',
    checking: '#3b82f6',
    pending: '#3b82f6',
    quota_exhausted: '#f97316',
    invalid: '#7f1d1d',
    duplicate: '#7f1d1d',
    quarantined: '#7f1d1d',
    probation: '#f59e0b',
    compromised: '#b91c1c',
};

const ACTION_TO_STATUS: Record<string, string> = {
    added: 'active',
    probed: 'checking',
    quota_exceeded: 'quota_exhausted',
    error: 'error',
    rotated: 'active',
    status_changed: 'probation',
    latency_burst: 'probation',
    reputation_changed: 'probation',
    note_added: 'inactive',
};

interface Seg {
    from: number;
    to: number;
    status: string;
}

function buildSegments(key: ApiKey): Seg[] {
    const points: Array<{ t: number; status: string }> = [];
    const baseT = key.createdAt ?? Date.now() - 86400000 * 30;
    points.push({ t: baseT, status: 'pending' });
    (key.history || []).forEach((h) => {
        points.push({ t: h.timestamp, status: ACTION_TO_STATUS[h.action] ?? key.status });
    });
    (key.rotationHistory || []).forEach((r) => {
        points.push({ t: r.timestamp, status: r.toStatus });
    });
    points.sort((a, b) => a.t - b.t);
    const now = Date.now();
    if (points[points.length - 1].t < now) points.push({ t: now, status: key.status });

    const segs: Seg[] = [];
    for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        if (b.t <= a.t) continue;
        segs.push({ from: a.t, to: b.t, status: a.status });
    }
    return segs;
}

const ROW_H = 30;
const PAD_L = 150;
const PAD_R = 12;

const KeyRow: React.FC<{ keyObj: ApiKey; timeStart: number; timeEnd: number; rowIndex: number }> = ({ keyObj, timeStart, timeEnd, rowIndex }) => {
    const segs = useMemo(() => buildSegments(keyObj), [keyObj]);
    const W = 680;
    const span = Math.max(1, timeEnd - timeStart);
    const xOf = (t: number) => PAD_L + ((t - timeStart) / span) * (W - PAD_L - PAD_R);
    const y = rowIndex * ROW_H;
    const color = STATUS_COLOR[keyObj.status] ?? '#94a3b8';

    return (
        <g>
            <text x={4} y={y + 18} fontSize={12} fill="var(--slate-300)">
                {keyObj.provider} · {keyObj.label}
            </text>
            {segs.map((s, i) => (
                <rect
                    key={i}
                    x={xOf(s.from)}
                    y={y + 4}
                    width={Math.max(0.5, xOf(s.to) - xOf(s.from))}
                    height={12}
                    rx={3}
                    fill={STATUS_COLOR[s.status] ?? '#94a3b8'}
                    opacity={0.85}
                />
            ))}
            <circle cx={W - 8} cy={y + 10} r={5} fill={color} />
            <text x={W - 16} y={y + 14} textAnchor="end" fontSize={11} fill="var(--slate-400)">
                {keyObj.status}
            </text>
            <text x={PAD_L + 4} y={y + 28} fontSize={10} fill="var(--slate-500)">
                успех {keyObj.stats?.successCount ?? 0} · ошибок {keyObj.stats?.errorCount ?? 0} · avg {keyObj.stats?.avgLatency?.toFixed(0) ?? '—'} мс
            </text>
        </g>
    );
};

const KeysLens: React.FC = () => {
    const keys = useMemo(() => keyService.getKeys?.() ?? [], []);

    if (keys.length === 0) {
        return (
            <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                Нет ключей — добавь провайдера, чтобы увидеть жизненный цикл.
            </div>
        );
    }

    const timeEnd = Date.now();
    const timeStart = Math.min(...keys.map((k) => k.createdAt ?? timeEnd - 86400000 * 30), timeEnd - 86400000 * 30);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-300)' }}>Дорожки жизненного цикла ключей</div>
            <div style={{ overflowX: 'auto' }}>
                <svg width={680} height={keys.length * ROW_H + 8} viewBox={`0 0 680 ${keys.length * ROW_H + 8}`}>
                    {keys.map((k, i) => (
                        <KeyRow key={k.id} keyObj={k} timeStart={timeStart} timeEnd={timeEnd} rowIndex={i} />
                    ))}
                </svg>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--slate-300)' }}>
                {Object.entries(STATUS_COLOR).map(([s, c]) => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default KeysLens;
