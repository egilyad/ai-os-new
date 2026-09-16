import { useState, useCallback, useRef, useEffect } from 'react';
import { googleGenAIService } from '../../kernel/instances';
import { Building2, Database, Loader2 } from 'lucide-react';
import type { ChatMessage, ProviderResponse } from '../../kernel/types/llm-types';

interface GoogleVertexTabProps {
    model: string;
}

export function GoogleVertexTab({ model }: GoogleVertexTabProps) {
    const [datastore, setDatastore] = useState('');
    const [dynamicThreshold, setDynamicThreshold] = useState(0.5);
    const [dynamicMode, setDynamicMode] = useState<'MODE_DYNAMIC' | 'MODE_STATIC'>('MODE_DYNAMIC');
    const [result, setResult] = useState<ProviderResponse | null>(null);
    const [loading, setLoading] = useState(false);
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
                    'What information is available in our enterprise knowledge base about this topic?',
            },
        ];
        try {
            const r = await googleGenAIService.generateContent(
                testMessages,
                model,
                {
                    vertexSearchGrounding: {
                        datastore: datastore.trim() || undefined,
                        dynamicRetrievalConfig: {
                            mode: dynamicMode,
                            dynamicThreshold,
                        },
                    },
                },
                abort.signal,
            );
            setResult(r);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    }, [model, datastore, dynamicMode, dynamicThreshold]);

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
                <Building2 size={20} color="#4285F4" />
                <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>Vertex AI Search Grounding</h3>
                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: 12 }}>
                        Enterprise grounding against private data sources via Vertex AI Search
                    </p>
                </div>
            </div>

            <div
                style={{
                    marginBottom: 20,
                    padding: 16,
                    background: '#0d0d1a',
                    borderRadius: 8,
                    fontSize: 13,
                }}
            >
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 4, color: '#aaa' }}>
                        Vertex AI Search Datastore{' '}
                        <span style={{ color: '#666' }}>
                            (optional — leave empty for googleSearchRetrieval)
                        </span>
                    </label>
                    <input
                        value={datastore}
                        onChange={(e) => setDatastore(e.target.value)}
                        placeholder="projects/.../locations/global/collections/default_collection/dataStores/my-datastore"
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 8,
                            border: '1px solid #333',
                            background: '#0d0d1a',
                            color: '#fff',
                            fontSize: 13,
                            fontFamily: 'monospace',
                        }}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 4,
                                color: '#aaa',
                                fontSize: 12,
                            }}
                        >
                            Retrieval Mode
                        </label>
                        <select
                            value={dynamicMode}
                            onChange={(e) =>
                                setDynamicMode(e.target.value as 'MODE_DYNAMIC' | 'MODE_STATIC')
                            }
                            style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid #333',
                                background: '#0d0d1a',
                                color: '#fff',
                                fontSize: 12,
                            }}
                        >
                            <option value="MODE_DYNAMIC">Dynamic</option>
                            <option value="MODE_STATIC">Static</option>
                        </select>
                    </div>
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 4,
                                color: '#aaa',
                                fontSize: 12,
                            }}
                        >
                            Dynamic Threshold: {dynamicThreshold.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={dynamicThreshold}
                            onChange={(e) => setDynamicThreshold(parseFloat(e.target.value))}
                            style={{ width: 140, verticalAlign: 'middle' }}
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={handleTest}
                disabled={loading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#4285F4',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    opacity: loading ? 0.5 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                Test Vertex Search Grounding
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
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                        }}
                    >
                        <h4 style={{ margin: 0, fontSize: 14 }}>Result</h4>
                        <span style={{ fontSize: 11, color: '#666' }}>
                            {result.latency}ms · {result.tokens} tokens
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: '#ccc',
                            whiteSpace: 'pre-wrap',
                            marginBottom: 12,
                        }}
                    >
                        {result.content || (
                            <span style={{ color: 'var(--error)' }}>
                                {result.error || 'No content returned'}
                            </span>
                        )}
                    </div>
                    {result.groundingMetadata?.webSearchQueries && (
                        <div style={{ fontSize: 12, color: '#8ab4f8', marginBottom: 8 }}>
                            Search queries: {result.groundingMetadata.webSearchQueries.join(', ')}
                        </div>
                    )}
                    {result.groundingMetadata?.groundingChunks?.map(
                        (
                            chunk: {
                                web?: { uri: string; title: string };
                                retrievedContext?: { title: string };
                            },
                            i: number,
                        ) => (
                            <div
                                key={chunk.web?.uri ?? i}
                                style={{ fontSize: 12, padding: '4px 0' }}
                            >
                                {chunk.web && (
                                    <a
                                        href={chunk.web.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#8ab4f8' }}
                                    >
                                        {chunk.web.title}
                                    </a>
                                )}
                                {chunk.retrievedContext && (
                                    <span style={{ color: '#34A853' }}>
                                        {chunk.retrievedContext.title}
                                    </span>
                                )}
                            </div>
                        ),
                    )}
                </div>
            )}

            {!result && !loading && !error && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <p style={{ fontSize: 13 }}>
                        Test Vertex Search grounding against your enterprise data
                    </p>
                    <p style={{ fontSize: 11 }}>
                        Uses{' '}
                        <code
                            style={{ background: '#0d0d1a', padding: '2px 6px', borderRadius: 4 }}
                        >
                            googleSearchRetrieval
                        </code>{' '}
                        or{' '}
                        <code
                            style={{ background: '#0d0d1a', padding: '2px 6px', borderRadius: 4 }}
                        >
                            vertexAiSearch
                        </code>{' '}
                        tool
                    </p>
                </div>
            )}
        </div>
    );
}
