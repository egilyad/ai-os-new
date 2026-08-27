import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { FileCode, Sword, MessageSquareQuote, Zap, RefreshCw, AlertTriangle, CheckCircle, Info, BarChart3 } from 'lucide-react';
import { ShadowOpponentService } from '../../kernel/services/debate-runtime/debate-shadow-opponent-service';
import { useTranslation } from '../../i18n/useTranslation';
import { useDebateArguments } from '../../hooks/useDebateArguments';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import type { ShadowCritique } from '../../kernel/contracts/debate-shadow-opponent';
import { useRealAgents } from '../../hooks/useRealAgents';
import { agentService } from '../../kernel/instances/services-core';

type HistoryEntry = ShadowCritique & { agentId: string; agentName: string; at: number };

function createMockAdapter(draft: string, agentName: string) {
    return {
        sendMessage: async (
            _messages: Array<{ role: string; content: string }>,
            _model: string,
            _key: string,
            signal: AbortSignal,
        ): Promise<{ content: string }> => {
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            // simulate latency
            await new Promise((r) => setTimeout(r, 180));
            const weakness =
                draft.length < 80
                    ? 'Argument is too generic, lacks data and citation.'
                    : draft.includes('Lazard') || draft.includes('LCOE')
                      ? 'Opponent will attack single-source reliance (only Lazard) and ignore seasonal variability.'
                      : draft.includes('extraction') || draft.includes('lithium')
                        ? 'Opponent will say material constraints are overstated — recycling and alternative chemistry fix it.'
                        : 'Opponent will demand quantification and preemptive rebuttal of the strongest counter-evidence.';
            const strengthened = `${draft}\n\nMy opponent might argue that ${weakness.toLowerCase()} but in reality peer data (NREL 2023, IEA, + HVDC DESERTEC) shows the trade-off is bounded and mitigated — so the conclusion holds, now with preemptive counter-argument from my unique lens as ${agentName}.`;
            return { content: `=== CRITIQUE ===\n${weakness}\n\n=== STRENGTHENED ===\n${strengthened}` };
        },
    } as const;
}

export const ShadowOpponentPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const { args: liveArgs, topic: liveTopic, sessionId, hasLiveDebate } = useDebateArguments();
    const personas = useMemo(() => {
        return realAgents.slice(0, 8).map((a) => {
            const r = (() => {
                try {
                    return (agentService as any).resolveAgent(a.id);
                } catch {
                    return null;
                }
            })();
            const rolePrompt = r?.systemPrompt ?? r?.prompt ?? `You are ${a.name}`;
            return { id: a.id, name: a.name, systemPrompt: rolePrompt };
        });
    }, [realAgents]);
    const svc = useMemo(() => new ShadowOpponentService(), []);
    const [agentId, setAgentId] = useState<string>(() => personas[0]?.id ?? '');
    useEffect(() => {
        if (personas.length > 0 && !personas.some((p) => p.id === agentId)) setAgentId(personas[0]!.id);
    }, [personas, agentId]);
    const [draft, setDraft] = useState<string>('');
    const [language, setLanguage] = useState<'English' | 'Russian'>('English');
    const loadDebate = useCallback(() => {
        if (liveArgs.length) setDraft(liveArgs.map((a) => a.content).join('\n\n'));
    }, [liveArgs, setDraft]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
    }, [sessionId]);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<ShadowCritique | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    const persona = personas.find((a) => a.id === agentId) ?? personas[0];

    const canRun = draft.trim().length >= 50;

    const handleStrengthen = async () => {
        setError(null);
        setResult(null);
        if (draft.trim().length < 50) {
            setError('Draft too short — need ≥50 chars (service returns null).');
            return;
        }
        setIsRunning(true);
        const ac = new AbortController();
        const t0 = performance.now();
        try {
            const adapter = createMockAdapter(draft, persona.name);
            const res = await svc.strengthenArgument(
                draft,
                persona.systemPrompt,
                agentId,
                persona.name,
                adapter as any,
                'mock-model',
                'mock-key',
                ac.signal,
                language,
            );
            if (!res) {
                setError('No result — signal aborted or LLM returned empty/invalid (strengthened <20 chars).');
                return;
            }
            // enrich latency if mock was too fast (service already measures)
            const enriched: ShadowCritique = {
                ...res,
                latencyMs: res.latencyMs || Math.round(performance.now() - t0),
            };
            setResult(enriched);
            setHistory((h) => [...h, { ...enriched, agentId, agentName: persona.name, at: Date.now() }]);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsRunning(false);
        }
    };

    const handleClear = () => {
        setResult(null);
        setHistory([]);
        setError(null);
    };

    if (!persona) {
        return (
            <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileCode size={22} color="#6366f1" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Shadow Opponent — {t('nav.shadow_opponent')}</h2>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                </div>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--slate-400)', fontSize: 14, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    No agents available — register agents to use Shadow Opponent.
                </div>
                <ModuleInfo moduleKey="debate" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCode size={22} color="#6366f1" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Shadow Opponent — {t('nav.shadow_opponent')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontWeight: 600 }}>P0.2</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                {hasLiveDebate && (
                    <span title={sessionId ?? ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#10b981', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Active debate: {liveTopic}
                    </span>
                )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Self-critique loop: agent critiques its own draft as the strongest opponent would, then rewrites it stronger. Heuristic mock LLM here
                — real runtime calls the same LLM via <code style={{ color: '#a5b4fc' }}>shadowOpponent.strengthenArgument</code> (~1.5× latency,{' '}
                <code style={{ color: '#f87171' }}>return null if &lt;50 chars or aborted</code>). Prompt keeps role context (first 300 chars after tag strip).
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'end',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(99,102,241,0.18)',
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
                                {a.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Language
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            background: 'var(--slate-900)',
                            color: 'var(--slate-100)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: 13,
                        }}
                    >
                        <option value="English">English</option>
                        <option value="Russian">Russian</option>
                    </select>
                </label>
                <span style={{ fontSize: 11, color: 'var(--slate-500)', paddingBottom: 6, maxWidth: 360 }}>{persona.systemPrompt.slice(0, 110)}…</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="primary" onClick={handleStrengthen} disabled={isRunning}>
                        <Sword size={14} /> {isRunning ? 'Strengthening…' : 'Strengthen'}
                    </Button>
                    <Button variant="ghost" onClick={handleClear}>
                        <RefreshCw size={14} /> Clear
                    </Button>
                    <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate</Button>
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 14, alignItems: 'start' }}>
                {/* Left: draft + history */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquareQuote size={16} color="#6366f1" /> Draft argument — {draft.length} chars
                            {!canRun && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f87171', fontWeight: 600 }}>≥50 chars required</span>}
                        </div>
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={5}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: 'var(--slate-900)',
                                color: 'var(--slate-100)',
                                border: `1px solid ${canRun ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.35)'}`,
                                fontSize: 13,
                                resize: 'vertical',
                                lineHeight: 1.5,
                            }}
                        />
                        {error && (
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#fca5a5',
                                    fontSize: 12,
                                    display: 'flex',
                                    gap: 6,
                                    alignItems: 'center',
                                }}
                            >
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Info size={12} /> mocked adapter — same separators as real LLM: <code style={{ color: '#a5b4fc' }}>=== CRITIQUE ===</code> /{' '}
                            <code style={{ color: '#a5b4fc' }}>=== STRENGTHENED ===</code>. See <code style={{ color: '#a5b4fc' }}>debate-shadow-opponent-service.ts:6</code>.
                        </div>
                    </div>

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
                            <BarChart3 size={16} color="#6366f1" /> History — {history.length}
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', fontWeight: 400 }}>
                                {history.filter((h) => h.agentId === agentId).length} for {persona.name}
                            </span>
                        </div>
                        {history.length === 0 ? (
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
                                No runs yet — click Strengthen to simulate shadow critique.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                                {history
                                    .slice()
                                    .reverse()
                                    .slice(0, 8)
                                    .map((h, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setResult(h)}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: 8,
                                                background: result === h ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${result === h ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.06)'}`,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-300)' }}>
                                                    {h.agentName} · {h.latencyMs}ms
                                                </span>
                                                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{new Date(h.at).toLocaleTimeString()}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                crit: {h.critique.slice(0, 90)}…
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                strong: {h.strengthenedContent.slice(0, 90)}…
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: result */}
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
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Zap size={16} color="#6366f1" /> Shadow result — {result ? `${result.latencyMs}ms` : 'none'}
                        </div>
                        {!result ? (
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
                                {isRunning ? 'Running mock LLM…' : 'No critique yet. Run Strengthen to see CRITIQUE → STRENGTHENED.'}
                            </div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: 'rgba(239,68,68,0.06)',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                    }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Sword size={12} /> CRITIQUE (opponent view)
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--slate-100)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{result.critique || '—'}</div>
                                </div>
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: 'rgba(34,197,94,0.06)',
                                        border: '1px solid rgba(34,197,94,0.18)',
                                    }}
                                >
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CheckCircle size={12} /> STRENGTHENED (preemptive rebuttal)
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--slate-100)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{result.strengthenedContent}</div>
                                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)' }}>
                                        original {result.originalContent.length} → strengthened {result.strengthenedContent.length} chars (+
                                        {Math.max(0, result.strengthenedContent.length - result.originalContent.length)})
                                    </div>
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-500)',
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    latency {result.latencyMs}ms · separators ✓ · &lt;20 chars strengthened → null (guard). Try Russian: critique prompt switches per{' '}
                                    <code style={{ color: '#a5b4fc' }}>language</code>.
                                </div>
                            </>
                        )}
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
                        <strong style={{ color: 'var(--slate-300)' }}>How it runs in debate:</strong>
                        <br />
                        1. After draft, <code style={{ color: '#a5b4fc' }}>debate-llm-enrichment.ts:74</code> calls{' '}
                        <code style={{ color: '#a5b4fc' }}>shadowOpponent.strengthenArgument(draft, systemPrompt, …adapter, model, key, signal, lang)</code>
                        <br />
                        2. One extra LLM call with <code style={{ color: '#a5b4fc' }}>=== CRITIQUE === / === STRENGTHENED ===</code> format (
                        <code style={{ color: '#a5b4fc' }}>debate-shadow-opponent-service.ts:69</code>).
                        <br />
                        3. Enrichment replaces <code style={{ color: '#22c55e' }}>content</code> with <code style={{ color: '#22c55e' }}>strengthenedContent</code> if present (otherwise keeps draft).
                    </div>

                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.6)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileCode size={16} color="#a5b4fc" /> Prompt preview
                        </div>
                        <pre
                            style={{
                                margin: 0,
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: 'var(--slate-900)',
                                color: 'var(--slate-400)',
                                fontSize: 11,
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.4,
                                border: '1px solid rgba(255,255,255,0.06)',
                                maxHeight: 160,
                                overflowY: 'auto',
                            }}
                        >{`Ты — ${persona.name}. Твоя роль: ${persona.systemPrompt.slice(0, 120)}… Но сейчас ты — самый сильный оппонент самого себя.

Прочитай свой предыдущий аргумент. Найди ровно ОДНУ слабость.

=== CRITIQUE ===
[2-3 предложения от лица оппонента]

=== STRENGTHENED ===
[переписанный аргумент с контр-аргументом, сохраняет позицию]`}</pre>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Real prompt built in <code style={{ color: '#a5b4fc' }}>debate-shadow-opponent-service.ts:52</code> — roleContext = first 300 chars after tag strip, language switches RU/EN.
                        </div>
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default ShadowOpponentPanel;
