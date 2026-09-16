import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { textMutedXs, textSecondaryXs, textWhiteXs } from '../../styles/common';
import type { JournalEntry } from '../../kernel/services/agent-journal-service';
import { OUTCOME_COLORS } from './journal-constants';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { AgentAvatar } from '../AgentsPanel/AgentAvatar';

interface JournalEntryCardProps {
    entry: JournalEntry;
    totalTasks: number;
    onFilterByAgent: (agentId: string) => void;
    onDelete: (id: string) => void;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = memo(
    ({ entry, totalTasks, onFilterByAgent, onDelete }) => {
        const { t } = useTranslation();
        const identity = resolveAgentIdentity(entry.agentId);
        return (
            <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    alignItems: 'center',
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                padding: '0.1rem 0.5rem',
                                borderRadius: 6,
                                background: `${OUTCOME_COLORS[entry.outcome]}20`,
                                color: OUTCOME_COLORS[entry.outcome],
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                            }}
                        >
                            {entry.outcome}
                        </span>
                        <AgentAvatar
                            agentId={entry.agentId}
                            name={identity.displayName}
                            size={20}
                            emoji={identity.avatar.emoji}
                            color={identity.avatar.color}
                            url={identity.avatar.url}
                        />
                        <span style={{ ...textWhiteXs, fontSize: '0.85rem' }}>
                            {identity.displayName}
                        </span>
                        <span style={{ ...textMutedXs, fontSize: '0.7rem' }}>
                            · {entry.taskType}
                        </span>
                        <span style={textMutedXs}>
                            · {new Date(entry.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div style={{ ...textSecondaryXs, marginTop: 4, fontSize: '0.8rem' }}>
                        {entry.taskDescription}
                    </div>
                    {entry.notes && (
                        <div style={{ ...textMutedXs, marginTop: 2, fontStyle: 'italic' }}>
                            {entry.notes}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {entry.tags.map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    padding: '0.05rem 0.4rem',
                                    borderRadius: 8,
                                    background: 'var(--purple-tint)',
                                    color: '#c4b5fd',
                                    fontSize: '0.6rem',
                                }}
                            >
                                #{tag}
                            </span>
                        ))}
                        <span style={{ ...textMutedXs, fontSize: '0.65rem' }}>
                            ⏱ {(entry.durationMs / 1000).toFixed(1)}s · {entry.tokensUsed} tokens
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button
                        onClick={() => onFilterByAgent(entry.agentId)}
                        style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: 6,
                            border: '1px solid rgba(59,130,246,0.3)',
                            background: 'var(--accent-tint)',
                            color: '#93c5fd',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                        title={t('agent_journal.filter_by_agent')}
                    >
                        {totalTasks} {t('agent_journal.total_tasks')}
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            padding: 4,
                        }}
                        aria-label="Delete journal entry"
                    >
                        <X size={14} />
                    </button>
                </div>
            </motion.div>
        );
    },
);
