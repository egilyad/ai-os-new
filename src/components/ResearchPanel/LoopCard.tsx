import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ExternalLink, AlertCircle, Lightbulb } from 'lucide-react';
import type { EpistemicLoopResult } from '../../kernel/contracts/research-engine';
import { StatusBadge, SOURCE_COLORS, SOURCE_LABELS } from './research-constants';

interface LoopCardProps {
    loop: EpistemicLoopResult;
    index: number;
}

const LoopCard: React.FC<LoopCardProps> = ({ loop, index }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <motion.div
            layout
            style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                overflow: 'hidden',
            }}
        >
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    cursor: 'pointer',
                }}
            >
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background:
                            loop.status === 'complete'
                                ? 'rgba(34,197,94,0.2)'
                                : loop.status === 'error'
                                  ? 'rgba(239,68,68,0.2)'
                                  : 'rgba(100,116,139,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color:
                            loop.status === 'complete'
                                ? '#22c55e'
                                : loop.status === 'error'
                                  ? '#ef4444'
                                  : '#64748b',
                    }}
                >
                    {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-400)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {loop.question.text.slice(0, 100)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: 1 }}>
                        {loop.sources.length} sources · {loop.claims.length} claims
                        {loop.completedAt &&
                            ` · ${((loop.completedAt - loop.startedAt) / 1000).toFixed(1)}s`}
                    </div>
                </div>
                <StatusBadge status={loop.status} />
                {expanded ? (
                    <ChevronDown size={12} color="#64748b" />
                ) : (
                    <ChevronRight size={12} color="#64748b" />
                )}
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                    >
                        <div
                            style={{
                                padding: '8px 12px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                fontSize: '0.75rem',
                            }}
                        >
                            {loop.synthesis && (
                                <>
                                    <div>
                                        <div
                                            style={{
                                                color: 'var(--slate-400)',
                                                fontWeight: 600,
                                                marginBottom: 4,
                                            }}
                                        >
                                            Summary
                                        </div>
                                        <div style={{ color: 'var(--slate-300)', lineHeight: 1.5 }}>
                                            {loop.synthesis.summary}
                                        </div>
                                    </div>
                                    {loop.synthesis.keyFindings.length > 0 && (
                                        <div>
                                            <div
                                                style={{
                                                    color: 'var(--slate-400)',
                                                    fontWeight: 600,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Key Findings
                                            </div>
                                            {loop.synthesis.keyFindings.map((f) => (
                                                <div
                                                    key={f}
                                                    style={{
                                                        display: 'flex',
                                                        gap: 6,
                                                        marginBottom: 3,
                                                        color: 'var(--slate-300)',
                                                    }}
                                                >
                                                    <span style={{ color: 'var(--success)' }}>•</span> {f}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {loop.synthesis.gaps.length > 0 && (
                                        <div>
                                            <div
                                                style={{
                                                    color: 'var(--slate-400)',
                                                    fontWeight: 600,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Gaps
                                            </div>
                                            {loop.synthesis.gaps.map((g) => (
                                                <div
                                                    key={g}
                                                    style={{
                                                        display: 'flex',
                                                        gap: 6,
                                                        marginBottom: 3,
                                                        color: 'var(--warning)',
                                                    }}
                                                >
                                                    <AlertCircle size={12} /> {g}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {loop.synthesis.newQuestions.length > 0 && (
                                        <div>
                                            <div
                                                style={{
                                                    color: 'var(--slate-400)',
                                                    fontWeight: 600,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                New Questions
                                            </div>
                                            {loop.synthesis.newQuestions.map((q) => (
                                                <div
                                                    key={q}
                                                    style={{
                                                        display: 'flex',
                                                        gap: 6,
                                                        marginBottom: 3,
                                                        color: 'var(--purple-muted)',
                                                    }}
                                                >
                                                    <Lightbulb size={12} /> {q}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {loop.sources.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            color: 'var(--slate-400)',
                                            fontWeight: 600,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Sources ({loop.sources.length})
                                    </div>
                                    {loop.sources.slice(0, 5).map((src) => (
                                        <div
                                            key={src.id}
                                            style={{
                                                display: 'flex',
                                                gap: 6,
                                                marginBottom: 2,
                                                color: 'var(--slate-500)',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <ExternalLink size={10} />
                                            <span
                                                style={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {src.title}
                                            </span>
                                            {src.sourceType && (
                                                <span
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        padding: '1px 5px',
                                                        borderRadius: 3,
                                                        background: `${SOURCE_COLORS[src.sourceType] || '#64748b'}22`,
                                                        color:
                                                            SOURCE_COLORS[src.sourceType] ||
                                                            '#64748b',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {SOURCE_LABELS[src.sourceType] ||
                                                        src.sourceType}
                                                </span>
                                            )}
                                            {src.authors && src.authors.length > 0 && (
                                                <span
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        color: 'var(--slate-600)',
                                                        maxWidth: 100,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {src.authors[0]}
                                                    {src.authors.length > 1 ? ' et al.' : ''}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '0.65rem', color: 'var(--slate-600)' }}>
                                                {(src.relevanceScore * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {loop.error && (
                                <div style={{ color: 'var(--error)', fontSize: '0.72rem' }}>
                                    Error: {loop.error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LoopCard;
