import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Play, Trash2, Quote, Copy } from 'lucide-react';
import type { ResearchSession, CitationFormat } from '../../kernel/contracts/research-engine';
import { researchEngine } from '../../kernel/instances';
import { StatusBadge, CITATION_FORMATS } from './research-constants';
import LoopCard from './LoopCard';

interface SessionCardProps {
    session: ResearchSession;
    expanded: boolean;
    onToggle: () => void;
    onRun: () => void;
    onDelete: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
    session,
    expanded,
    onToggle,
    onRun,
    onDelete,
}) => {
    const [citations, setCitations] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('bibtex');
    const [generating, setGenerating] = useState(false);

    const handleGenerateCitations = useCallback(async () => {
        setGenerating(true);
        try {
            const result = await researchEngine.generateCitations(session.id, selectedFormat);
            setCitations(result.content);
        } catch {
            setCitations('Failed to generate citations.');
        }
        setGenerating(false);
    }, [session.id, selectedFormat]);

    const handleCopyCitations = useCallback(() => {
        if (citations) navigator.clipboard.writeText(citations);
    }, [citations]);

    const isBusy =
        session.status === 'searching' ||
        session.status === 'extracting' ||
        session.status === 'synthesizing';

    return (
        <motion.div
            layout
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
            }}
        >
            <div
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                {expanded ? (
                    <ChevronDown size={16} color="#64748b" />
                ) : (
                    <ChevronRight size={16} color="#64748b" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            marginBottom: 2,
                        }}
                    >
                        {session.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {session.loops.length} loop{session.loops.length !== 1 ? 's' : ''} ·{' '}
                        {new Date(session.createdAt).toLocaleString()}
                    </div>
                </div>
                <StatusBadge status={session.status} />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRun();
                    }}
                    disabled={isBusy}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'var(--success-tint)',
                        color: 'var(--success)',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        opacity: isBusy ? 0.5 : 1,
                    }}
                >
                    <Play size={12} /> Run
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        opacity: 0.6,
                    }}
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div
                            style={{
                                padding: '8px 16px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                            }}
                        >
                            {session.loops.length === 0 && (
                                <div
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: 'var(--slate-500)',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    No loops yet. Click{' '}
                                    <strong style={{ color: 'var(--success)' }}>Run</strong> to start.
                                </div>
                            )}
                            {session.loops.map((loop, idx) => (
                                <LoopCard key={loop.question.id} loop={loop} index={idx} />
                            ))}
                            {session.loops.length > 0 && (
                                <>
                                    <div
                                        style={{
                                            height: 1,
                                            background: 'rgba(255,255,255,0.06)',
                                            margin: '4px 0',
                                        }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Quote size={14} color="#a855f7" />
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            Citations
                                        </span>
                                        <select
                                            value={selectedFormat}
                                            onChange={(e) =>
                                                setSelectedFormat(e.target.value as CitationFormat)
                                            }
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '3px 6px',
                                                borderRadius: 4,
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'var(--slate-400)',
                                                outline: 'none',
                                            }}
                                        >
                                            {CITATION_FORMATS.map((f) => (
                                                <option key={f.value} value={f.value}>
                                                    {f.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleGenerateCitations}
                                            disabled={generating}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                border: '1px solid rgba(168,85,247,0.3)',
                                                background: 'var(--purple-tint)',
                                                color: '#a855f7',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {generating ? 'Generating...' : 'Generate'}
                                        </button>
                                        {citations && (
                                            <button
                                                onClick={handleCopyCitations}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    background: 'transparent',
                                                    color: 'var(--slate-400)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.7rem',
                                                }}
                                            >
                                                <Copy size={12} /> Copy All
                                            </button>
                                        )}
                                    </div>
                                    {citations && (
                                        <pre
                                            style={{
                                                fontSize: '0.65rem',
                                                lineHeight: 1.5,
                                                color: 'var(--slate-400)',
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: 12,
                                                borderRadius: 8,
                                                overflow: 'auto',
                                                maxHeight: 300,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {citations}
                                        </pre>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SessionCard;
