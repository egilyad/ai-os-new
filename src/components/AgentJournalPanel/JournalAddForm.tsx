import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import type { JournalEntry } from '../../kernel/services/agent-journal-service';

interface JournalAddFormProps {
    show: boolean;
    entry: {
        agentId: string;
        agentName: string;
        taskType: string;
        taskDescription: string;
        outcome: JournalEntry['outcome'];
        durationMs: number;
        tokensUsed: number;
        notes: string;
        tags: string;
    };
    onChange: (entry: JournalAddFormProps['entry']) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const JournalAddForm: React.FC<JournalAddFormProps> = ({
    show,
    entry,
    onChange,
    onSave,
    onCancel,
}) => {
    const { t } = useTranslation();
    const set = (patch: Partial<JournalAddFormProps['entry']>) => onChange({ ...entry, ...patch });

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                        padding: '1rem',
                        borderRadius: 12,
                        border: '1px solid rgba(139,92,246,0.3)',
                        background: 'rgba(139,92,246,0.05)',
                    }}
                >
                    <h3
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#c4b5fd',
                            margin: '0 0 0.75rem',
                        }}
                    >
                        {t('agent_journal.add_new')}
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                        }}
                    >
                        <input
                            value={entry.agentId}
                            onChange={(e) => set({ agentId: e.target.value })}
                            placeholder={t('agent_journal.agent_id')}
                            style={inputStyle}
                        />
                        <input
                            value={entry.agentName}
                            onChange={(e) => set({ agentName: e.target.value })}
                            placeholder={t('agent_journal.agent_name')}
                            style={inputStyle}
                        />
                        <select
                            value={entry.taskType}
                            onChange={(e) => set({ taskType: e.target.value })}
                            style={inputStyle}
                        >
                            {[
                                'general',
                                'code',
                                'analysis',
                                'creative',
                                'research',
                                'debug',
                                'review',
                            ].map((t2) => (
                                <option key={t2} value={t2}>
                                    {t2}
                                </option>
                            ))}
                        </select>
                        <select
                            value={entry.outcome}
                            onChange={(e) =>
                                set({ outcome: e.target.value as JournalEntry['outcome'] })
                            }
                            style={inputStyle}
                        >
                            <option value="success">success</option>
                            <option value="failure">failure</option>
                            <option value="partial">partial</option>
                            <option value="in_progress">in_progress</option>
                        </select>
                        <input
                            value={entry.taskDescription}
                            onChange={(e) => set({ taskDescription: e.target.value })}
                            placeholder={t('agent_journal.task_desc')}
                            style={{ ...inputStyle, gridColumn: '1 / -1' }}
                        />
                        <input
                            type="number"
                            value={entry.durationMs || ''}
                            onChange={(e) => set({ durationMs: Number(e.target.value) || 0 })}
                            placeholder={t('agent_journal.duration_ms')}
                            style={inputStyle}
                        />
                        <input
                            type="number"
                            value={entry.tokensUsed || ''}
                            onChange={(e) => set({ tokensUsed: Number(e.target.value) || 0 })}
                            placeholder={t('agent_journal.tokens')}
                            style={inputStyle}
                        />
                        <input
                            value={entry.tags}
                            onChange={(e) => set({ tags: e.target.value })}
                            placeholder={t('agent_journal.tags_csv')}
                            style={{ ...inputStyle, gridColumn: '1 / -1' }}
                        />
                        <textarea
                            value={entry.notes}
                            onChange={(e) => set({ notes: e.target.value })}
                            placeholder={t('agent_journal.notes')}
                            style={{
                                ...inputStyle,
                                gridColumn: '1 / -1',
                                minHeight: 60,
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: '0.75rem' }}>
                        <button
                            onClick={onSave}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: 6,
                                border: 'none',
                                background: 'var(--purple)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                            }}
                        >
                            {t('agent_journal.save')}
                        </button>
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                            }}
                        >
                            {t('agent_journal.cancel')}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
};
