/**
 * Cognitive-aux / research panel (Experimental).
 * Model playground — research-grade, not production surface (P1.21).
 */
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Send, Loader2, Check, X, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { keyService, adapterRegistry } from '../kernel/instances';
import type { AdapterMessage } from '../kernel/contracts/provider-adapter';

interface CompareResult {
    provider: string;
    model: string;
    content: string;
    latency: number;
    tokens: number;
    error?: string;
    loading: boolean;
}

function t(key: string): string {
    const map: Record<string, string> = {
        'playground.title': 'Model Comparison Playground',
        'playground.subtitle': 'Compare responses from different providers side-by-side',
        'playground.prompt_placeholder': 'Enter your prompt here...',
        'playground.compare': 'Compare',
        'playground.select_providers': 'Select providers to compare',
        'playground.latency': 'Latency',
        'playground.tokens': 'Tokens',
        'playground.cost': 'Cost',
        'playground.no_results': 'Click "Compare" to see results',
        'playground.error': 'Error',
        'playground.select_all': 'Select All',
        'playground.deselect_all': 'Deselect All',
    };
    return map[key] || key;
}

const PROVIDERS = [
    { name: 'groq', label: 'Groq', color: 'var(--success)' },
    { name: 'openrouter', label: 'OpenRouter', color: '#a855f7' },
    { name: 'gemini', label: 'Gemini', color: '#ec4899' },
    { name: 'nvidia', label: 'NVIDIA', color: 'var(--error)' },
    { name: 'openai', label: 'OpenAI', color: 'var(--accent)' },
    { name: 'anthropic', label: 'Anthropic', color: 'var(--warning)' },
];

function estimateCost(tokens: number, _provider: string): string {
    const rate = 0.000002;
    return `$${(tokens * rate).toFixed(6)}`;
}

const ModelComparePanel: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set(['groq', 'openrouter']));
    const [results, setResults] = useState<CompareResult[]>([]);
    const [running, setRunning] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const availableProviders = useMemo(() => {
        try {
            const keys = keyService.getKeys();
            const providers = new Set(keys.map((k) => k.provider));
            return PROVIDERS.filter((p) => providers.has(p.name));
        } catch {
            return PROVIDERS;
        }
    }, []);

    const toggleProvider = useCallback((name: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    }, []);

    const selectAll = () => setSelected(new Set(availableProviders.map((p) => p.name)));
    const deselectAll = () => setSelected(new Set());

    const handleCompare = useCallback(async () => {
        if (!prompt.trim() || selected.size === 0) return;

        const controller = new AbortController();
        abortRef.current = controller;

        setRunning(true);
        const targets = Array.from(selected);
        const initialResults: CompareResult[] = targets.map((p) => ({
            provider: p,
            model: 'default',
            content: '',
            latency: 0,
            tokens: 0,
            loading: true,
        }));
        setResults(initialResults);

        const messages: AdapterMessage[] = [{ role: 'user', content: prompt }];

        const newResults = await Promise.all(
            targets.map(async (provider, idx) => {
                try {
                    const adapter = adapterRegistry.getAdapter(provider);
                    if (!adapter) {
                        return {
                            ...initialResults[idx],
                            loading: false,
                            error: 'Adapter not found',
                        };
                    }

                    const keys = keyService.getKeys().filter((k) => k.provider === provider);
                    const apiKey = keys[0]?.key;
                    if (!apiKey) {
                        return {
                            ...initialResults[idx],
                            loading: false,
                            error: 'No API key found',
                        };
                    }

                    const startTime = performance.now();
                    const response = await adapter.sendMessage(
                        messages,
                        'default',
                        apiKey,
                        controller.signal,
                        { temperature: 0.7 },
                    );
                    const latency = Math.round(performance.now() - startTime);

                    return {
                        provider,
                        model: 'default',
                        content: response.content || '',
                        latency,
                        tokens:
                            ((response as unknown as Record<string, unknown>).tokens as number) ||
                            response.content?.length ||
                            0,
                        error: response.error,
                        loading: false,
                    };
                } catch (err: unknown) {
                    if (err instanceof Error && err.name === 'AbortError') {
                        return {
                            ...initialResults[idx],
                            loading: false,
                            content: '',
                            error: 'Cancelled',
                        };
                    }
                    return {
                        ...initialResults[idx],
                        loading: false,
                        error: err instanceof Error ? err.message : String(err),
                    };
                }
            }),
        );

        setResults(newResults as CompareResult[]);
        setRunning(false);
        abortRef.current = null;
    }, [prompt, selected]);

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <div
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--slate-200)',
                        marginBottom: '0.25rem',
                    }}
                >
                    {t('playground.title')}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                    {t('playground.subtitle')}
                </div>
            </div>

            <div
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                }}
            >
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', marginBottom: '0.5rem' }}>
                        {t('playground.select_providers')}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {availableProviders.map((p) => {
                            const isSel = selected.has(p.name);
                            return (
                                <button
                                    key={p.name}
                                    onClick={() => toggleProvider(p.name)}
                                    style={{
                                        padding: '0.4rem 0.9rem',
                                        borderRadius: 20,
                                        border: `1px solid ${isSel ? `${p.color}66` : 'rgba(255,255,255,0.1)'}`,
                                        background: isSel ? `${p.color}22` : 'transparent',
                                        color: isSel ? p.color : 'var(--slate-400)',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {isSel ? <Check size={14} /> : <X size={14} />}
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={selectAll}
                            style={{
                                padding: '0.25rem 0.7rem',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'var(--accent-tint)',
                                color: '#60a5fa',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                            }}
                        >
                            {t('playground.select_all')}
                        </button>
                        <button
                            onClick={deselectAll}
                            style={{
                                padding: '0.25rem 0.7rem',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'var(--error-tint)',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                            }}
                        >
                            {t('playground.deselect_all')}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('playground.prompt_placeholder')}
                        rows={4}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            borderRadius: 12,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            lineHeight: 1.6,
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                            onClick={handleCompare}
                            disabled={running || !prompt.trim() || selected.size === 0}
                            style={{
                                padding: '0.75rem 1.25rem',
                                borderRadius: 12,
                                background:
                                    running || !prompt.trim() || selected.size === 0
                                        ? 'rgba(59,130,246,0.1)'
                                        : 'rgba(59,130,246,0.2)',
                                border: '1px solid rgba(59,130,246,0.3)',
                                color: running ? '#94a3b8' : '#60a5fa',
                                cursor:
                                    running || !prompt.trim() || selected.size === 0
                                        ? 'not-allowed'
                                        : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.15s',
                                minWidth: 140,
                                justifyContent: 'center',
                            }}
                        >
                            {running ? (
                                <>
                                    <Loader2
                                        size={16}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />{' '}
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Send size={16} /> {t('playground.compare')}
                                </>
                            )}
                        </button>
                        {running && (
                            <button
                                onClick={() => {
                                    abortRef.current?.abort();
                                    setRunning(false);
                                }}
                                style={{
                                    padding: '0.4rem',
                                    borderRadius: 8,
                                    background: 'var(--error-tint)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#f87171',
                                    cursor: 'pointer',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {results.length === 0 && !running && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                    }}
                >
                    {t('playground.no_results')}
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(results.length || 1, 4)}, 1fr)`,
                    gap: '1rem',
                }}
            >
                {results.map((r) => {
                    const p = PROVIDERS.find((x) => x.name === r.provider);
                    const color = p?.color || '#64748b';
                    return (
                        <div
                            key={r.provider}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: `1px solid ${r.error ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: 16,
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: r.loading
                                                ? '#f59e0b'
                                                : r.error
                                                  ? '#ef4444'
                                                  : color,
                                        }}
                                    />
                                    <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>
                                        {p?.label || r.provider}
                                    </span>
                                </div>
                                {r.loading && (
                                    <Loader2
                                        size={14}
                                        color="#f59e0b"
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />
                                )}
                            </div>

                            {r.loading && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        color: 'var(--slate-500)',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    Waiting for response...
                                </div>
                            )}

                            {r.error && !r.loading && (
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                        color: '#fca5a5',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 8,
                                    }}
                                >
                                    <AlertCircle
                                        size={14}
                                        style={{ flexShrink: 0, marginTop: 2 }}
                                    />
                                    {r.error}
                                </div>
                            )}

                            {r.content && !r.loading && (
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.2)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.82rem',
                                        lineHeight: 1.7,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        maxHeight: 400,
                                        overflowY: 'auto',
                                        flex: 1,
                                    }}
                                >
                                    {r.content}
                                </div>
                            )}

                            {!r.loading && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        fontSize: '0.72rem',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {r.latency}ms
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <AlertCircle size={12} /> {r.tokens} tok
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <DollarSign size={12} />{' '}
                                        {estimateCost(r.tokens, r.provider)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ModelComparePanel;
