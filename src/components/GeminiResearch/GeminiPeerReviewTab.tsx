import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Copy, Check, Loader2 } from 'lucide-react';
import type {
    IGeminiResearchService,
    GeminiPeerReviewOutput,
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

const recommendationColor = (rec: string) => {
    switch (rec) {
        case 'accept':
            return '#22c55e';
        case 'minor_revision':
            return '#3b82f6';
        case 'major_revision':
            return '#f59e0b';
        case 'reject':
            return '#ef4444';
        default:
            return '#64748b';
    }
};

export const GeminiPeerReviewTab: React.FC<Props> = ({ service, sessionId }) => {
    const [data, setData] = useState<GeminiPeerReviewOutput | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleRun = useCallback(async () => {
        if (!sessionId || !service) return;
        setLoading(true);
        try {
            const r = await service.runEnhancedPeerReview(sessionId);
            setData(r);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [sessionId, service]);

    const copyText = useCallback(() => {
        if (!data) return;
        navigator.clipboard.writeText(data.summary);
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
                    background: loading ? '#ec489940' : '#ec4899',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: 16,
                    opacity: !sessionId || !service ? 0.4 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="spin" /> : <Users size={16} />}
                {loading ? 'Reviewing...' : 'Run Peer Review with Gemini'}
            </button>

            {data && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: 8,
                            marginBottom: 16,
                        }}
                    >
                        {[
                            { label: 'Originality', value: data.originality, color: 'var(--purple)' },
                            { label: 'Methodology', value: data.methodology, color: 'var(--accent)' },
                            { label: 'Clarity', value: data.clarity, color: '#06b6d4' },
                            { label: 'Significance', value: data.significance, color: 'var(--success)' },
                            { label: 'Overall', value: data.overall, color: '#f97316' },
                        ].map((s) => (
                            <div
                                key={s.label}
                                style={{ ...cardStyle, textAlign: 'center', marginBottom: 0 }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        textTransform: 'uppercase',
                                        marginBottom: 4,
                                    }}
                                >
                                    {s.label}
                                </div>
                                <div
                                    style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}
                                >
                                    {s.value}
                                </div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.06)',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            width: `${s.value}%`,
                                            background: s.color,
                                            transition: 'width 0.5s',
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            ...cardStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            borderLeft: `3px solid ${recommendationColor(data.recommendation)}`,
                        }}
                    >
                        <Star
                            size={20}
                            style={{ color: recommendationColor(data.recommendation) }}
                        />
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                Recommendation
                            </div>
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: recommendationColor(data.recommendation),
                                }}
                            >
                                {data.recommendation.replace(/_/g, ' ')}
                            </div>
                        </div>
                        <button
                            onClick={copyText}
                            style={{
                                marginLeft: 'auto',
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

                    <div style={cardStyle}>
                        <h4
                            style={{
                                margin: '0 0 8px',
                                fontSize: '0.85rem',
                                color: '#ec4899',
                                fontWeight: 600,
                            }}
                        >
                            Review Summary
                        </h4>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                color: 'var(--slate-300)',
                                lineHeight: 1.6,
                            }}
                        >
                            {data.summary}
                        </p>
                    </div>

                    {data.comments.length > 0 && (
                        <div>
                            <h4
                                style={{
                                    margin: '0 0 12px',
                                    fontSize: '0.85rem',
                                    color: 'var(--slate-400)',
                                    fontWeight: 600,
                                }}
                            >
                                Comments ({data.comments.length})
                            </h4>
                            {data.comments.map((c, i) => {
                                const typeColors: Record<string, string> = {
                                    major_issue: '#ef4444',
                                    minor_issue: '#f59e0b',
                                    question: '#3b82f6',
                                    suggestion: '#8b5cf6',
                                    praise: '#22c55e',
                                };
                                const sevColors: Record<string, string> = {
                                    critical: '#ef4444',
                                    major: '#f59e0b',
                                    minor: '#3b82f6',
                                    cosmetic: '#64748b',
                                };
                                return (
                                    <div key={`${c.section}-${c.type}-${i}`} style={cardStyle}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 6,
                                                marginBottom: 6,
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {c.section && (
                                                <span
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: 'rgba(255,255,255,0.06)',
                                                        color: 'var(--slate-400)',
                                                    }}
                                                >
                                                    {c.section}
                                                </span>
                                            )}
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    fontWeight: 600,
                                                    background: `${typeColors[c.type] || '#64748b'}20`,
                                                    color: typeColors[c.type] || '#64748b',
                                                }}
                                            >
                                                {c.type.replace(/_/g, ' ')}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    fontWeight: 600,
                                                    background: `${sevColors[c.severity] || '#64748b'}20`,
                                                    color: sevColors[c.severity] || '#64748b',
                                                }}
                                            >
                                                {c.severity}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)' }}>
                                            {c.comment}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};
