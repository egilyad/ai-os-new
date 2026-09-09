import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Terminal, Brain, Eye, CheckCircle, AlertTriangle, RefreshCw, Info, BarChart3, Lightbulb } from 'lucide-react';
import { LogicalFormExtractor } from '../../kernel/services/debate-runtime/logical-form-extractor';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import type { LogicalForm } from '../../kernel/contracts/debate-logic';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const TYPE_COLOR: Record<string, string> = {
    cause_effect: '#06b6d4',
    hypothetical_syllogism: '#8b5cf6',
    disjunctive_syllogism: '#f59e0b',
    categorical_syllogism: '#22c55e',
    analogy: '#ec4899',
    modus_ponens: '#a78bfa',
    modus_tollens: '#ef4444',
    authority: '#f97316',
    generalization: '#64748b',
    unknown: '#78716c',
};

export const LogicalFormPanel: React.FC = () => {
    const { t } = useTranslation();
    const extractor = useMemo(() => new LogicalFormExtractor(), []);
    const realAgents = useRealAgents();
    const agents = realAgents;
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) {
            setAgentId(agents[0]?.id ?? '');
        }
    }, [agents, agentId]);
    const [round, setRound] = useState<number>(2);
    const [text, setText] = useState<string>('');
    const [form, setForm] = useState<LogicalForm | null>(null);
    const [history, setHistory] = useState<Array<{ agentId: string; round: number; content: string; form: LogicalForm | null }>>([]);

    const { args: liveArgs, sessionId, hasLiveDebate } = useDebateArguments();

    const handleAnalyze = () => {
        const res = extractor.analyzeArgument(agentId, round, text);
        setForm(res);
        setHistory((h) => [...h, { agentId, round, content: text, form: res }]);
        setRound((r) => r + 1);
    };

    const handleClear = () => {
        extractor.clearSession();
        setForm(null);
        setHistory([]);
        setRound(2);
    };

    const loadDebate = useCallback(() => {
        if (!liveArgs.length) return;
        const newHistory = liveArgs.map((a) => ({
            agentId: a.agentId,
            round: a.round,
            content: a.content,
            form: extractor.analyzeArgument(a.agentId, a.round, a.content),
        }));
        setHistory(newHistory);
        setForm(newHistory[newHistory.length - 1]?.form ?? null);
        setAgentId(liveArgs[0]?.agentId ?? agentId);
        const maxRound = liveArgs.reduce((m, a) => Math.max(m, a.round), 0);
        setRound(maxRound + 1);
    }, [liveArgs, extractor, agentId]);

    useEffect(() => {
        if (hasLiveDebate) loadDebate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const targets = form ? extractor.getEnthymemeTargets(form ? agentId : '', form ? round - 1 : 0) : [];
    // actual targets are stored per analyzed round, fetch via last history entry's key
    const lastTargets = (() => {
        if (history.length === 0) return [];
        const last = history[history.length - 1]!;
        return extractor.getEnthymemeTargets(last.agentId, last.round);
    })();
    const formatted = (() => {
        if (history.length === 0) return '';
        const last = history[history.length - 1]!;
        return extractor.getFormattedTargets(last.agentId, last.round, 'English');
    })();

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Terminal size={22} color="#06b6d4" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Logical Form — {t('nav.logical_form')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(6,182,214,0.15)', color: '#22d3ee', fontWeight: 600 }}>P1.25</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Heuristic logical form extraction — detects <code style={{ color: '#22d3ee' }}>type</code> via patterns (if→then, either/or, all/every, like/similar, because/therefore, according
                to). Extracts <code>major/minor premise</code> via <code style={{ color: '#a78bfa' }}>because/since</code> vs{' '}
                <code style={{ color: '#22d3ee' }}>therefore/thus/so</code> &amp; hidden premise (enthymeme) via <code>obviously/clearly/everyone knows</code>. Needs ≥50 chars &amp;
                ≥2 sentences &gt;10 chars.
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'end',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(6,182,214,0.15)',
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
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="primary" onClick={handleAnalyze}>
                        <Brain size={14} /> Analyze
                    </Button>
                    <Button variant="ghost" onClick={handleClear}>
                        <RefreshCw size={14} /> Clear
                    </Button>
                    <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>
                        Load active debate ({liveArgs.length})
                    </Button>
                </span>
                <span style={{ fontSize: 11, color: 'var(--slate-500)', width: '100%' }}>
                    split by <code>.!?</code> → &gt;10 chars sentences → detect type → extract conclusion (therefore/thus) vs premises (because/since). Last sentence fallback if no markers.
                </span>
            </div>

            {agents.length === 0 && (
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                    No agents available
                </div>
            )}

            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8 }}>Input text — {text.length} chars</div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'var(--slate-900)',
                        color: 'var(--slate-100)',
                        border: `1px solid ${text.length < 50 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
                        fontSize: 13,
                        resize: 'vertical',
                        lineHeight: 1.5,
                    }}
                />
                {text.length < 50 && <div style={{ marginTop: 6, fontSize: 11, color: '#f87171' }}>Need ≥50 chars — else returns null.</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 14, alignItems: 'start' }}>
                {/* Left: form */}
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChart3 size={16} color="#06b6d4" /> Logical Form — {form ? form.type : 'not analyzed'}
                        {form && (
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: form.isValid ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: form.isValid ? '#22c55e' : '#f87171',
                                    fontWeight: 700,
                                    border: `1px solid ${form.isValid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                }}
                            >
                                {form.isValid ? 'VALID' : 'INVALID'} {form.hasEnthymeme ? '· ENTHYMEME' : ''}
                            </span>
                        )}
                    </div>
                    {!form ? (
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
                            Click Analyze to extract logical form (needs ≥50 chars, ≥2 sentences).
                        </div>
                    ) : history[history.length - 1]?.form === null ? (
                        <div
                            style={{
                                padding: 12,
                                textAlign: 'center',
                                color: '#f87171',
                                fontSize: 12,
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 8,
                                background: 'rgba(239,68,68,0.06)',
                            }}
                        >
                            Returned <code>null</code> — text &lt;50 chars or &lt;2 sentences (&gt;10 chars each). Last input was {text.length} chars.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>type</span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: '#fff',
                                        background: TYPE_COLOR[form.type] ?? '#64748b',
                                        borderRadius: 4,
                                        padding: '3px 8px',
                                    }}
                                >
                                    {form.type}
                                </span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>
                                    {history[history.length - 1]?.agentId} r{history[history.length - 1]?.round}
                                </span>
                            </div>

                            {[
                                { label: 'Major premise', p: form.majorPremise },
                                { label: 'Minor premise', p: form.minorPremise },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        background: row.p.isExplicit ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                                        border: `1px solid ${row.p.isExplicit ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.18)'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: row.p.isExplicit ? '#22c55e' : '#f87171' }}>{row.label}</span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                padding: '1px 5px',
                                                borderRadius: 3,
                                                background: row.p.isExplicit ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: row.p.isExplicit ? '#22c55e' : '#f87171',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {row.p.isExplicit ? 'explicit' : 'implicit (enthymeme)'}
                                        </span>
                                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>{(row.p.confidence * 100).toFixed(0)}% conf</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-200)', lineHeight: 1.4 }}>{row.p.text}</div>
                                </div>
                            ))}

                            <div
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(6,182,214,0.08)',
                                    border: '1px solid rgba(6,182,214,0.2)',
                                }}
                            >
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Lightbulb size={12} /> Conclusion
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--slate-100)', lineHeight: 1.5 }}>{form.conclusion}</div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {form.isValid ? <CheckCircle size={12} color="#22c55e" /> : <AlertTriangle size={12} color="#ef4444" />} {form.isValid ? 'structurally valid' : 'invalid (implicit major)'}
                                </span>
                                <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <Eye size={12} color={form.hasEnthymeme ? '#f59e0b' : '#64748b'} /> {form.hasEnthymeme ? 'has enthymeme' : 'no enthymeme'}
                                </span>
                            </div>
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Info size={12} /> type via <code>detectFormType</code> priority: if→then &gt; either/or &gt; all/every &gt; analogy &gt; cause/effect. See{' '}
                        <code style={{ color: '#22d3ee' }}>logical-form-extractor.ts:159</code>.
                    </div>
                </div>

                {/* Right: enthymeme + history */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                            <Eye size={16} color="#f59e0b" /> Enthymeme targets — {lastTargets.length}
                        </div>
                        {lastTargets.length === 0 ? (
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
                                No hidden premises — need <code>major/minor implicit</code> or indicator words (<code>obviously/clearly/everyone knows</code>).
                            </div>
                        ) : (
                            lastTargets.map((t, i) => (
                                <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                                        Hidden #{i + 1} — {t.agentId} r{t.round} · {(t.confidence * 100).toFixed(0)}%
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>claim</div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, marginBottom: 6 }}>{t.originalClaim}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>reconstructed hidden premise</div>
                                    <div style={{ fontSize: 12, color: '#fde68a', lineHeight: 1.4 }}>{t.hiddenPremise}</div>
                                </div>
                            ))
                        )}
                        {formatted && (
                            <pre
                                style={{
                                    margin: 0,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'var(--slate-900)',
                                    color: '#fde68a',
                                    fontSize: 11,
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.4,
                                    border: '1px solid rgba(245,158,11,0.2)',
                                    maxHeight: 140,
                                    overflowY: 'auto',
                                }}
                            >
                                {formatted}
                            </pre>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Formatted via <code style={{ color: '#f59e0b' }}>getFormattedTargets(agent, round, lang)</code> → injected as{' '}
                            <code>### Hidden Premises to Attack</code>.
                        </div>
                    </div>

                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Terminal size={16} color="#22d3ee" /> History — {history.length}
                        </div>
                        {history.length === 0 ? (
                            <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No history.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                                {history
                                    .slice()
                                    .reverse()
                                    .slice(0, 8)
                                    .map((h, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setForm(h.form)}
                                            style={{
                                                padding: '6px 8px',
                                                borderRadius: 6,
                                                background: form === h.form ? 'rgba(6,182,214,0.12)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${form === h.form ? 'rgba(6,182,214,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>
                                                {h.agentId} r{h.round}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[h.form?.type ?? 'generalization'] ?? '#64748b' }}>{h.form?.type ?? 'null'}</span>
                                            <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.content.slice(0, 40)}</span>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: h.form?.hasEnthymeme ? '#f59e0b' : h.form ? '#22c55e' : '#64748b' }} />
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

export default LogicalFormPanel;
