import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Thermometer, Activity, AlertTriangle, CheckCircle, RefreshCw, Info, BarChart3 } from 'lucide-react';
import { PersonaDriftDetector, DEFAULT_DRIFT_THRESHOLD } from '../../kernel/services/debate-runtime/persona-drift-detector';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import type { DriftRecord } from '../../kernel/contracts/debate-drift';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';
import { agentService } from '../../kernel/instances/services-core';

type HistoryEntry = { agentId: string; agentName: string; round: number; content: string; record: DriftRecord };

export const DriftDetectorPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const personas = useMemo(() => {
        if (realAgents.length === 0) return [];
        return realAgents.slice(0, 12).map((a, idx) => {
            let systemPrompt: string | undefined;
            try {
                systemPrompt = (agentService as any).resolveAgent?.(a.id)?.systemPrompt ?? (agentService as any).resolveAgent?.(a.id)?.prompt;
            } catch { /* ignore */ }
            const role = (['pro', 'con', 'neutral'] as const)[idx % 3]!;
            return { id: a.id, name: a.name, role, systemPrompt: systemPrompt ?? `You are ${a.name}, ${a.role}.` };
        });
    }, [realAgents]);

    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();

    const detector = useMemo(() => new PersonaDriftDetector(DEFAULT_DRIFT_THRESHOLD), []);
    // keep detector in sync with real personas (real AgentService → register)
    useEffect(() => {
        detector.clearSession();
        for (const p of personas) detector.registerPersona(p.id, p.role, p.systemPrompt);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personas]);

    const [agentId, setAgentId] = useState<string>(() => personas[0]?.id ?? '');
    useEffect(() => {
        if (personas.length > 0 && !personas.some((p) => p.id === agentId)) setAgentId(personas[0]!.id);
    }, [personas, agentId]);
    const [round, setRound] = useState<number>(2);
    const [text, setText] = useState<string>('');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [last, setLast] = useState<DriftRecord | null>(null);

    const agentMeta = personas.find((a) => a.id === agentId) ?? personas[0]!;
    const selectedHistory = history.filter((h) => h.agentId === agentId);
    const driftCount = selectedHistory.filter((h) => h.record.isDrifting).length;
    const totalForAgent = selectedHistory.length;
    const lastForAgent = selectedHistory.length ? selectedHistory[selectedHistory.length - 1]!.record : null;

    const handleRecord = () => {
        const rec = detector.recordArgument(agentId, round, text);
        const name = personas.find((a) => a.id === agentId)?.name ?? agentId;
        setHistory((h) => [...h, { agentId, agentName: name, round, content: text, record: rec }]);
        setLast(rec);
        setRound((r) => r + 1);
    };

    const handleClear = () => {
        detector.clearSession();
        for (const p of personas) detector.registerPersona(p.id, p.role, p.systemPrompt);
        setHistory([]);
        setLast(null);
        setRound(2);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        const ids = Array.from(new Set(liveArgs.map((a) => a.agentId)));
        detector.clearSession();
        for (const id of ids) detector.registerPersona(id, 'neutral');
        const newHistory: HistoryEntry[] = liveArgs.map((a) => {
            const rec = detector.recordArgument(a.agentId, a.round, a.content);
            return { agentId: a.agentId, agentName: a.agentName, round: a.round, content: a.content, record: rec };
        });
        setHistory(newHistory);
        setAgentId(liveArgs[0]?.agentId ?? agentId);
        setLast(null);
        setRound(2);
    }, [liveArgs, detector, agentId]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    if (personas.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    No agents available — register agents in the topology to monitor persona drift.
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Thermometer size={22} color="#ef4444" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Drift Detector — {t('nav.drift_detector')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600 }}>P1.16</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Persona consistency monitor — heuristic persona drift: role markers <code style={{ color: '#f87171' }}>0.4</code> + persona keywords{' '}
                <code style={{ color: '#f87171' }}>0.3</code> + historical Jaccard <code style={{ color: '#f87171' }}>0.3</code> → driftScore
                <code style={{ color: '#f87171' }}> 0–1</code>, threshold <code style={{ color: '#f87171' }}>{DEFAULT_DRIFT_THRESHOLD}</code> (
                <code style={{ color: '#22c55e' }}>0 = perfect match</code>, <code style={{ color: '#ef4444' }}>1 = complete drift</code>). Short
                &lt;30 chars skips check (score 0).
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'end',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    flexWrap: 'wrap',
                }}
            >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Agent
                    <select
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: 'var(--slate-900)',
                            color: 'var(--slate-100)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: 13,
                        }}
                    >
                        {personas.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name} — {a.role}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Round
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={round}
                        onChange={(e) => setRound(parseInt(e.target.value) || 1)}
                        style={{
                            width: 70,
                            padding: '6px 8px',
                            borderRadius: 8,
                            background: 'var(--slate-900)',
                            color: 'var(--slate-100)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: 13,
                        }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 300 }}>
                    Content (≥30 chars triggers check; record a con-style argument for a pro persona to force drift)
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: 'var(--slate-900)',
                            color: 'var(--slate-100)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: 13,
                        }}
                    />
                </label>
                <Button variant="primary" onClick={handleRecord}>
                    Record
                </Button>
                <Button variant="ghost" onClick={handleClear}>
                    <RefreshCw size={14} /> Clear session
                </Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>
                    Load active debate ({liveArgs.length})
                </Button>
                <span style={{ fontSize: 12, color: 'var(--slate-500)', marginLeft: 'auto' }}>
                    {totalForAgent} turns ·{' '}
                    <strong style={{ color: driftCount ? '#f87171' : '#22c55e' }}>
                        {driftCount} drifting
                    </strong>{' '}
                    · last score {lastForAgent ? lastForAgent.driftScore.toFixed(2) : '—'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                {/* History */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: 'var(--slate-200)',
                            marginBottom: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <BarChart3 size={16} color="#ef4444" /> History — {selectedHistory.length} for {agentMeta.name}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', fontWeight: 400 }}>
                            {personas.length} personas registered
                        </span>
                    </div>
                    {selectedHistory.length === 0 ? (
                        <div
                            style={{
                                padding: 16,
                                textAlign: 'center',
                                color: 'var(--slate-500)',
                                fontSize: 13,
                                border: '1px dashed rgba(255,255,255,0.08)',
                                borderRadius: 8,
                            }}
                        >
                            No turns for {agentMeta.name} yet — record one above.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                            {selectedHistory
                                .slice()
                                .reverse()
                                .map((h, idx) => (
                                    <div
                                        key={`${h.round}-${idx}`}
                                        style={{
                                            padding: '8px 10px',
                                            borderRadius: 8,
                                            background: h.record.isDrifting ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                            border: `1px solid ${h.record.isDrifting ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {h.record.isDrifting ? <AlertTriangle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#22c55e" />}
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: h.record.isDrifting ? '#f87171' : '#22c55e',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {h.record.isDrifting ? 'DRIFTING' : 'consistent'}
                                                </span>
                                                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                                    {h.agentName} · r{h.round}
                                                </span>
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: h.record.isDrifting ? '#f87171' : '#22c55e' }}>
                                                {(h.record.driftScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {h.content.slice(0, 120)}
                                        </div>
                                        <div
                                            style={{
                                                height: 6,
                                                borderRadius: 3,
                                                background: 'rgba(255,255,255,0.08)',
                                                marginTop: 6,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${Math.min(100, h.record.driftScore * 100)}%`,
                                                    height: '100%',
                                                    background: h.record.isDrifting ? '#ef4444' : '#22c55e',
                                                    transition: 'width 0.3s',
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Info size={12} /> threshold {DEFAULT_DRIFT_THRESHOLD} · combined = role 0.4 + keyword 0.3 + history 0.3. See{' '}
                        <code style={{ color: '#f87171' }}>persona-drift-detector.ts:250</code>.
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: 'var(--slate-200)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Activity size={16} color="#ef4444" /> Last record — {last ? `${last.agentId} r${last.round}` : 'seed / none'}
                        </div>
                        {!last ? (
                            <div
                                style={{
                                    padding: 12,
                                    textAlign: 'center',
                                    color: 'var(--slate-500)',
                                    fontSize: 12,
                                    border: '1px dashed rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                }}
                            >
                                Click <strong>Record</strong> to compute persona drift for r{round}.
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: last.isDrifting ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                        border: `1px solid ${last.isDrifting ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 6,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {last.isDrifting ? <AlertTriangle size={16} color="#ef4444" /> : <CheckCircle size={16} color="#22c55e" />}
                                        <span style={{ fontSize: 13, fontWeight: 700, color: last.isDrifting ? '#f87171' : '#22c55e' }}>
                                            {last.isDrifting ? 'DRIFTING — out of character' : 'Consistent — in character'}
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: last.isDrifting ? '#f87171' : '#22c55e' }}>
                                            {(last.driftScore * 100).toFixed(1)}% · {last.isDrifting ? '≥' : '<'} {(DEFAULT_DRIFT_THRESHOLD * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)', minWidth: 60 }}>driftScore</span>
                                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${Math.min(100, last.driftScore * 100)}%`,
                                                    height: '100%',
                                                    background: last.isDrifting ? '#ef4444' : '#22c55e',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                        agent {last.agentId} · round {last.round} · stored as{' '}
                                        <code style={{ color: '#a78bfa' }}>{last.agentId}:{last.round}</code> via{' '}
                                        <code style={{ color: '#22c55e' }}>getDrift()</code>
                                    </div>
                                </div>
                                {(() => {
                                    const fetched = detector.getDrift(last.agentId, last.round);
                                    return fetched ? (
                                        <div style={{ fontSize: 11, color: 'var(--slate-500)', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            getDrift({last.agentId}, {last.round}) → score {fetched.driftScore.toFixed(2)} · {fetched.isDrifting ? 'drifting' : 'ok'}
                                        </div>
                                    ) : null;
                                })()}
                            </>
                        )}
                    </div>

                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Thermometer size={16} color="#f87171" /> Persona — {agentMeta.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.1)', color: '#f87171', fontWeight: 600 }}>{agentMeta.role}</span>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                keywords from prompt (≈{agentMeta.systemPrompt.split(/\s+/).filter((w) => w.length >= 4).length} terms)
                            </span>
                        </div>
                        <div
                            style={{
                                padding: '8px 10px',
                                borderRadius: 8,
                                background: 'var(--slate-900)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: 11,
                                color: 'var(--slate-400)',
                                lineHeight: 1.4,
                                maxHeight: 90,
                                overflowY: 'auto',
                            }}
                        >
                            {agentMeta.systemPrompt}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Registered via <code style={{ color: '#f87171' }}>registerPersona(id, role, prompt)</code> at mount. Switch agent to test cross-role drift.
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 12,
                            borderRadius: 10,
                            background: 'rgba(15,23,42,0.4)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            lineHeight: 1.5,
                        }}
                    >
                        <strong style={{ color: 'var(--slate-300)' }}>How drift is computed:</strong>
                        <br />
                        • <strong>Role</strong> — fraction of role-specific markers present (PRO: because/therefore/supports/evidence/advantage… CON: however/against/undermines/fails/risk… NEUTRAL: analyze/balance/trade-off…).
                        <br />• <strong>Keyword</strong> — fraction of persona prompt keywords (≥4 chars) present.
                        <br />• <strong>History</strong> — Jaccard token overlap vs accumulated prior arguments; &lt;0.05 → 0, &gt;0.7 → penalised.
                        <br />Combined 0.4/0.3/0.3 → drift = 1−combined. No LLM.
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default DriftDetectorPanel;
