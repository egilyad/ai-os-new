import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Tag, Target, Code, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { MemoryEntry } from '../../types/memory';

interface MemoryCardProps {
    memory: MemoryEntry;
    index: number;
    searchQuery: string;
    isSearching: boolean;
    onDelete: (id: string) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = memo(
    ({ memory, index, searchQuery, isSearching, onDelete }) => {
        const { t } = useTranslation();
        const isCode = (memory.metadata as Record<string, unknown>).type === 'code';

        return (
            <motion.div
                key={memory.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                className="glass-panel"
                style={{
                    padding: '1.5rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
                whileHover={{
                    y: -2,
                    borderColor: 'rgba(16,185,129,0.3)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}
                role="listitem"
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                color: 'var(--success)',
                                background: 'rgba(16,185,129,0.15)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 6,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                border: '1px solid rgba(16,185,129,0.2)',
                            }}
                        >
                            {memory.metadata.type || t('memory.context_fallback')}
                        </div>
                        <span
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: 'var(--slate-500)',
                            }}
                            aria-hidden="true"
                        />
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                fontFamily: 'monospace',
                            }}
                        >
                            ID: {memory.id.split('-')[0]}...
                        </span>
                    </div>
                    {searchQuery && !isSearching && memory.score !== undefined && (
                        <div
                            style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: 'var(--success)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'var(--success-tint)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 8,
                                border: '1px solid rgba(16,185,129,0.2)',
                            }}
                        >
                            <Target size={12} aria-hidden="true" />{' '}
                            {Math.min(100, Math.round((memory.score || 0) * 100))}
                            {t('memory.match_label')}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        fontSize: '0.95rem',
                        color: 'var(--slate-200)',
                        lineHeight: 1.6,
                        fontFamily: isCode ? '"JetBrains Mono", monospace' : 'inherit',
                    }}
                >
                    {memory.content}
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        paddingTop: '1rem',
                        marginTop: '0.25rem',
                    }}
                >
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Clock size={12} aria-hidden="true" />{' '}
                            {new Date(memory.metadata.timestamp).toLocaleTimeString()}
                        </span>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Tag size={12} aria-hidden="true" />{' '}
                            {memory.metadata.source || 'system'}
                        </span>
                        <span
                            style={{
                                fontSize: '0.7rem',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 600,
                                background:
                                    (memory.metadata.importance ?? 0) >= 0.8
                                        ? 'rgba(239,68,68,0.15)'
                                        : (memory.metadata.importance ?? 0) >= 0.5
                                          ? 'rgba(245,158,11,0.15)'
                                          : 'rgba(100,116,139,0.15)',
                                color:
                                    (memory.metadata.importance ?? 0) >= 0.8
                                        ? '#ef4444'
                                        : (memory.metadata.importance ?? 0) >= 0.5
                                          ? '#f59e0b'
                                          : '#94a3b8',
                            }}
                        >
                            ★{memory.metadata.importance ?? 0}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: 8 }}
                            title={t('memory.view_embeddings')}
                            aria-label="View embedding details"
                        >
                            <Code size={16} color="#64748b" aria-hidden="true" />
                        </button>
                        <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem', borderRadius: 8, color: 'var(--error)' }}
                            title={t('memory.delete_vector')}
                            aria-label={t('common.aria.delete')}
                            onClick={() => onDelete(memory.id)}
                        >
                            <Trash2 size={16} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    },
);

export default MemoryCard;
