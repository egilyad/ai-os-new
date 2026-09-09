import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, Check, X } from 'lucide-react';
import { keyService, eventBus, EVENTS } from '../../kernel/instances';
import {
    PROVIDER_DEFAULT_MODELS,
    PROVIDER_PREFERRED_MODELS,
} from '../../kernel/utils/provider-default-models';
import type { ApiKey } from '../../types/metrics';

interface TestState {
    loading: boolean;
    result?: { content: string; latency: number; model: string };
    error?: string;
}

const STATUS_COLORS: Record<string, string> = {
    active: '#22c55e',
    inactive: '#6b7280',
    error: '#ef4444',
    checking: '#f59e0b',
    pending: '#f59e0b',
    quota_exhausted: '#f97316',
    invalid: '#ef4444',
    duplicate: '#a855f7',
    quarantined: '#ef4444',
    probation: '#f59e0b',
    compromised: '#dc2626',
};

export default function GroqKeyTable() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [testState, setTestState] = useState<Record<string, TestState>>({});
    const [prompts, setPrompts] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
        const all = await keyService.getKeys();
        setKeys(all.filter((k) => k.provider.toLowerCase() === 'groq'));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleModelChange = async (keyId: string, model: string) => {
        await keyService.updateKey(keyId, { model });
        await load();
    };

    const handleTest = (apiKey: ApiKey) => {
        const prompt = (prompts[apiKey.id] || '').trim();
        if (!prompt || testState[apiKey.id]?.loading) return;

        setTestState((prev) => ({ ...prev, [apiKey.id]: { loading: true } }));

        const reqId = `groq-test-${apiKey.id}-${crypto.randomUUID().slice(0, 6)}`;
        const start = Date.now();
        let isDone = false;

        const p = apiKey.provider.toLowerCase();
        const defaultModel = PROVIDER_DEFAULT_MODELS[p] || 'auto';
        const resolvedModel = apiKey.model || apiKey.availableModels?.[0] || defaultModel;

        eventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: p,
            model: resolvedModel,
            messages: [{ role: 'user', content: prompt }],
            requestId: reqId,
            keyId: apiKey.id,
            options: { temperature: 0.7, maxTokens: 1024 },
        });

        const cleanup = () => {
            subResp();
            subStreamEnd();
            subStreamErr();
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subResp = eventBus.on(EVENTS.MESSAGE_RESPONSE, (res: any) => {
            if (isDone) return;
            if (res.requestId === reqId) {
                isDone = true;
                cleanup();
                clearTimeout(timeout);
                if (res.status === 'error') {
                    setTestState((prev) => ({
                        ...prev,
                        [apiKey.id]: { loading: false, error: res.error || 'Unknown error' },
                    }));
                } else {
                    setTestState((prev) => ({
                        ...prev,
                        [apiKey.id]: {
                            loading: false,
                            result: {
                                content: res.content,
                                latency: Date.now() - start,
                                model: resolvedModel,
                            },
                        },
                    }));
                }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subStreamEnd = eventBus.on(EVENTS.STREAM_END, ({ requestId, fullContent }: any) => {
            if (isDone) return;
            if (requestId === reqId) {
                isDone = true;
                cleanup();
                clearTimeout(timeout);
                setTestState((prev) => ({
                    ...prev,
                    [apiKey.id]: {
                        loading: false,
                        result: {
                            content: fullContent,
                            latency: Date.now() - start,
                            model: resolvedModel,
                        },
                    },
                }));
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subStreamErr = eventBus.on(EVENTS.STREAM_ERROR, ({ requestId, error }: any) => {
            if (isDone) return;
            if (requestId === reqId) {
                isDone = true;
                cleanup();
                clearTimeout(timeout);
                setTestState((prev) => ({
                    ...prev,
                    [apiKey.id]: { loading: false, error: error || 'Stream error' },
                }));
            }
        });

        const timeout = setTimeout(() => {
            if (isDone) return;
            isDone = true;
            cleanup();
            eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: reqId });
            setTestState((prev) => ({
                ...prev,
                [apiKey.id]: { loading: false, error: 'Request timed out' },
            }));
        }, 60000);
    };

    const allModels = [
        ...new Set([
            ...(PROVIDER_DEFAULT_MODELS.groq ? [PROVIDER_DEFAULT_MODELS.groq] : []),
            ...(PROVIDER_PREFERRED_MODELS.groq || []),
        ]),
    ];

    return (
        <div>
            <h3
                style={{
                    margin: '24px 0 12px',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                🔑 Groq Keys
            </h3>
            {keys.length === 0 ? (
                <div
                    style={{
                        padding: 16,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 12,
                        color: 'var(--slate-400)',
                        fontSize: '0.85rem',
                    }}
                >
                    No Groq keys configured. Add one in Providers.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {keys.map((k) => {
                        const test = testState[k.id];
                        const prompt = prompts[k.id] || '';
                        const hasAvailModels = k.availableModels && k.availableModels.length > 0;
                        const modelOptions = hasAvailModels
                            ? [...new Set([...(k.availableModels || []), ...allModels])]
                            : allModels;

                        return (
                            <div
                                key={k.id}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '10px 14px',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span
                                        style={{
                                            color: 'var(--slate-200)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            minWidth: 100,
                                        }}
                                    >
                                        {k.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 10,
                                            background: `${STATUS_COLORS[k.status] || '#6b7280'}22`,
                                            color: STATUS_COLORS[k.status] || '#6b7280',
                                            border: `1px solid ${STATUS_COLORS[k.status] || '#6b7280'}44`,
                                        }}
                                    >
                                        {k.status}
                                    </span>
                                    <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                                        {k.latency ? `${k.latency}ms` : '—'}
                                    </span>
                                    <select
                                        value={k.model || ''}
                                        onChange={(e) => handleModelChange(k.id, e.target.value)}
                                        style={{
                                            padding: '4px 8px',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8,
                                            color: 'var(--slate-200)',
                                            fontSize: '0.75rem',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            maxWidth: 200,
                                        }}
                                        aria-label="Model"
                                    >
                                        <option value="">{k.model || 'Default'}</option>
                                        {modelOptions.map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    <div
                                        style={{ display: 'flex', gap: 6, flex: 1, minWidth: 150 }}
                                    >
                                        <input
                                            value={prompt}
                                            onChange={(e) =>
                                                setPrompts((prev) => ({
                                                    ...prev,
                                                    [k.id]: e.target.value,
                                                }))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleTest(k);
                                                }
                                            }}
                                            placeholder="Test prompt..."
                                            style={{
                                                flex: 1,
                                                padding: '6px 10px',
                                                background: 'rgba(0,0,0,0.2)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                outline: 'none',
                                                minWidth: 80,
                                            }}
                                        />
                                        <button
                                            onClick={() => handleTest(k)}
                                            disabled={!prompt.trim() || test?.loading}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                border: 'none',
                                                cursor: test?.loading ? 'not-allowed' : 'pointer',
                                                background: test?.loading
                                                    ? 'rgba(255,255,255,0.05)'
                                                    : '#22c55e22',
                                                color: test?.loading ? '#6b7280' : '#22c55e',
                                            }}
                                        >
                                            {test?.loading ? (
                                                <Loader2 size={14} className="provider-spin" />
                                            ) : (
                                                <Send size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {test?.result && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{
                                            margin: '0 14px 10px',
                                            padding: 10,
                                            background: 'rgba(16,185,129,0.08)',
                                            border: '1px solid rgba(16,185,129,0.2)',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: 4,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: 'var(--success)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <Check
                                                    size={12}
                                                    style={{ display: 'inline', marginRight: 4 }}
                                                />
                                                {test.result.model}
                                            </span>
                                            <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                                                {test.result.latency}ms
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                color: 'var(--slate-200)',
                                                whiteSpace: 'pre-wrap',
                                                maxHeight: 80,
                                                overflowY: 'auto',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            {test.result.content}
                                        </div>
                                    </motion.div>
                                )}
                                {test?.error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        style={{
                                            margin: '0 14px 10px',
                                            padding: 10,
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            borderRadius: 8,
                                            fontSize: '0.8rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: 'var(--error)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                marginBottom: 2,
                                            }}
                                        >
                                            <X
                                                size={12}
                                                style={{ display: 'inline', marginRight: 4 }}
                                            />
                                            ERROR
                                        </div>
                                        <div style={{ color: '#fca5a5', fontSize: '0.8rem' }}>
                                            {test.error}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
