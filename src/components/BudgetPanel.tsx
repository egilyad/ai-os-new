import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePolling } from './Common/usePolling';
import { DollarSign, AlertTriangle, X, BarChart3 } from 'lucide-react';
import { PanelSkeleton } from './Common/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { budgetService } from '../kernel/instances';
import type { SpendSummary, BudgetAlert } from '../kernel/contracts/budget';
import { useTranslation } from '../i18n/useTranslation';
import { useAutoClearError } from '../hooks/useAutoClearError';
import { errorContainer, dismissBtnRed } from '../styles/common';
import { Button } from './Common';
import { GlobalBudgetSection } from './BudgetPanel/GlobalBudgetSection';
import { ProviderBudgetSection } from './BudgetPanel/ProviderBudgetSection';
import { AgentBudgetSection } from './BudgetPanel/AgentBudgetSection';
import { AlertsSection } from './BudgetPanel/AlertsSection';

const BudgetPanel: React.FC = () => {
    const { t, lang } = useTranslation();
    const [summary, setSummary] = useState<SpendSummary | null>(null);
    const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const clearError = useAutoClearError(setError);

    const load = useCallback(() => {
        try {
            const s = budgetService.getSpendSummary();
            const a = budgetService.getAlerts();
            if (isMountedRef.current) {
                setSummary(s);
                setAlerts(a);
                setError(null);
            }
        } catch {
            if (isMountedRef.current) setError(t('budget.error_load'));
        }
        if (isMountedRef.current) setLoading(false);
    }, [t]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    usePolling(load, 30000);

    const handleClearAlerts = () => {
        if (!window.confirm(t('budget.confirm_clear_alerts'))) return;
        try {
            budgetService.clearAlerts();
            setAlerts([]);
        } catch {
            setError(t('budget.error_clear'));
            clearError();
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}
            >
                <PanelSkeleton />
            </div>
        );
    }

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
                        <DollarSign size={28} color="#10b981" /> {t('budget.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('budget.subtitle')}
                    </p>
                </div>
                {alerts.length > 0 && (
                    <Button variant="neutral" size="sm" onClick={handleClearAlerts}>
                        <X size={14} /> {t('budget.clear_alerts')}
                    </Button>
                )}
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

            {!summary ? (
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
                    <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--slate-400)' }}>
                        {t('budget.empty')}
                    </div>
                    <div>{t('budget.empty_desc')}</div>
                </div>
            ) : (
                <>
                    <GlobalBudgetSection
                        budget={summary.global.budget}
                        spent={summary.global.spent}
                        remaining={summary.global.remaining}
                        pct={summary.global.pct}
                        lang={lang}
                    />
                    <ProviderBudgetSection providers={summary.providers} lang={lang} />
                    <AgentBudgetSection agents={summary.agents} lang={lang} />
                    <AlertsSection alerts={alerts} />
                </>
            )}

            <div
                style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    padding: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {t('budget.footer', { alerts: alerts.length })}
            </div>
        </div>
    );
};

export default BudgetPanel;
