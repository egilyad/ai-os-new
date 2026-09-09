import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import {
    getAllPrompts,
    setPrompt,
    resetAllPrompts,
    type PromptRole,
} from '../../kernel/services/prompt-store';
import { useConfirm } from '../../hooks/useConfirm';
import { eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-names';

const PROMPT_LABELS: Record<PromptRole, string> = {
    attacker: 'Attacker',
    defender: 'Defender',
    judge: 'Judge',
    pro: 'Pro (for)',
    con: 'Con (against)',
    default: 'Default (fallback)',
};

const PromptsTab: React.FC = () => {
    const [prompts, setPrompts] = useState<Record<PromptRole, string>>({
        attacker: '',
        defender: '',
        judge: '',
        pro: '',
        con: '',
        default: '',
    });
    const [saved, setSaved] = useState(false);
    const [resetDone, setResetDone] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    useEffect(() => {
        getAllPrompts()
            .then(setPrompts)
            .catch((e) => {
                console.error('[PromptsTab] Failed to load prompts:', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to load prompt templates',
                    type: 'error' as const,
                });
            });
    }, []);

    useEffect(() => {
        if (saved || resetDone) {
            const t = setTimeout(() => {
                setSaved(false);
                setResetDone(false);
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [saved, resetDone]);

    const handleChange = (role: PromptRole, value: string) => {
        setPrompt(role, value);
        setPrompts((prev) => ({ ...prev, [role]: value }));
        setSaved(true);
    };

    const handleReset = async () => {
        if (
            !(await confirm({
                title: 'Reset Prompts',
                message:
                    'Are you sure you want to reset all prompts to defaults? This cannot be undone.',
                variant: 'danger',
            }))
        )
            return;
        resetAllPrompts();
        getAllPrompts().then(setPrompts);
        setResetDone(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        Debate System Prompts
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                        Customize the system prompts for each agent role in debates
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        background: 'var(--error-tint)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <RotateCcw size={14} /> Reset to Defaults
                </button>
            </div>

            {(saved || resetDone) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        background: resetDone ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                        border: `1px solid ${resetDone ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        color: resetDone ? '#f59e0b' : '#10b981',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                    }}
                >
                    {resetDone ? 'Restored to defaults' : 'Saved'}
                </motion.div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(Object.keys(PROMPT_LABELS) as PromptRole[]).map((role) => (
                    <div
                        key={role}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
                    >
                        <label
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--slate-400)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}
                        >
                            {PROMPT_LABELS[role]}
                        </label>
                        <textarea
                            value={prompts[role]}
                            onChange={(e) => handleChange(role, e.target.value)}
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 10,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--slate-200)',
                                fontSize: '0.85rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                resize: 'vertical',
                                outline: 'none',
                            }}
                        />
                    </div>
                ))}
            </div>
            <ConfirmDialog />
        </div>
    );
};

export default PromptsTab;
