import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Copy, Check, Loader2 } from 'lucide-react';
import type {
    IGeminiResearchService,
    GeminiEnhancedSummary,
} from '../../kernel/contracts/gemini-research';

interface Props {
    service: IGeminiResearchService;
    sessionId: string;
}

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
};

export const GeminiSummaryTab: React.FC<Props> = ({ service, sessionId }) => {
    const [data, setData] = useState<GeminiEnhancedSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleRun = useCallback(async () => {
        if (!sessionId || !service) return;
        setLoading(true);
        try {
            const r = await service.generateEnhancedSummary(sessionId);
            setData(r);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [sessionId, service]);

    const copyText = useCallback(() => {
        if (!data) return;
        navigator.clipboard.writeText(
            `${data.abstract}\n\nKey Findings:\n${data.keyFindings.join('\n')}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [data]);

    return (
        <div>
            <button
                onClick={handleRun}
                disabled={!sessionId || loading || !service}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: loading ? '#06b6d440' : '#06b6d4',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: 16,
                    opacity: !sessionId || !service ? 0.4 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
                {loading ? 'Generating...' : 'Generate Summary with Gemini'}
            </button>

            {data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={cardStyle}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: 'var(--slate-200)' }}>
                                {data.title}
                            </h3>
                            <button
                                onClick={copyText}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-500)',
                                    cursor: 'pointer',
                                }}
                            >
                                {copied ? (
                                    <Check size={14} style={{ color: 'var(--success)' }} />
                                ) : (
                                    <Copy size={14} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <h4
                            style={{
                                margin: '0 0 8px',
                                fontSize: '0.85rem',
                                color: '#06b6d4',
                                fontWeight: 600,
                            }}
                        >
                            Abstract
                        </h4>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                color: 'var(--slate-300)',
                                lineHeight: 1.6,
                            }}
                        >
                            {data.abstract}
                        </p>
                    </div>

                    {data.keyFindings.length > 0 && (
                        <div style={cardStyle}>
                            <h4
                                style={{
                                    margin: '0 0 8px',
                                    fontSize: '0.85rem',
                                    color: 'var(--success)',
                                    fontWeight: 600,
                                }}
                            >
                                Key Findings
                            </h4>
                            {data.keyFindings.map((f) => (
                                <div
                                    key={f}
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        fontSize: '0.85rem',
                                        color: 'var(--slate-300)',
                                        marginBottom: 6,
                                    }}
                                >
                                    <ArrowRight
                                        size={14}
                                        style={{ marginTop: 2, flexShrink: 0, color: 'var(--success)' }}
                                    />
                                    {f}
                                </div>
                            ))}
                        </div>
                    )}

                    {data.methodology && (
                        <div style={cardStyle}>
                            <h4
                                style={{
                                    margin: '0 0 8px',
                                    fontSize: '0.85rem',
                                    color: '#a855f7',
                                    fontWeight: 600,
                                }}
                            >
                                Methodology
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-300)' }}>
                                {data.methodology}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 12 }}>
                        {data.limitations.length > 0 && (
                            <div style={{ ...cardStyle, flex: 1 }}>
                                <h4
                                    style={{
                                        margin: '0 0 8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--warning)',
                                        fontWeight: 600,
                                    }}
                                >
                                    Limitations
                                </h4>
                                {data.limitations.map((l) => (
                                    <div
                                        key={l}
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--slate-400)',
                                            marginBottom: 4,
                                        }}
                                    >
                                        • {l}
                                    </div>
                                ))}
                            </div>
                        )}
                        {data.futureWork.length > 0 && (
                            <div style={{ ...cardStyle, flex: 1 }}>
                                <h4
                                    style={{
                                        margin: '0 0 8px',
                                        fontSize: '0.85rem',
                                        color: 'var(--accent)',
                                        fontWeight: 600,
                                    }}
                                >
                                    Future Work
                                </h4>
                                {data.futureWork.map((f) => (
                                    <div
                                        key={f}
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--slate-400)',
                                            marginBottom: 4,
                                        }}
                                    >
                                        • {f}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};
