import React, { useCallback, useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { knowledgeGenerator, eventBus } from '../../kernel/instances';
import { EVENTS } from '../../kernel/events/event-registry';
import { seedGeneratorDemo } from '../../kernel/services/knowledge-generator/generator-demo-seed';
import type { GenerationJob, GenerationTrigger } from '../../kernel/types/generator-types';
import TriggerConfig from './TriggerConfig';
import GeneratorDashboard from './GeneratorDashboard';

/**
 * KnowledgeGenPanel — autonomous research cycle UI.
 * Configure a trigger, start a generation job, watch the pipeline
 * (hypothesis → evidence → review → crystallization) and cancel it.
 */
const KnowledgeGenPanel: React.FC = () => {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<GenerationJob[]>([]);
    const [running, setRunning] = useState(false);
    const [seedingDemo, setSeedingDemo] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fail = (e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
    };

    const refresh = useCallback(async () => {
        try {
            const active = await knowledgeGenerator.listActiveJobs();
            setJobs((prev) => mergeJobs(active, prev));
        } catch (e) {
            fail(e);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const unsubStart = eventBus.on(EVENTS.GENERATOR_STARTED, () => {
            void refresh();
        });
        const unsubStage = eventBus.on(EVENTS.GENERATOR_STAGE, () => {
            void refresh();
        });
        const unsubDone = eventBus.on(EVENTS.GENERATOR_COMPLETED, () => {
            void refresh();
        });
        return () => {
            unsubStart();
            unsubStage();
            unsubDone();
        };
    }, [refresh]);

    const handleTrigger = async (trigger: GenerationTrigger): Promise<void> => {
        setRunning(true);
        setMessage(null);
        setError(null);
        try {
            const id = await knowledgeGenerator.generateFromTrigger(trigger);
            const job = await knowledgeGenerator.getStatus(id);
            if (job) setJobs((prev) => mergeJobs([job], prev));
        } catch (e) {
            fail(e);
        } finally {
            setRunning(false);
        }
    };

    const handleCancel = async (id: string): Promise<void> => {
        try {
            await knowledgeGenerator.cancel(id);
            setMessage(t('generator.cancelled_msg'));
            await refresh();
        } catch (e) {
            fail(e);
        }
    };

    const handleSeedDemo = async (): Promise<void> => {
        if (seedingDemo) return;
        setSeedingDemo(true);
        setError(null);
        try {
            const job = await seedGeneratorDemo(knowledgeGenerator);
            setJobs((prev) => mergeJobs([job], prev));
        } catch (e) {
            fail(e);
        } finally {
            setSeedingDemo(false);
        }
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
                    <Lightbulb size={18} color="#22c55e" />
                    <span
                        style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}
                    >
                        {t('generator.title')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {jobs.length} {t('generator.jobs_active')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => void handleSeedDemo()}
                        disabled={seedingDemo}
                        title={t('generator.seed_demo')}
                        aria-label={t('generator.seed_demo')}
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
                        ☕
                    </button>
                    <button
                        onClick={() => void refresh()}
                        title={t('generator.refresh')}
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
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                d="M21 12a9 9 0 1 1-3-6.7"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M21 3v5h-5"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 1rem' }}>
                <TriggerConfig onTrigger={(tg) => void handleTrigger(tg)} running={running} />

                {message && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginBottom: 8 }}>
                        {message}
                    </div>
                )}
                {error && (
                    <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginBottom: 8 }}>
                        {error.slice(0, 200)}
                    </div>
                )}

                <GeneratorDashboard
                    jobs={jobs}
                    onRefresh={() => void refresh()}
                    onCancel={(id) => void handleCancel(id)}
                />
            </div>
        </div>
    );
};

function mergeJobs(active: GenerationJob[], prev: GenerationJob[]): GenerationJob[] {
    const byId = new Map<string, GenerationJob>();
    for (const j of prev) byId.set(j.id, j);
    for (const j of active) byId.set(j.id, j);
    return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export default KnowledgeGenPanel;
