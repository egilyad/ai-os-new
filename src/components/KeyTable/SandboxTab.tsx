import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Send, MessageSquare } from 'lucide-react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import type { ApiKey } from '../../types/metrics';

interface SandboxTabProps {
    apiKey: ApiKey;
    onClose: () => void;
}

const SandboxMessageBubble = React.memo<{
    msg: { role: 'user' | 'assistant'; content: string };
    index: number;
    provider: string;
    isLastLoading: boolean;
}>(({ msg, index, provider, isLastLoading }) => (
    <div
        key={`msg-${index}`}
        style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '0.75rem 1rem',
            borderRadius: 12,
            background: msg.role === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            position: 'relative',
        }}
    >
        <div
            style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '0.25rem', fontWeight: 700 }}
        >
            {msg.role === 'user' ? 'YOU' : provider.toUpperCase()}
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content || (isLastLoading ? '...' : '')}</div>
    </div>
));

const SandboxTab: React.FC<SandboxTabProps> = ({ apiKey, onClose }) => {
    const [input, setInput] = useState('');
    const [selectedModel, setSelectedModel] = useState(apiKey.availableModels?.[0] || 'auto');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const isDoneRef = useRef(false);
    const activeRequestIdRef = useRef<string | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (
            apiKey.availableModels?.length &&
            (selectedModel === 'auto' || !apiKey.availableModels.includes(selectedModel))
        ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedModel(apiKey.availableModels[0]!);
        }
    }, [apiKey.availableModels, selectedModel]);

    useEffect(() => {
        const subResponse = eventBus.on(EVENTS.MESSAGE_RESPONSE, (res) => {
            if (res.requestId?.startsWith(`sandbox-${apiKey.id}`) && isMountedRef.current) {
                isDoneRef.current = true;
                if (res.status === 'error') {
                    setStatus('error');
                    setError(res.error || 'Unknown error');
                } else if (res.status === 'done') {
                    setMessages((prev) => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'assistant') {
                            return [
                                ...prev.slice(0, -1),
                                { role: 'assistant', content: res.content },
                            ];
                        }
                        return [...prev, { role: 'assistant', content: res.content }];
                    });
                    setStatus('idle');
                }
            }
        });

        const subStreamStart = eventBus.on(EVENTS.STREAM_START, ({ requestId }) => {
            if (requestId.startsWith(`sandbox-${apiKey.id}`) && isMountedRef.current) {
                isDoneRef.current = false;
                setStatus('loading');
                setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
            }
        });

        const subStreamChunk = eventBus.on(EVENTS.STREAM_CHUNK, ({ requestId, chunk }) => {
            if (requestId.startsWith(`sandbox-${apiKey.id}`) && isMountedRef.current) {
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'assistant') {
                        return [
                            ...prev.slice(0, -1),
                            { role: 'assistant', content: last.content + chunk },
                        ];
                    }
                    return [...prev, { role: 'assistant', content: chunk }];
                });
            }
        });

        const subStreamEnd = eventBus.on(EVENTS.STREAM_END, ({ requestId, fullContent }) => {
            if (requestId.startsWith(`sandbox-${apiKey.id}`) && isMountedRef.current) {
                isDoneRef.current = true;
                setStatus('idle');
                if (fullContent) {
                    setMessages((prev) => {
                        const last = prev[prev.length - 1];
                        if (last && last.role === 'assistant') {
                            return [
                                ...prev.slice(0, -1),
                                { role: 'assistant', content: fullContent },
                            ];
                        }
                        return [...prev, { role: 'assistant', content: fullContent }];
                    });
                }
            }
        });

        const subStreamError = eventBus.on(EVENTS.STREAM_ERROR, ({ requestId, error }) => {
            if (requestId.startsWith(`sandbox-${apiKey.id}`) && isMountedRef.current) {
                isDoneRef.current = true;
                setStatus('error');
                setError(error);
            }
        });

        return () => {
            subResponse();
            subStreamStart();
            subStreamChunk();
            subStreamEnd();
            subStreamError();
        };
    }, [apiKey.id]);

    useEffect(() => {
        if (status !== 'loading') return;
        const timeout = setTimeout(() => {
            if (!isMountedRef.current || isDoneRef.current) return;
            setStatus('error');
            setError('Request timed out after 60 seconds');
            const rid = activeRequestIdRef.current;
            if (rid) eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: rid });
        }, 60000);
        return () => {
            clearTimeout(timeout);
            if (isDoneRef.current) activeRequestIdRef.current = null;
        };
    }, [status]);

    const handleSend = () => {
        if (!input.trim() || status === 'loading') return;
        const text = input.trim();
        const requestId = `sandbox-${apiKey.id}-${crypto.randomUUID().slice(0, 8)}`;
        activeRequestIdRef.current = requestId;
        const newMessages = [...messages, { role: 'user' as const, content: text }];
        setMessages(newMessages);
        setInput('');
        setStatus('loading');
        setError(null);
        const p = apiKey.provider.toLowerCase();
        const defaultModel = PROVIDER_DEFAULT_MODELS[p] || 'auto';

        eventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: p,
            model: selectedModel === 'auto' ? defaultModel : selectedModel,
            messages: newMessages,
            requestId,
            keyId: apiKey.id,
        });
    };

    const handleReset = () => {
        setMessages([]);
        setStatus('idle');
        setError(null);
    };

    const handleStartFullChat = () => {
        eventBus.emit(EVENTS.START_CHAT_WITH_TARGET, {
            provider: apiKey.provider,
            model: selectedModel,
            keyId: apiKey.id,
        });
        eventBus.emit(EVENTS.NAVIGATE, 'chat');
        onClose();
    };

    const renderErrorWithLinks = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={`url-${i}`}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#60a5fa',
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                        }}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const sandboxEnabled = import.meta.env.VITE_SANDBOX_ENABLED === 'true';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}
        >
            {sandboxEnabled && (
                <div
                    style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        padding: '8px 12px',
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 13,
                    }}
                >
                    ⚠️ Sandbox mode is enabled. Code execution is restricted but CSP is weakened.
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.75rem',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                }}
            >
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    MODEL:
                </div>
                <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {(apiKey.availableModels || ['auto']).map((m) => (
                        <option
                            key={m}
                            value={m}
                            style={{ background: 'var(--bg-panel)', color: 'white' }}
                        >
                            {m}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleReset}
                    title="Clear chat"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            <div
                style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '1rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    minHeight: 300,
                    maxHeight: 400,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
                {messages.length === 0 && !error && (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            padding: '2rem',
                            gap: '1rem',
                        }}
                    >
                        <div>
                            Start a conversation with the provider to test connectivity and response
                            quality.
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                justifyContent: 'center',
                            }}
                        >
                            {[
                                'What can you do?',
                                'Write a haiku about coding',
                                'Explain quantum computing simply',
                                'Hello, world in Python',
                            ].map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => {
                                        setInput(prompt);
                                    }}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.75rem',
                                        background: 'var(--accent-tint)',
                                        border: '1px solid rgba(59,130,246,0.2)',
                                        borderRadius: 8,
                                        color: '#60a5fa',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <SandboxMessageBubble
                        key={`${msg.role}-${msg.content.slice(0, 30)}`}
                        msg={msg}
                        index={i}
                        provider={apiKey.provider}
                        isLastLoading={status === 'loading' && i === messages.length - 1}
                    />
                ))}

                {error && (
                    <div
                        style={{
                            padding: '1rem',
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 10,
                            color: 'var(--error)',
                            fontSize: '0.85rem',
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>API Error:</div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                            {renderErrorWithLinks(error)}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        resize: 'none',
                        fontSize: '0.95rem',
                        outline: 'none',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || status === 'loading'}
                    className="btn-primary"
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                    }}
                >
                    {status === 'loading' ? (
                        <RefreshCw size={20} className="spinning" />
                    ) : (
                        <Send size={20} />
                    )}
                </button>
            </div>

            <button
                onClick={handleStartFullChat}
                disabled={messages.length === 0}
                className="btn-secondary"
                style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '0.8rem',
                    borderStyle: 'dashed',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)',
                    opacity: messages.length === 0 ? 0.5 : 1,
                }}
            >
                <MessageSquare size={16} /> Start full chat with this key
            </button>
        </motion.div>
    );
};

export default SandboxTab;
