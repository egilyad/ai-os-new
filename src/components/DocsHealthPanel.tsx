import React, { useState, useRef, useCallback } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Shield,
    Search,
    Wrench,
    X,
    FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { consistencyChecker, consistencyHealingPipeline } from '../kernel/instances';
import type { ConsistencyReport, HealingPlan } from '../kernel/instances';
import { eventBus, EVENTS } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { useAutoClearError } from '../hooks/useAutoClearError';
import { errorContainer, dismissBtnRed } from '../styles/common';
import { Button } from './Common';
import { DOC_FILES } from './DocsHealthPanel/docs-health-constants';
import { HealthStatCard } from './DocsHealthPanel/HealthStatCard';
import { BrokenItemsSection } from './DocsHealthPanel/BrokenItemsSection';
import { HealingPlanSection } from './DocsHealthPanel/HealingPlanSection';
import { ByCategorySection } from './DocsHealthPanel/ByCategorySection';

const DocsHealthPanel: React.FC = () => {
    const [report, setReport] = useState<ConsistencyReport | null>(null);
    const [plan, setPlan] = useState<HealingPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [healing, setHealing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const isMountedRef = useRef(true);
    const abortRef = useRef<AbortController | null>(null);
    const clearError = useAutoClearError(setError);

    const loadLastReport = useCallback(() => {
        try {
            const last = consistencyChecker.getLastReport();
            if (last) setReport(last);
            const lastPlan = consistencyHealingPipeline.getPlan();
            if (lastPlan) setPlan(lastPlan);
        } catch {
            /* noop */
        }
    }, []);

    const handleCheck = async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setError(null);
        try {
            const docContents = await consistencyChecker.fetchDocs(DOC_FILES, controller.signal);
            if (Object.keys(docContents).length === 0) {
                setError(t('docs_health.error_fetch'));
                return;
            }
            const newReport = consistencyChecker.checkDocs(docContents);
            if (isMountedRef.current) {
                setReport(newReport);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: t('docs_health.check_done'),
                    type: 'success',
                });
            }
        } catch {
            if (isMountedRef.current) {
                setError(t('docs_health.error_check'));
                clearError();
            }
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    const handleAutoFix = async () => {
        if (!report) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setHealing(true);
        setError(null);
        try {
            const docContents = await consistencyChecker.fetchDocs(DOC_FILES, controller.signal);
            const newPlan = consistencyHealingPipeline.analyze(docContents);
            if (isMountedRef.current) {
                setPlan(newPlan);
                const executed = await consistencyHealingPipeline.executeAll();
                const succeeded = executed.filter((t) => t.status === 'completed').length;
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: t('docs_health.fix_done', { count: succeeded }),
                    type: 'success',
                });
            }
        } catch {
            if (isMountedRef.current) {
                setError(t('docs_health.error_fix'));
                clearError();
            }
        } finally {
            if (isMountedRef.current) setHealing(false);
        }
    };

    React.useEffect(() => {
        isMountedRef.current = true;
        loadLastReport();
        return () => {
            isMountedRef.current = false;
            abortRef.current?.abort();
        };
    }, [loadLastReport]);

    const brokenItems = report?.items.filter((i) => !i.found) ?? [];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1.5rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <FileText size={28} color="#22c55e" /> {t('docs_health.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('docs_health.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button
                        variant="primary"
                        onClick={handleCheck}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {loading ? <Loader2 size={16} /> : <Search size={16} />}
                        {loading ? t('docs_health.checking') : t('docs_health.run_check')}
                    </Button>
                    {brokenItems.length > 0 && (
                        <Button
                            variant="primary"
                            onClick={handleAutoFix}
                            disabled={healing}
                            style={{
                                background: 'var(--warning)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            {healing ? <Loader2 size={16} /> : <Wrench size={16} />}
                            {healing ? t('docs_health.fixing') : t('docs_health.auto_fix')}
                        </Button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorContainer}
                    >
                        <AlertTriangle size={18} /> {error}
                        <button onClick={() => setError(null)} style={dismissBtnRed}>
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!report ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                        fontStyle: 'italic',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: 16,
                    }}
                >
                    <Shield size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <div
                        style={{
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: 'var(--slate-400)',
                        }}
                    >
                        {t('docs_health.no_report')}
                    </div>
                    <div>{t('docs_health.no_report_desc')}</div>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '1rem',
                        }}
                    >
                        <HealthStatCard
                            label={t('docs_health.total')}
                            value={report.total}
                            color="#3b82f6"
                            icon={<FileText size={18} />}
                        />
                        <HealthStatCard
                            label={t('docs_health.passed')}
                            value={report.passed}
                            color="#10b981"
                            icon={<CheckCircle2 size={18} />}
                        />
                        <HealthStatCard
                            label={t('docs_health.failed')}
                            value={report.failed}
                            color="#ef4444"
                            icon={<XCircle size={18} />}
                        />
                        <HealthStatCard
                            label={t('docs_health.health')}
                            value={
                                report.total > 0
                                    ? `${Math.round((report.passed / report.total) * 100)}%`
                                    : '--'
                            }
                            color={
                                (report.total > 0 ? report.passed / report.total : 1) > 0.8
                                    ? '#10b981'
                                    : '#f59e0b'
                            }
                            icon={<Shield size={18} />}
                        />
                    </div>

                    <BrokenItemsSection items={report.items} />

                    {plan && <HealingPlanSection plan={plan} />}

                    <ByCategorySection report={report} />
                </>
            )}
        </div>
    );
};

export default DocsHealthPanel;
