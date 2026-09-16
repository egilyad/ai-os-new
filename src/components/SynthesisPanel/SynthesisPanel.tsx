import React, { useCallback, useEffect, useState } from 'react';
import {
    BrainCircuit,
    RefreshCw,
    Box,
    MessageSquare,
    SlidersHorizontal,
    Tag,
    Clock,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { synthesisEngine } from '../../kernel/instances';
import type { Synthesis, SynthesisInput } from '../../kernel/types/synthesis-types';
import SynthesisComposer from './SynthesisComposer';
import SynthesisZonesView from './SynthesisZonesView';
import PerspectiveGrid from './PerspectiveGrid';

/**
 * SynthesisPanel — multi-perspective consensus engine UI.
 * Compose a question with roles × lenses, run the synthesis, review zones.
 */
const SynthesisPanel: React.FC = () => {
    const { t } = useTranslation();
    const [syntheses, setSyntheses] = useState<Synthesis[]>([]);
    const [synthesizing, setSynthesizing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState<Record<string, string>>({});

    const refresh = useCallback(async () => {
        setSyntheses(await synthesisEngine.list({}));
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleSynthesize = async (input: SynthesisInput): Promise<void> => {
        setSynthesizing(true);
        setMessage(null);
        try {
            await synthesisEngine.synthesize(input);
            await refresh();
        } finally {
            setSynthesizing(false);
        }
    };

    const handleExportCrystal = async (id: string): Promise<void> => {
        await synthesisEngine.exportToCrystal(id);
        setMessage(t('synthesis.crystal_exported'));
        await refresh();
    };

    const handleExportForum = async (id: string): Promise<void> => {
        await synthesisEngine.exportToForum(id);
        setMessage(t('synthesis.forum_exported'));
    };

    const handleRefine = async (id: string): Promise<void> => {
        const comments = feedback[id]?.trim();
        if (!comments) return;
        await synthesisEngine.refine(id, { comments });
        setMessage(`${comments} — ${t('synthesis.refined_suffix')}`);
        setFeedback((prev) => ({ ...prev, [id]: '' }));
        await refresh();
    };

    const toggleExpanded = (id: string): void => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem 1.25rem 0.6rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BrainCircuit size={18} color="#f59e0b" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('synthesis.title')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {syntheses.length} {t('synthesis.total')}
                    </span>
                </div>
                <button
                    onClick={() => void refresh()}
                    title={t('synthesis.refresh')}
                    style={{
                        padding: '0.45rem 0.8rem',
                        borderRadius: 7,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <RefreshCw size={13} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1rem' }}>
                <SynthesisComposer
                    synthesizing={synthesizing}
                    onSynthesize={(i) => void handleSynthesize(i)}
                />

                {message && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--warning)', marginBottom: 8 }}>
                        {message}
                    </div>
                )}

                {syntheses.length === 0 && (
                    <div
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--slate-600)',
                            textAlign: 'center',
                            padding: '2rem 0',
                        }}
                    >
                        {t('synthesis.no_syntheses')}
                    </div>
                )}

                {syntheses.map((s) => {
                    const isOpen = expanded.has(s.id);
                    return (
                        <div
                            key={s.id}
                            style={{
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: '#0d1526',
                                borderRadius: 10,
                                padding: '0.75rem 0.9rem',
                                marginBottom: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    cursor: 'pointer',
                                }}
                                onClick={() => toggleExpanded(s.id)}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '0.78rem',
                                            color: 'var(--slate-200)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {s.input.question}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.72rem',
                                            color: 'var(--slate-400)',
                                            marginTop: 4,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        {s.synthesizedStatement}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void handleExportCrystal(s.id);
                                        }}
                                        title={t('synthesis.export_crystal')}
                                        style={iconBtn}
                                    >
                                        <Box size={12} color="#10b981" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void handleExportForum(s.id);
                                        }}
                                        title={t('synthesis.export_forum')}
                                        style={iconBtn}
                                    >
                                        <MessageSquare size={12} color="#8b5cf6" />
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    gap: 14,
                                    alignItems: 'center',
                                    marginTop: 6,
                                    fontSize: '0.68rem',
                                    color: 'var(--slate-500)',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span style={{ color: 'var(--success)' }}>
                                    {s.confidenceDistribution.consensus.toFixed(2)}{' '}
                                    {t('synthesis.consensus')}
                                </span>
                                <span style={{ color: 'var(--error)' }}>
                                    {s.confidenceDistribution.dissent.toFixed(2)}{' '}
                                    {t('synthesis.dissent')}
                                </span>
                                <span style={{ color: 'var(--warning)' }}>
                                    {s.confidenceDistribution.uncertainty.toFixed(2)}{' '}
                                    {t('synthesis.uncertainty')}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={10} /> {s.totalTokensSpent} {t('synthesis.tokens')}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Tag size={10} /> {s.input.roleIds.length}×
                                    {s.input.lensIds.length} {t('synthesis.roles_x_lenses')}
                                </span>
                                {s.generatedCrystalId && (
                                    <span style={{ color: 'var(--success)' }}>
                                        ◆ {s.generatedCrystalId.slice(0, 16)}
                                    </span>
                                )}
                            </div>

                            {isOpen && (
                                <div style={{ marginTop: 10 }}>
                                    <SynthesisZonesView
                                        zones={[
                                            ...s.consensusZones,
                                            ...s.dissentZones,
                                            ...s.uncertaintyZones,
                                        ]}
                                    />
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            margin: '10px 0 4px',
                                            fontSize: '0.72rem',
                                            color: 'var(--purple)',
                                        }}
                                    >
                                        <SlidersHorizontal size={12} />{' '}
                                        {t('synthesis.perspectives')}
                                    </div>
                                    <PerspectiveGrid perspectives={s.perspectives} />

                                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                        <input
                                            value={feedback[s.id] ?? ''}
                                            onChange={(e) =>
                                                setFeedback((prev) => ({
                                                    ...prev,
                                                    [s.id]: e.target.value,
                                                }))
                                            }
                                            placeholder={t('synthesis.feedback_placeholder')}
                                            style={{
                                                flex: 1,
                                                background: 'var(--slate-900)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 6,
                                                color: 'var(--slate-200)',
                                                fontSize: '0.72rem',
                                                padding: '0.35rem 0.6rem',
                                            }}
                                        />
                                        <button
                                            onClick={() => void handleRefine(s.id)}
                                            style={{
                                                padding: '0.35rem 0.8rem',
                                                borderRadius: 6,
                                                border: 'none',
                                                background: 'var(--purple)',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t('synthesis.refine')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const iconBtn: React.CSSProperties = {
    padding: '0.3rem 0.4rem',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export default SynthesisPanel;
