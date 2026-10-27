import React, { useMemo, useState } from 'react';
import { sessionManager } from '../../kernel/instances';
import type { DebateSession } from '../../kernel/contracts/debate-types';

const COLORS = ['#22d3ee', '#a78bfa', '#f59e0b', '#34d399', '#f472b6', '#60a5fa', '#f87171', '#4ade80'];

function dirOf(role?: string): number {
    if (!role) return 0;
    const r = role.toLowerCase();
    if (r.includes('pro')) return 1;
    if (r.includes('opp') || r.includes('con')) return -1;
    return 0;
}

interface TrajPoint {
    round: number;
    pos: number;
}

interface Traj {
    agentName: string;
    color: string;
    points: TrajPoint[];
}

function buildTrajectories(session: DebateSession): Traj[] {
    const byAgent = new Map<string, Array<{ round: number; pos: number }>>();
    (session.arguments || []).forEach((a) => {
        const arr = byAgent.get(a.agentName) ?? [];
        arr.push({ round: a.round, pos: dirOf(a.position) * (a.confidence ?? 0) });
        byAgent.set(a.agentName, arr);
    });
    const trajs: Traj[] = [];
    let ci = 0;
    byAgent.forEach((pts, name) => {
        pts.sort((p, q) => p.round - q.round);
        trajs.push({ agentName: name, color: COLORS[ci % COLORS.length] ?? '#94a3b8', points: pts });
        ci += 1;
    });
    return trajs;
}

interface AgreementRow {
    a: string;
    b: string;
    agree: number;
    total: number;
}

function agreementMatrix(trajs: Traj[]): AgreementRow[] {
    const rows: AgreementRow[] = [];
    for (let i = 0; i < trajs.length; i += 1) {
        const trA = trajs[i];
        if (!trA) continue;
        for (let j = i + 1; j < trajs.length; j += 1) {
            const trB = trajs[j];
            if (!trB) continue;
            const A = new Map(trA.points.map((p) => [p.round, p.pos]));
            const B = new Map(trB.points.map((p) => [p.round, p.pos]));
            let agree = 0;
            let total = 0;
            A.forEach((pa, round) => {
                const pb = B.get(round);
                if (pb === undefined) return;
                total += 1;
                if (Math.sign(pa) === Math.sign(pb)) agree += 1;
            });
            if (total > 0) rows.push({ a: trA.agentName, b: trB.agentName, agree, total });
        }
    }
    return rows;
}

const TrajChart: React.FC<{ trajs: Traj[] }> = ({ trajs }) => {
    const W = 620;
    const H = 200;
    const PAD = 28;
    const maxRound = Math.max(1, ...trajs.flatMap((t) => t.points.map((p) => p.round)));
    const roundStep = (W - PAD * 2) / maxRound;
    const xOf = (r: number) => PAD + (r - 1) * roundStep;
    const yOf = (pos: number) => H / 2 - (pos * (H / 2 - 14));

    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            <line
                x1={PAD}
                y1={yOf(0)}
                x2={W - PAD}
                y2={yOf(0)}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
            />
            {Array.from({ length: maxRound }, (_, i) => i + 1).map((r) => (
                <text key={r} x={xOf(r)} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--slate-500)">
                    {r}
                </text>
            ))}
            {trajs.map((t) => (
                <polyline
                    key={t.agentName}
                    points={t.points.map((p) => `${xOf(p.round).toFixed(1)},${yOf(p.pos).toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke={t.color}
                    strokeWidth={2}
                />
            ))}
        </svg>
    );
};

const DebateLens: React.FC = () => {
    const all = useMemo(() => sessionManager.getDebateHistory?.() ?? [], []);
    const [selectedId, setSelectedId] = useState<string>(all[0]?.id ?? '');
    const session = all.find((s) => s.id === selectedId) ?? all[0];

    const trajs = useMemo(() => (session ? buildTrajectories(session) : []), [session]);
    const agreements = useMemo(
        () => (session && trajs.length > 1 ? agreementMatrix(trajs) : []),
        [session, trajs],
    );

    if (all.length === 0) {
        return (
            <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                Нет проведённых дебатов — запусти дебаты, чтобы увидеть траектории позиций.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, color: 'var(--slate-400)' }}>Сессия</label>
                <select
                    value={session?.id ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: 13,
                        maxWidth: 320,
                    }}
                >
                    {all.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.topic.slice(0, 60)} · {s.strategy}
                        </option>
                    ))}
                </select>
                {session && (
                    <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                        сходимость {session.convergenceScore?.toFixed(2) ?? '—'} · раундов {session.currentRound ?? session.maxRounds}
                    </span>
                )}
                {session && session.status === 'completed' && session.currentRound < session.maxRounds && (
                    <span
                        style={{
                            fontSize: 11,
                            color: '#34d399',
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: 'rgba(52,211,153,0.12)',
                            border: '1px solid rgba(52,211,153,0.25)',
                        }}
                    >
                        досрочное завершение (сходимость)
                    </span>
                )}
            </div>

            {trajs.length > 0 && (
                <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-300)' }}>Траектории позиций (−1 con … +1 pro)</div>
                    <TrajChart trajs={trajs} />
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {trajs.map((t) => (
                            <span key={t.agentName} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--slate-300)' }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
                                {t.agentName}
                            </span>
                        ))}
                    </div>
                </>
            )}

            {agreements.length > 0 && (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-300)', marginBottom: 6 }}>Согласие участников</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {agreements.map((row) => (
                            <div key={`${row.a}-${row.b}`} style={{ padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                                <div style={{ fontSize: 12, color: 'var(--slate-300)' }}>
                                    {row.a} ↔ {row.b}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2 }}>
                                    {Math.round((row.agree / row.total) * 100)}%
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                    согласие {row.agree}/{row.total} раундов
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebateLens;
