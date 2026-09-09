import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckCircle, AlertTriangle, RefreshCw, Info, BarChart3, Link2 } from 'lucide-react';
import { JustificationEnforcer, DEFAULT_MIN_HOPS } from '../../kernel/services/debate-runtime/justification-enforcer';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import type { JustificationChain } from '../../kernel/contracts/debate-justification';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const HOP_COLOR: Record<string, string> = {
    claim: '#8b5cf6',
    warrant: '#06b6d4',
    evidence: '#22c55e',
    backing: '#f59e0b',
};

export const JustificationPanel: React.FC = () => {
    const { t } = useTranslation();
    const enforcer = useMemo(() => new JustificationEnforcer(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    if (agents.length === 0) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Justification — {t('nav.justification')}</h2>
                <div style={{ marginTop: 16, padding: 16, color: 'var(--slate-400)' }}>No agents available</div>
            </div>
        );
    }
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) {
            setAgentId(agents[0]?.id ?? '');
        }
    }, [agents, agentId]);
    const [round, setRound] = useState<number>(2);
    const [minHops, setMinHops] = useState<number>(DEFAULT_MIN_HOPS);
    const [text, setText] = useState<string>('');
    const [chain, setChain] = useState<JustificationChain | null>(null);
    const [history, setHistory] = useState<JustificationChain[]>(() => []);

    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();

    const handleAnalyze = () => {
        const c = enforcer.analyzeArgument(agentId, round, text, minHops);
        setChain(c);
        setHistory((h) => [...h, c]);
        setRound((r) => r + 1);
    };

    const handleClear = () => {
        enforcer.clearSession();
        setChain(null);
        setHistory([]);
        setRound(2);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        const chains = liveArgs.map((a) => enforcer.analyzeArgument(a.agentId, a.round, a.content, minHops));
        setHistory(chains);
        setChain(chains[chains.length - 1] ?? null);
        setAgentId(liveArgs[0]?.agentId ?? agentId);
        const maxRound = liveArgs.reduce((m, a) => Math.max(m, a.round), 0);
        setRound(maxRound + 1);
    }, [liveArgs, enforcer, minHops, agentId]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const promptPreview = useMemo(() => {
        if (!chain || chain.isValid) return null;
        return `### Multi-Hop Justification Required\nYou MUST structure your argument with at least ${minHops} linked steps:\n1. CLAIM — state your position\n2. WARRANT — explain WHY\n3. EVIDENCE — support with data\nSingle-step assertions will be penalized.`;
    }, [chain, minHops]);

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClipboardList size={22} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Justification — {t('nav.justification')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', fontWeight: 600 }}>P1.23</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Multi-hop justification validator — detects <code style={{ color: '#a855f7' }}>claim → warrant → evidence → backing</code> per sentence &gt;15 chars. Valid if{' '}
                <code style={{ color: '#22c55e' }}>hopCount ≥ minHops ({DEFAULT_MIN_HOPS} default)</code>. Markers: claim (<code>i argue/my position</code>), warrant (
                <code>because/since</code>), evidence (<code>study/data/year/%/figure</code>), backing (<code>furthermore/besides</code>).
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'end',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(168,85,247,0.15)',
                    flexWrap: 'wrap',
                }}
            >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Agent
                    <select
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    >
                        {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
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
                        style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Min hops
                    <input
                        type="number"
                        min={1}
                        max={4}
                        value={minHops}
                        onChange={(e) => setMinHops(parseInt(e.target.value) || 2)}
                        style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}
                    />
                </label>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="primary" onClick={handleAnalyze}>
                        <Link2 size={14} /> Analyze
                    </Button>
                    <Button variant="ghost" onClick={handleClear}>
                        <RefreshCw size={14} /> Clear
                    </Button>
                    <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>
                        Load active debate ({liveArgs.length})
                    </Button>
                </span>
                <span style={{ fontSize: 11, color: 'var(--slate-500)', width: '100%' }}>
                    sentences &gt;15 chars split by <code>.!?</code> → first matching hop per sentence, one per type max.
                </span>
            </div>

            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8 }}>Input text</div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, resize: 'vertical', lineHeight: 1.5 }}
                />
            </div>

            {text.length === 0 && !chain && (
                <div style={{ padding: 12, fontSize: 13, color: 'var(--slate-400)', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                    No active debate — start or open one to analyze, or type an argument and click Analyze.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                {/* Left: chain */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChart3 size={16} color="#a855f7" /> Chain — {chain ? `${chain.hopCount}/${minHops} hops` : 'not analyzed'}
                        {chain && (
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: chain.isValid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: chain.isValid ? '#22c55e' : '#f87171',
                                    fontWeight: 700,
                                }}
                            >
                                {chain.isValid ? 'VALID' : 'INVALID'}
                            </span>
                        )}
                    </div>
                    {!chain ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                            Click Analyze to validate multi-hop chain.
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                                {(['claim', 'warrant', 'evidence', 'backing'] as const).map((h) => {
                                    const found = chain.hops.some((x) => x.type === h);
                                    return (
                                        <span
                                            key={h}
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                background: found ? `${HOP_COLOR[h]}18` : 'rgba(255,255,255,0.04)',
                                                color: found ? HOP_COLOR[h] : 'var(--slate-500)',
                                                border: `1px solid ${found ? HOP_COLOR[h] + '44' : 'rgba(255,255,255,0.06)'}`,
                                            }}
                                        >
                                            {found ? '✓' : '✗'} {h}
                                        </span>
                                    );
                                })}
                                <span style={{ fontSize: 11, color: 'var(--slate-500)', marginLeft: 'auto', padding: '4px 6px' }}>
                                    {chain.agentId} r{chain.round}
                                </span>
                            </div>
                            {chain.hops.length === 0 ? (
                                <div style={{ padding: 12, textAlign: 'center', color: '#f87171', fontSize: 12, border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, background: 'rgba(239,68,68,0.06)' }}>
                                    No hops detected — sentences too short (&lt;15) or no markers. Need at least {minHops}.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {chain.hops.map((h, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: `1px solid ${HOP_COLOR[h.type]}33`, borderLeft: `3px solid ${HOP_COLOR[h.type]}` }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: HOP_COLOR[h.type], borderRadius: 4, padding: '2px 6px', minWidth: 62, textAlign: 'center' }}>{h.type}</span>
                                            <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-300)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {chain.missingTypes.length > 0 && (
                                <div style={{ marginTop: 8, fontSize: 11, color: '#f87171', padding: '6px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                    Missing: {chain.missingTypes.join(', ')} — add sentences with those markers to reach {minHops}.
                                </div>
                            )}
                        </>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Info size={12} /> one per type max, order-agnostic per sentence. See <code style={{ color: '#c4b5fd' }}>justification-enforcer.ts:46</code>.
                    </div>
                </div>

                {/* Right: prompt + history */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {chain?.isValid ? <CheckCircle size={16} color="#22c55e" /> : <AlertTriangle size={16} color="#f59e0b" />} Prompt injection
                        </div>
                        {chain?.isValid || !chain ? (
                            <div style={{ padding: 12, textAlign: 'center', color: chain?.isValid ? '#22c55e' : 'var(--slate-500)', fontSize: 12, border: `1px ${chain?.isValid ? 'solid rgba(34,197,94,0.2)' : 'dashed rgba(255,255,255,0.08)'}`, borderRadius: 8, background: chain?.isValid ? 'rgba(34,197,94,0.06)' : 'transparent' }}>
                                {chain?.isValid ? 'Valid — no injection needed.' : 'Invalid chains get injected: show prompt preview after Analyze.'}
                            </div>
                        ) : (
                            <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: '#fca5a5', fontSize: 11, whiteSpace: 'pre-wrap', lineHeight: 1.4, border: '1px solid rgba(239,68,68,0.2)' }}>{promptPreview}</pre>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Injected when <code>hopCount &lt; minHops</code> via <code style={{ color: '#c4b5fd' }}>debate-prompt-builder.ts:136</code> (<code>Multi-Hop Justification Required</code>).
                        </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ClipboardList size={16} color="#a855f7" /> History — {history.length}
                        </div>
                        {history.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No history.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                                {history
                                    .slice()
                                    .reverse()
                                    .slice(0, 8)
                                    .map((c, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setChain(c)}
                                            style={{
                                                padding: '6px 8px',
                                                borderRadius: 6,
                                                background: chain === c ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${chain === c ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>
                                                {c.agentId} r{c.round}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: c.isValid ? '#22c55e' : '#f87171' }}>{c.hopCount} hops</span>
                                            <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.hops.map((h) => h.type).join('→') || '∅'}</span>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.isValid ? '#22c55e' : '#ef4444' }} />
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default JustificationPanel;
