import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bot, TrendingUp, Shield } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { usePolling } from '../Common/usePolling';
import { useTranslation } from '../../i18n/useTranslation';
import { emptyStateCenter, emptyStateTitle } from '../../styles/common';
import { advisorService } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import ModuleInfo from '../ModuleInfo';
import type { OptimizationSuggestion } from '../../kernel/instances';
import type { SREAlert } from './sre-constants';
import SREHeader from './SREHeader';
import MetricCards from './MetricCards';
import SRETabBar from './SRETabBar';
import SuggestionCard from './SuggestionCard';
import WhatIfCard from './WhatIfCard';
import CachingAdvice from './CachingAdvice';
import AlertItem from './AlertItem';

const SREAgentPanel: React.FC = () => {
    const { t } = useTranslation();
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
    const [alerts, setAlerts] = useState<SREAlert[]>([]);
    const [metrics, setMetrics] = useState<{
        avgLatency?: number;
        errorRate?: number;
        costPerRequest?: number;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'suggestions' | 'alerts' | 'whatif'>('suggestions');
    const [whatIfResults, setWhatIfResults] = useState<Array<{
        scenario: string;
        improvement: string;
        details: string;
        impact: string;
    }> | null>(null);
    const [cachingAdvice, setCachingAdvice] = useState<{
        cacheable?: boolean;
        reuseCount?: number;
        estimatedSavings?: string;
        details?: string;
    } | null>(null);
    const [autoFixEnabled, setAutoFixEnabled] = useState(false);
    const [executingId, setExecutingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const execTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (execTimeoutRef.current) clearTimeout(execTimeoutRef.current);
        };
    }, []);

    const refreshData = useCallback(() => {
        try {
            const sug = advisorService.getSuggestions();
            const al = advisorService.getSREAlerts();
            const whatIf = advisorService.getWhatIfAnalysis();
            setSuggestions(Array.isArray(sug) ? sug : []);
            setAlerts(Array.isArray(al) ? al : []);
            setMetrics(advisorService.getMetrics());
            setWhatIfResults(Array.isArray(whatIf) ? whatIf : null);
            setCachingAdvice(advisorService.getPromptCachingAdvice());
            setAutoFixEnabled(
                (advisorService.getConfig?.() ?? { enableAutoFix: false }).enableAutoFix ?? false,
            );
        } catch (e) {
            console.error('[SREAgentPanel] refresh failed', e);
            setError(t('sre.error.refresh'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let retryCount = 0;
        const MAX_RETRIES = 20;
        const tryRefresh = () => {
            try {
                refreshData();
            } catch (e) {
                retryCount++;
                if (retryCount > MAX_RETRIES) {
                    console.warn('[SREAgentPanel] Max retries', e);
                    return;
                }
                if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = setTimeout(tryRefresh, Math.min(500 * retryCount, 5000));
            }
        };

        const unsub1 = eventBus.on(EVENTS.ADVISOR_SUGGESTION, refreshData);
        const unsub2 = eventBus.on(EVENTS.ADVISOR_SUGGESTION_EXECUTED, refreshData);
        const unsub3 = eventBus.on(EVENTS.ADVISOR_SUGGESTION_DISMISSED, refreshData);
        tryRefresh();

        return () => {
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            unsub1();
            unsub2();
            unsub3();
        };
    }, [refreshData]);
    // C-95: usePolling gates on document.hidden
    usePolling(refreshData, 5000);

    const handleExecute = useCallback((id: string) => {
        setError(null);
        setExecutingId(id);
        if (execTimeoutRef.current) clearTimeout(execTimeoutRef.current);
        execTimeoutRef.current = setTimeout(() => {
            execTimeoutRef.current = undefined;
            try {
                advisorService.executeFix(id);
            } catch (e) {
                console.error('[SREAgentPanel] execute failed', e);
                setError(t('sre.error.execute'));
            }
            setExecutingId(null);
        }, 500);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDismiss = useCallback((id: string) => {
        setError(null);
        try {
            advisorService.dismissSuggestion(id);
        } catch (e) {
            console.error('[SREAgentPanel] dismiss failed', e);
            setError(t('sre.error.dismiss'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAutoFixToggle = useCallback(() => {
        setError(null);
        try {
            const cfg = advisorService.getConfig?.() ?? { enableAutoFix: false };
            advisorService.updateConfig({ enableAutoFix: !cfg.enableAutoFix });
            setAutoFixEnabled(!cfg.enableAutoFix);
        } catch (e) {
            console.error('[SREAgentPanel] autofix toggle failed', e);
            setError(t('sre.error.config'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
    const warningCount = alerts.filter((a) => a.severity === 'warning').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {error && (
                <div
                    role="alert"
                    style={{
                        padding: '0.6rem 0.9rem',
                        borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                        fontSize: '0.82rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            flexShrink: 0,
                        }}
                        aria-label={t('common.dismiss_error')}
                    >
                        ✕
                    </button>
                </div>
            )}
            <SREHeader
                criticalCount={criticalCount}
                warningCount={warningCount}
                autoFixEnabled={autoFixEnabled}
                onAutoFixToggle={handleAutoFixToggle}
            />
            <MetricCards
                avgLatency={metrics?.avgLatency}
                errorRate={metrics?.errorRate}
                costPerRequest={metrics?.costPerRequest}
                suggestions={suggestions.length}
            />
            <SRETabBar
                activeTab={activeTab}
                alertCount={alerts.length}
                onTabChange={setActiveTab}
            />

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
            >
                {activeTab === 'suggestions' ? (
                    suggestions.length > 0 ? (
                        <AnimatePresence>
                            {suggestions.map((s) => (
                                <SuggestionCard
                                    key={s.id}
                                    suggestion={s}
                                    executingId={executingId}
                                    onExecute={handleExecute}
                                    onDismiss={handleDismiss}
                                />
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div style={emptyStateCenter}>
                            <Bot size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <div style={emptyStateTitle}>{t('sre.suggestions.empty')}</div>
                            <div style={{ fontSize: '0.85rem' }}>
                                {t('sre.suggestions.empty_desc')}
                            </div>
                        </div>
                    )
                ) : activeTab === 'whatif' ? (
                    <>
                        {whatIfResults && whatIfResults.length > 0 ? (
                            whatIfResults.map((w) => <WhatIfCard key={w.scenario} {...w} />)
                        ) : (
                            <div style={emptyStateCenter}>
                                <TrendingUp
                                    size={48}
                                    style={{ opacity: 0.3, marginBottom: '1rem' }}
                                />
                                <div style={emptyStateTitle}>{t('sre.what_if.empty')}</div>
                                <div style={{ fontSize: '0.85rem' }}>
                                    {t('sre.what_if.empty_desc')}
                                </div>
                            </div>
                        )}
                        <CachingAdvice
                            estimatedSavings={cachingAdvice?.estimatedSavings}
                            details={cachingAdvice?.details}
                        />
                    </>
                ) : alerts.length > 0 ? (
                    alerts.slice(0, 50).map((a) => <AlertItem key={a.id} alert={a} />)
                ) : (
                    <div style={emptyStateCenter}>
                        <Shield size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {t('sre.alerts.empty')}
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>{t('sre.alerts.empty_desc')}</div>
                    </div>
                )}
            </div>
            <ModuleInfo moduleKey="sre" />
        </div>
    );
};

export default SREAgentPanel;
