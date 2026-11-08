import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, History, Clock } from 'lucide-react';
import {
    getAllPrompts,
    setPrompt,
    resetAllPrompts,
    getVersionHistory,
    rollbackPrompt,
    type PromptRole,
    type PromptRoleVersion,
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
    const [history, setHistory] = useState<Partial<Record<PromptRole, PromptRoleVersion[]>>>({});
    const [openRole, setOpenRole] = useState<PromptRole | null>(null);
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
        void refreshHistory();
    }, []);

    const refreshHistory = async () => {
        const roles = Object.keys(PROMPT_LABELS) as PromptRole[];
        const entries = await Promise.all(roles.map((r) => getVersionHistory(r)));
        const next: Partial<Record<PromptRole, PromptRoleVersion[]>> = {};
        roles.forEach((r, i) => {
            next[r] = entries[i];
        });
        setHistory(next);
    };

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
        void setPrompt(role, value);
        setPrompts((prev) => ({ ...prev, [role]: value }));
        setSaved(true);
        void refreshHistory();
    };

    const handleRollback = async (role: PromptRole, versionId: string) => {
        const ok = await rollbackPrompt(role, versionId);
        if (ok) {
            const fresh = await getAllPrompts();
            setPrompts(fresh);
            await refreshHistory();
        }
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
                        border: 'var(--1px solid var(--error-tint))',
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
                                background: 'var(--bg-elevated)',
                                border: 'var(--1px solid var(--border-subtle))',
                                color: 'var(--slate-200)',
                                fontSize: '0.85rem',
                                fontFamily: '"JetBrains Mono", monospace',
                                resize: 'vertical',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={() => setOpenRole(openRole === role ? null : role)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                alignSelf: 'flex-start',
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: 0,
                            }}
                        >
                            <History size={13} /> History ({(history[role] ?? []).length})
                        </button>
                        {openRole === role && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 8,
                                    padding: '0.5rem',
                                }}
                            >
                                {(history[role] ?? []).length === 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                        No recorded versions yet.
                                    </div>
                                )}
                                {(history[role] ?? []).map((v) => (
                                    <div
                                        key={v.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-400)',
                                        }}
                                    >
                                        <Clock size={12} />
                                        <span style={{ fontFamily: 'monospace', flexShrink: 0 }}>
                                            {new Date(v.createdAt).toLocaleString()}
                                        </span>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {v.comment}
                                        </span>
                                        <button
                                            onClick={() => void handleRollback(role, v.id)}
                                            style={{
                                                background: 'none',
                                                border: '1px solid rgba(245,158,11,0.3)',
                                                color: '#f59e0b',
                                                borderRadius: 6,
                                                padding: '2px 8px',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <RotateCcw size={11} /> Rollback
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <ConfirmDialog />
        </div>
    );
};

export default PromptsTab;
