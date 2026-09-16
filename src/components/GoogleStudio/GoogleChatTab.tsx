import { useState, useCallback, useRef, useEffect } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Send, StopCircle, Loader2, Globe, Brain } from 'lucide-react';
import type { ChatMessage, ProviderResponse } from '../../kernel/types/llm-types';

interface GoogleStudioMessage {
    role: 'user' | 'model';
    text: string;
    grounding?: ProviderResponse['groundingMetadata'];
}

interface GoogleChatTabProps {
    model: string;
}

export function GoogleChatTab({ model }: GoogleChatTabProps) {
    const [messages, setMessages] = useState<GoogleStudioMessage[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [thinkingEnabled, setThinkingEnabled] = useState(false);
    const [groundingEnabled, setGroundingEnabled] = useState(false);
    const [imageBase64, setImageBase64] = useState('');
    const [imageMime, setImageMime] = useState('');
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const handleSend = useCallback(async () => {
        if (!input.trim() && !imageBase64) return;
        setError('');

        const userMsg: GoogleStudioMessage = {
            role: 'user',
            text: input,
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setStreaming(true);
        setLoading(true);

        const abort = new AbortController();
        abortRef.current = abort;

        const chatMessages: ChatMessage[] = [
            {
                role: 'user',
                content: input,
                inlineData: imageBase64 ? [{ mimeType: imageMime, data: imageBase64 }] : undefined,
            },
        ];

        try {
            const result = await googleGenAIService.generateContent(
                chatMessages,
                model,
                {
                    thinkingConfig: thinkingEnabled ? { type: 'ENABLED' } : undefined,
                    googleSearchGrounding: groundingEnabled,
                },
                abort.signal,
            );

            setMessages((prev) => [
                ...prev,
                { role: 'model', text: result.content, grounding: result.groundingMetadata },
            ]);
            setImageBase64('');
            setImageMime('');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setStreaming(false);
            setLoading(false);
            abortRef.current = null;
        }
    }, [input, model, thinkingEnabled, groundingEnabled, imageBase64, imageMime]);

    const handleStop = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setStreaming(false);
        setLoading(false);
    }, []);

    return (
        <div
            style={{
                background: '#1a1a2e',
                borderRadius: 12,
                border: '1px solid #2a2a4e',
                overflow: 'hidden',
            }}
        >
            <div style={{ height: 400, overflowY: 'auto', padding: 16 }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                        <Send size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p>Send a message to Gemini via the SDK</p>
                        <p style={{ fontSize: 12 }}>
                            Supports: Thinking {thinkingEnabled ? '✅' : '❌'} · Grounding{' '}
                            {groundingEnabled ? '✅' : '❌'}
                        </p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={`${msg.role}-${i}`}
                        style={{
                            marginBottom: 12,
                            display: 'flex',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '75%',
                                padding: '10px 14px',
                                borderRadius: 12,
                                background: msg.role === 'user' ? '#4285F4' : '#2a2a4e',
                                color: '#fff',
                                fontSize: 14,
                                lineHeight: 1.5,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    color: msg.role === 'user' ? 'rgba(255,255,255,0.7)' : '#888',
                                    marginBottom: 4,
                                }}
                            >
                                {msg.role === 'user' ? 'You' : 'Gemini'}
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            {msg.grounding?.webSearchQueries &&
                                msg.grounding.webSearchQueries.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            padding: 8,
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    >
                                        <Globe
                                            size={12}
                                            style={{ marginRight: 4, verticalAlign: 'middle' }}
                                        />
                                        Grounded: {msg.grounding.webSearchQueries.join(', ')}
                                        {msg.grounding.groundingChunks?.map((chunk, ci) =>
                                            chunk.web ? (
                                                <div key={ci} style={{ marginTop: 4 }}>
                                                    <a
                                                        href={chunk.web.uri}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#8ab4f8',
                                                            textDecoration: 'none',
                                                        }}
                                                    >
                                                        ↑ {chunk.web.title}
                                                    </a>
                                                </div>
                                            ) : null,
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: 12,
                            color: '#888',
                        }}
                    >
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && (
                <div
                    style={{
                        padding: '8px 16px',
                        background: 'var(--error-tint)',
                        borderTop: '1px solid rgba(239,68,68,0.3)',
                        fontSize: 12,
                        color: 'var(--error)',
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4e' }}>
                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 8,
                        fontSize: 12,
                        alignItems: 'center',
                    }}
                >
                    <label
                        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    >
                        <input
                            type="checkbox"
                            checked={thinkingEnabled}
                            onChange={(e) => setThinkingEnabled(e.target.checked)}
                        />
                        <Brain size={14} /> Thinking
                    </label>
                    <label
                        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                    >
                        <input
                            type="checkbox"
                            checked={groundingEnabled}
                            onChange={(e) => setGroundingEnabled(e.target.checked)}
                        />
                        <Globe size={14} /> Google Search
                    </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Message Gemini..."
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #333',
                            background: '#0d0d1a',
                            color: '#fff',
                            fontSize: 14,
                        }}
                    />
                    {streaming ? (
                        <button
                            onClick={handleStop}
                            style={{
                                padding: '10px 16px',
                                borderRadius: 8,
                                border: 'none',
                                background: 'var(--error)',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                        >
                            <StopCircle size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            style={{
                                padding: '10px 16px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#4285F4',
                                color: '#fff',
                                cursor: 'pointer',
                                opacity: input.trim() ? 1 : 0.5,
                            }}
                        >
                            <Send size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
