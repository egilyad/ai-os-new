import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, RefreshCw, Info, BarChart3, ExternalLink } from 'lucide-react';
import { AdversarialSourceService } from '../../kernel/services/debate-runtime/debate-adversarial-source-service';
import { useTranslation } from '../../i18n/useTranslation';
import { useDebateArguments } from '../../hooks/useDebateArguments';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import type { SourceVerificationResult } from '../../kernel/contracts/debate-adversarial-source';

// Injectable fetch — defaults to the real global fetch so the panel verifies REAL URLs.
// Tests can override via `vi.stubGlobal('fetch', ...)` (preferred) or by setting this module variable.
const _realFetch: typeof fetch =
    typeof globalThis !== 'undefined' && globalThis.fetch
        ? globalThis.fetch.bind(globalThis)
        : (() => { throw new Error('fetch not available'); }) as typeof fetch;
let fetchImpl: typeof fetch = (...args: Parameters<typeof fetch>) => _realFetch(...args);
try {
    (globalThis as { fetch?: typeof fetch }).fetch = fetchImpl;
} catch {
    /* some environments expose a read-only global fetch; stubGlobal still works in tests */
}

type HistoryEntry = { text: string; results: SourceVerificationResult[]; at: number };

export const AdversarialSourcePanel: React.FC = () => {
    const { t } = useTranslation();
    const svc = useMemo(() => new AdversarialSourceService(), []);
    const { args: liveArgs, topic: liveTopic, sessionId, hasLiveDebate } = useDebateArguments();
    const [text, setText] = useState<string>('');
    const loadDebate = useCallback(() => {
        if (liveArgs.length) setText(liveArgs.map((a) => a.content).join('\n\n'));
    }, [liveArgs, setText]);
    useEffect(() => {
        if (hasLiveDebate) loadDebate();
    }, [sessionId]);
    const [results, setResults] = useState<SourceVerificationResult[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [hasRun, setHasRun] = useState(false);

    const canRun = text.trim().length >= 50 && /https?:\/\//i.test(text);

    const handleVerify = async () => {
        setIsRunning(true);
        setHasRun(true);
        try {
            const ac = new AbortController();
            const res = await svc.verifyClaims(text, ac.signal);
            setResults(res);
            setHistory((h) => [...h, { text, results: res, at: Date.now() }]);
        } finally {
            setIsRunning(false);
        }
    };

    const handleClear = () => {
        setResults([]);
        setHistory([]);
        setHasRun(false);
    };

    const distortedCount = results.filter((r) => r.isDistorted).length;

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={22} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Adversarial Source — {t('nav.adversarial_source')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>P0.3</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                {hasLiveDebate && (
                    <span title={sessionId ?? ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#10b981', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Active debate: {liveTopic}
                    </span>
                )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Verifies opponent source citations in real-time: extract URLs → fetch (5s timeout, max 3) → strip HTML → Jaccard word-set (&gt;3 chars) →{' '}
                <code style={{ color: '#ef4444' }}>score &lt;0.15 = distorted</code> → inject warning. Prompt context scans last 3 opponent turns. Fetches REAL URLs via the global{' '}
                <code style={{ color: '#a78bfa' }}>fetch</code>.
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'end',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(139,92,246,0.18)',
                    flexWrap: 'wrap',
                }}
            >
                <span style={{ fontSize: 12, color: 'var(--slate-300)', fontWeight: 600, paddingBottom: 6 }}>
                    Text to verify ({text.length} chars)
                </span>
                {!canRun && text.trim().length < 50 && (
                    <span style={{ fontSize: 11, color: '#f87171', paddingBottom: 6, marginLeft: 8 }}>need ≥50 chars</span>
                )}
                {!/https?:\/\//i.test(text) && text.trim().length >= 50 && (
                    <span style={{ fontSize: 11, color: '#f59e0b', paddingBottom: 6, marginLeft: 8 }}>no URLs → empty</span>
                )}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button variant="primary" onClick={handleVerify} disabled={isRunning}>
                        <Search size={14} /> {isRunning ? 'Verifying…' : 'Verify claims'}
                    </Button>
                    <Button variant="ghost" onClick={handleClear}>
                        <RefreshCw size={14} /> Clear
                    </Button>
                    <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate</Button>
                </span>
            </div>

            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Paste opponent text with https:// URLs…"
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'var(--slate-900)',
                        color: 'var(--slate-100)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 13,
                        resize: 'vertical',
                        lineHeight: 1.5,
                    }}
                />
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Info size={12} /> URLs extracted via <code style={{ color: '#a78bfa' }}>/https?:\/\/[^\s)]+/gi</code> (dedup, ±150 chars context). Max 3 per call.
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                {/* Left: results */}
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
                        <BarChart3 size={16} color="#8b5cf6" /> Verification — {results.length} distorted
                        {hasRun && <span style={{ marginLeft: 'auto', fontSize: 11, color: distortedCount ? '#f87171' : '#22c55e' }}>{distortedCount ? `${distortedCount} warnings` : 'no distortion'}</span>}
                    </div>
                    {!hasRun ? (
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
                            Click Verify to check URLs against real fetched sources.
                        </div>
                    ) : results.length === 0 ? (
                        <div
                            style={{
                                padding: 12,
                                textAlign: 'center',
                                color: '#22c55e',
                                fontSize: 13,
                                border: '1px solid rgba(34,197,94,0.2)',
                                borderRadius: 8,
                                background: 'rgba(34,197,94,0.06)',
                                display: 'flex',
                                gap: 6,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <CheckCircle size={14} /> No distortion — sources match claim (Jaccard ≥0.15) or no URLs/short.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {results.map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: 'rgba(239,68,68,0.06)',
                                        border: '1px solid rgba(239,68,68,0.18)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                        <AlertTriangle size={14} color="#ef4444" />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>DISTORTED</span>
                                        <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>score {(r.matchScore * 100).toFixed(1)}% &lt;15%</span>
                                        <a
                                            href={r.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ marginLeft: 'auto', fontSize: 11, color: '#a78bfa', display: 'flex', gap: 4, alignItems: 'center' }}
                                        >
                                            {r.sourceUrl} <ExternalLink size={10} />
                                        </a>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 4 }}>claim context</div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-200)', lineHeight: 1.4, marginBottom: 6, whiteSpace: 'pre-wrap' }}>{r.claimContext}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 4 }}>source excerpt (first 300 strip)</div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: 'var(--slate-400)',
                                            lineHeight: 1.4,
                                            padding: '6px 8px',
                                            borderRadius: 6,
                                            background: 'var(--slate-900)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {r.sourceExcerpt}
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 8, overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(100, r.matchScore * 100)}%`, height: '100%', background: '#ef4444' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Info size={12} /> Jaccard on word-sets (&gt;3 chars), &gt;5 words each. Threshold 0.15. See{' '}
                        <code style={{ color: '#a78bfa' }}>debate-adversarial-source-service.ts:121</code>.
                    </div>
                </div>

                {/* Right: warning preview + history */}
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
                            <AlertTriangle size={16} color="#ef4444" /> Prompt warning injection
                        </div>
                        {results.length === 0 ? (
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
                                No warning — injection happens only when distorted (1 per URL, up to 3).
                            </div>
                        ) : (
                            results.map((r, i) => (
                                <pre
                                    key={i}
                                    style={{
                                        margin: 0,
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        background: 'var(--slate-900)',
                                        color: '#fca5a5',
                                        fontSize: 11,
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.4,
                                        border: '1px solid rgba(239,68,68,0.2)',
                                    }}
                                >
                                    {r.warning}
                                </pre>
                            ))
                        )}
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                            Injected by <code style={{ color: '#a78bfa' }}>debate-llm-prompt-context.ts:179</code> into opponent verification — model is told to point out discrepancy.
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
                            <Search size={16} color="#8b5cf6" /> History — {history.length}
                        </div>
                        {history.length === 0 ? (
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
                                No history.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                                {history
                                    .slice()
                                    .reverse()
                                    .slice(0, 6)
                                    .map((h, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setResults(h.results)}
                                            style={{
                                                padding: '6px 8px',
                                                borderRadius: 6,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{new Date(h.at).toLocaleTimeString()}</span>
                                            <span style={{ flex: 1, fontSize: 11, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {h.text.slice(0, 60)}…
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: h.results.length ? '#f87171' : '#22c55e' }}>
                                                {h.results.length}⚠
                                            </span>
                                        </div>
                                    ))}
                            </div>
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
                        <strong style={{ color: 'var(--slate-300)' }}>Flow:</strong> opponent cites URL → next agent&apos;s prompt includes last 3 opponent turns →{' '}
                        <code style={{ color: '#a78bfa' }}>verifyClaims()</code> fetches up to 3 sources (5s each) → if Jaccard &lt;0.15, warning injected. Private fetch, abort-aware.
                    </div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default AdversarialSourcePanel;
