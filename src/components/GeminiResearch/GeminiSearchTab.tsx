import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import type {
    IGeminiResearchService,
    GeminiEnhancedSearchResult,
} from '../../kernel/contracts/gemini-research';

interface Props {
    service: IGeminiResearchService;
}

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
};

export const GeminiSearchTab: React.FC<Props> = ({ service }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<GeminiEnhancedSearchResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!query.trim() || !service) return;
        setLoading(true);
        try {
            const r = await service.enhancedSearch(query);
            setResult(r);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [query, service]);

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Ask a research question..."
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.9rem',
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={loading || !query.trim() || !service}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: loading ? '#3b82f640' : '#3b82f6',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        opacity: !service ? 0.4 : 1,
                    }}
                >
                    {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                    {loading ? 'Searching...' : 'Search with Gemini'}
                </button>
            </div>

            {!service && (
                <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: 'var(--slate-500)' }}>
                    <Sparkles size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div>Gemini Research service not available</div>
                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                        Ensure Gemini API key is configured
                    </div>
                </div>
            )}

            {result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--slate-200)' }}>Results</h3>
                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                fontSize: '0.75rem',
                                color: 'var(--slate-500)',
                            }}
                        >
                            <span>Confidence: {(result.confidence * 100).toFixed(0)}%</span>
                            <span>Latency: {result.latency}ms</span>
                            <span>{result.sources.length} sources</span>
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            color: 'var(--slate-300)',
                            lineHeight: 1.7,
                            marginBottom: 12,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {result.answer}
                    </div>
                    {result.sources.map((s, i) => (
                        <div
                            key={`${s.title}-${i}`}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                padding: '6px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.8rem',
                                color: 'var(--slate-400)',
                            }}
                        >
                            <ExternalLink
                                size={12}
                                style={{ marginTop: 3, flexShrink: 0, color: 'var(--accent)' }}
                            />
                            <div>
                                <div style={{ color: '#60a5fa', fontWeight: 500 }}>{s.title}</div>
                                <div
                                    style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: 2 }}
                                >
                                    {s.snippet}
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};
