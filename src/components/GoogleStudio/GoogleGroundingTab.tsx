import { useState, useCallback, useRef, useEffect } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Globe, Loader2 } from 'lucide-react';
import type { ChatMessage, ProviderResponse } from '../../kernel/types/llm-types';

interface GoogleGroundingTabProps {
    model: string;
}

export function GoogleGroundingTab({ model }: GoogleGroundingTabProps) {
    const [loading, setLoading] = useState(false);
    const [result, setLocalResult] = useState<ProviderResponse | null>(null);
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => abortRef.current?.abort();
    }, []);

    const handleTest = useCallback(async () => {
        setLoading(true);
        setError('');
        setLocalResult(null);
        const abort = new AbortController();
        abortRef.current = abort;

        const testMessages: ChatMessage[] = [
            {
                role: 'user',
                content: 'What are the latest developments in AI in 2026? Include citations.',
            },
        ];
        try {
            const r = await googleGenAIService.generateContent(
                testMessages,
                model,
                { googleSearchGrounding: true },
                abort.signal,
            );
            setLocalResult(r);
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
                <Globe size={20} color="#34A853" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Google Search Grounding</h3>
            </div>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
                Gemini can search the web in real-time to provide accurate, up-to-date answers with
                citations. Uses{' '}
                <code style={{ background: '#0d0d1a', padding: '2px 6px', borderRadius: 4 }}>
                    tools: [{'{'}googleSearch: {'{}{}'} {'}'}]
                </code>
            </p>
            <button
                onClick={handleTest}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#34A853',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: loading ? 0.5 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null} Test Grounding
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
            {result?.groundingMetadata && (
                <div
                    style={{
                        marginTop: 16,
                        padding: 16,
                        background: '#0d0d1a',
                        borderRadius: 8,
                    }}
                >
                    <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Grounding Result</h4>
                    <div
                        style={{
                            fontSize: 13,
                            color: '#ccc',
                            whiteSpace: 'pre-wrap',
                            marginBottom: 12,
                        }}
                    >
                        {result.content}
                    </div>
                    {result.groundingMetadata.webSearchQueries?.map((q) => (
                        <div key={q} style={{ fontSize: 12, color: '#8ab4f8', marginBottom: 4 }}>
                            Search: {q}
                        </div>
                    ))}
                    {result.groundingMetadata.groundingChunks?.map(
                        (chunk: { web?: { uri: string; title: string } }) =>
                            chunk.web && (
                                <div key={chunk.web.uri} style={{ fontSize: 12, padding: '4px 0' }}>
                                    <a
                                        href={chunk.web.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#8ab4f8' }}
                                    >
                                        {chunk.web.title}
                                    </a>
                                </div>
                            ),
                    )}
                </div>
            )}
            {!result && !loading && !error && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    <Globe size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>Test Google Search Grounding with Gemini</p>
                </div>
            )}
        </div>
    );
}
