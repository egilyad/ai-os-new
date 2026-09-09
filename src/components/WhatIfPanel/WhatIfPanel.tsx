/**
 * Cognitive-aux / research panel (Experimental).
 * What-if simulation surface — research-grade, not production surface (P1.21).
 */
import React, { useState, useCallback } from 'react';
import { usePolling } from '../Common/usePolling';
import {
    GitBranch,
    Users,
    DollarSign,
    Server,
    Shuffle,
    Play,
    RotateCcw,
    AlertTriangle,
    Loader2,
    Zap,
} from 'lucide-react';
import { whatIfService } from '../../kernel/instances';
import { debateEngine } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';

type SimType = 'topology' | 'participant' | 'budget' | 'provider' | 'strategy';

interface SimResult {
    type: SimType;
    label: string;
    result: Record<string, unknown>;
    recommendation: string;
}

const SECTION_HEADER: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--slate-500)',
    marginBottom: '0.75rem',
};

const CARD: React.CSSProperties = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
};

const INPUT: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(148,163,184,0.15)',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box',
};

const SELECT: React.CSSProperties = { ...INPUT, cursor: 'pointer' };

const BTN: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};

const BADGE: React.CSSProperties = {
    padding: '0.2rem 0.5rem',
    borderRadius: 4,
    fontSize: '0.65rem',
    fontWeight: 600,
};

const TOPOLOGIES = ['linear', 'roundtable', 'judge', 'tree-of-thought', 'red-blue'];
const STRATEGIES = ['latency', 'reliability', 'balanced', 'cost', 'race', 'broadcast'];

const WhatIfPanel: React.FC = () => {
    useTranslation();
    const [sessions, setSessions] = useState<Array<{ id: string; topic: string }>>([]);
    const [results, setResults] = useState<SimResult[]>([]);
    const [running, setRunning] = useState<string | null>(null);

    const [topoSession, setTopoSession] = useState('');
    const [topoType, setTopoType] = useState('roundtable');
    const [partSession, setPartSession] = useState('');
    const [partCount, setPartCount] = useState(1);
    const [budgetSession, setBudgetSession] = useState('');
    const [budgetAmount, setBudgetAmount] = useState(150000);
    const [currProvider, setCurrProvider] = useState('openai');
    const [propProvider, setPropProvider] = useState('anthropic');
    const [currStrategy, setCurrStrategy] = useState('balanced');
    const [propStrategy, setPropStrategy] = useState('cost');

    usePolling(() => {
        const sessions_ = debateEngine.getActiveSessions() ?? [];
        setSessions(sessions_.map((s) => ({ id: s.id, topic: s.topic ?? '' })));
    }, 10000);

    const runSim = useCallback(async (type: SimType, label: string, fn: () => Promise<unknown>) => {
        setRunning(type);
        try {
            const result = await fn();
            const r = result as Record<string, unknown>;
            setResults((prev) =>
                [
                    {
                        type,
                        label,
                        result: r,
                        recommendation: (r.recommendation || '') as string,
                    },
                    ...prev,
                ].slice(0, 20),
            );
        } finally {
            setRunning(null);
        }
    }, []);

    return (
        <div
            style={{
                padding: 20,
                maxWidth: 1400,
                margin: '0 auto',
                height: '100%',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Shuffle size={22} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>What-If Simulation</h2>
            </div>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                Simulate topology, participant, budget, provider, and strategy changes
            </p>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <div style={CARD}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
                    >
                        <GitBranch size={16} color="#a78bfa" />
                        <div style={SECTION_HEADER}>Topology Change</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select
                            value={topoSession}
                            onChange={(e) => setTopoSession(e.target.value)}
                            style={SELECT}
                        >
                            <option value="">Select session...</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.topic.slice(0, 40)}
                                </option>
                            ))}
                        </select>
                        <select
                            value={topoType}
                            onChange={(e) => setTopoType(e.target.value)}
                            style={SELECT}
                        >
                            {TOPOLOGIES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                        <button
                            disabled={!topoSession || running === 'topology'}
                            onClick={() =>
                                runSim('topology', `${topoType} topology`, () =>
                                    whatIfService.simulateTopologyChange(topoSession, topoType),
                                )
                            }
                            style={{
                                ...BTN,
                                background: 'rgba(139,92,246,0.2)',
                                color: 'var(--purple-muted)',
                                opacity: running === 'topology' ? 0.5 : 1,
                            }}
                        >
                            {running === 'topology' ? (
                                <Loader2 size={14} className="spin" />
                            ) : (
                                <Play size={14} />
                            )}{' '}
                            Simulate
                        </button>
                    </div>
                </div>

                <div style={CARD}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
                    >
                        <Users size={16} color="#10b981" />
                        <div style={SECTION_HEADER}>Participant Change</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select
                            value={partSession}
                            onChange={(e) => setPartSession(e.target.value)}
                            style={SELECT}
                        >
                            <option value="">Select session...</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.topic.slice(0, 40)}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min={1}
                            max={10}
                            value={partCount}
                            onChange={(e) => setPartCount(Number(e.target.value))}
                            style={INPUT}
                        />
                        <button
                            disabled={!partSession || running === 'participant'}
                            onClick={() =>
                                runSim('participant', `+${partCount} agents`, () =>
                                    whatIfService.simulateParticipantChange(partSession, partCount),
                                )
                            }
                            style={{
                                ...BTN,
                                background: 'rgba(16,185,129,0.2)',
                                color: 'var(--success)',
                                opacity: running === 'participant' ? 0.5 : 1,
                            }}
                        >
                            {running === 'participant' ? (
                                <Loader2 size={14} className="spin" />
                            ) : (
                                <Play size={14} />
                            )}{' '}
                            Simulate
                        </button>
                    </div>
                </div>

                <div style={CARD}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
                    >
                        <DollarSign size={16} color="#f59e0b" />
                        <div style={SECTION_HEADER}>Budget Change</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select
                            value={budgetSession}
                            onChange={(e) => setBudgetSession(e.target.value)}
                            style={SELECT}
                        >
                            <option value="">Select session...</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.topic.slice(0, 40)}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            min={1000}
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(Number(e.target.value))}
                            style={INPUT}
                        />
                        <button
                            disabled={!budgetSession || running === 'budget'}
                            onClick={() =>
                                runSim('budget', `$${budgetAmount.toLocaleString()}`, () =>
                                    whatIfService.simulateBudgetChange(budgetSession, budgetAmount),
                                )
                            }
                            style={{
                                ...BTN,
                                background: 'rgba(245,158,11,0.2)',
                                color: 'var(--warning)',
                                opacity: running === 'budget' ? 0.5 : 1,
                            }}
                        >
                            {running === 'budget' ? (
                                <Loader2 size={14} className="spin" />
                            ) : (
                                <Play size={14} />
                            )}{' '}
                            Simulate
                        </button>
                    </div>
                </div>

                <div style={CARD}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
                    >
                        <Server size={16} color="#3b82f6" />
                        <div style={SECTION_HEADER}>Provider Change</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                            value={currProvider}
                            onChange={(e) => setCurrProvider(e.target.value)}
                            placeholder="Current provider"
                            style={INPUT}
                        />
                        <input
                            value={propProvider}
                            onChange={(e) => setPropProvider(e.target.value)}
                            placeholder="Proposed provider"
                            style={INPUT}
                        />
                        <button
                            disabled={running === 'provider'}
                            onClick={() =>
                                runSim('provider', `${currProvider} → ${propProvider}`, () =>
                                    whatIfService.simulateProviderChange(
                                        currProvider,
                                        propProvider,
                                    ),
                                )
                            }
                            style={{
                                ...BTN,
                                background: 'rgba(59,130,246,0.2)',
                                color: 'var(--accent)',
                                opacity: running === 'provider' ? 0.5 : 1,
                            }}
                        >
                            {running === 'provider' ? (
                                <Loader2 size={14} className="spin" />
                            ) : (
                                <Play size={14} />
                            )}{' '}
                            Simulate
                        </button>
                    </div>
                </div>

                <div style={CARD}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}
                    >
                        <Shuffle size={16} color="#a855f7" />
                        <div style={SECTION_HEADER}>Strategy Change</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select
                            value={currStrategy}
                            onChange={(e) => setCurrStrategy(e.target.value)}
                            style={SELECT}
                        >
                            {STRATEGIES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <select
                            value={propStrategy}
                            onChange={(e) => setPropStrategy(e.target.value)}
                            style={SELECT}
                        >
                            {STRATEGIES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <button
                            disabled={running === 'strategy'}
                            onClick={() =>
                                runSim('strategy', `${currStrategy} → ${propStrategy}`, () =>
                                    whatIfService.simulateStrategyChange(
                                        currStrategy,
                                        propStrategy,
                                    ),
                                )
                            }
                            style={{
                                ...BTN,
                                background: 'rgba(168,85,247,0.2)',
                                color: '#a855f7',
                                opacity: running === 'strategy' ? 0.5 : 1,
                            }}
                        >
                            {running === 'strategy' ? (
                                <Loader2 size={14} className="spin" />
                            ) : (
                                <Play size={14} />
                            )}{' '}
                            Simulate
                        </button>
                    </div>
                </div>
            </div>

            {results.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={16} color="#f59e0b" />
                            <div style={SECTION_HEADER}>Simulation Results</div>
                        </div>
                        <button
                            onClick={() => setResults([])}
                            style={{
                                ...BTN,
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--slate-400)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <RotateCcw size={14} /> Clear
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {results.map((r, _i) => (
                            <div
                                key={`${r.type}-${r.label}`}
                                style={{
                                    ...CARD,
                                    borderLeft: `3px solid ${r.type === 'topology' ? '#a78bfa' : r.type === 'participant' ? '#10b981' : r.type === 'budget' ? '#f59e0b' : r.type === 'provider' ? '#3b82f6' : '#a855f7'}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 6,
                                    }}
                                >
                                    <span
                                        style={{
                                            ...BADGE,
                                            background: 'rgba(139,92,246,0.15)',
                                            color: 'var(--purple-muted)',
                                        }}
                                    >
                                        {r.type}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                                        {r.label}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 4,
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-300)',
                                        marginBottom: 6,
                                    }}
                                >
                                    {Object.entries(r.result)
                                        .filter(([k]) => k !== 'recommendation')
                                        .map(([k, v]) => (
                                            <div key={k}>
                                                <span style={{ color: 'var(--slate-500)' }}>{k}: </span>
                                                <span>
                                                    {typeof v === 'number'
                                                        ? v.toFixed(3)
                                                        : String(v).slice(0, 60)}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                                {r.recommendation && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 6,
                                            alignItems: 'flex-start',
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-400)',
                                            paddingTop: 6,
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <AlertTriangle
                                            size={12}
                                            style={{ marginTop: 2, flexShrink: 0 }}
                                        />
                                        <span>{r.recommendation}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ModuleInfo moduleKey="what_if" relatedModules={['debate_runtime', 'agents']} />
        </div>
    );
};

export default WhatIfPanel;
