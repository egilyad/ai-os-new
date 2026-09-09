import { useState, useCallback, useRef, useEffect } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Brain, Loader2 } from 'lucide-react';
import type { ChatMessage, ProviderResponse } from '../../kernel/types/llm-types';

interface GoogleThinkingTabProps {
    model: string;
}

export function GoogleThinkingTab({ model }: GoogleThinkingTabProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ProviderResponse | null>(null);
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const handleTest = useCallback(async () => {
        setLoading(true);
        setError('');
        setResult(null);
        const abort = new AbortController();
        abortRef.current = abort;

        const testMessages: ChatMessage[] = [
            {
                role: 'user',
                content:
                    'Solve a complex multi-step reasoning problem: A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Explain your reasoning step by step.',
            },
        ];
        try {
            const r = await googleGenAIService.generateContent(
                testMessages,
                model,
                { thinkingConfig: { type: 'ENABLED' } },
                abort.signal,
            );
            setResult(r);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }, [model]);

    return (
        <div
            style={{
                background: '#1a1a2e',
                borderRadius: 12,
                border: '1px solid #2a2a4e',
                padding: 24,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Brain size={20} color="#FBBC04" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Deep Thinking (Gemini 2.5)</h3>
            </div>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                Enables chain-of-thought reasoning for complex multi-step problems. Uses{' '}
                <code style={{ background: '#0d0d1a', padding: '2px 6px', borderRadius: 4 }}>
                    thinkingConfig: {'{'}type: "ENABLED"{'}'}
                </code>
            </p>
            <button
                onClick={handleTest}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#FBBC04',
                    color: '#000',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: loading ? 0.5 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null} Test Deep Thinking
            </button>
            {error && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 8,
                        background: 'var(--error-tint)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--error)',
                    }}
                >
                    {error}
                </div>
            )}
            {result && !loading && (
                <div
                    style={{
                        marginTop: 16,
                        padding: 16,
                        background: '#0d0d1a',
                        borderRadius: 8,
                    }}
                >
                    <div style={{ fontSize: 13, color: '#ccc', whiteSpace: 'pre-wrap' }}>
                        {result.content}
                    </div>
                </div>
            )}
            {!result && !loading && !error && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    <Brain size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>Test Gemini's deep thinking capabilities</p>
                </div>
            )}
        </div>
    );
}
