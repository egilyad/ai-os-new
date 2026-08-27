import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { cacheService, kernel, providerTracker, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('AnalyticsPanel');
import type { ProviderMetrics, DecisionTrace, SystemState } from '../../types/metrics';
import { BarChart3, Activity, Globe, History, AlertTriangle, X } from 'lucide-react';
import { eventBus, EVENTS } from '../../kernel/instances';
import ModuleInfo from '../ModuleInfo';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { dismissBtn, errorBanner } from '../../styles/common';

import { ProvidersTab } from './ProvidersTab';
import { DecisionsTab } from './DecisionsTab';
import SummaryStatsGrid from './SummaryStatsGrid';
import ProviderHealthSection from './ProviderHealthSection';
import ChartsSection from './ChartsSection';

const AnalyticsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<Record<string, ProviderMetrics>>({});
    const [history, setHistory] = useState<DecisionTrace[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'decisions'>('overview');
    const [kernelState, setKernelState] = useState(kernel.getState());
    const [tokenHistory, setTokenHistory] = useState<number[]>([]);
    const [costHistory, setCostHistory] = useState<number[]>([]);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [error, setError] = useState<string | null>(null);
    const [cacheStats, setCacheStats] = useState(() => {
        try {
            return cacheService.getStats();
        } catch {
            return null;
        }
    });
    const [healthEvents, setHealthEvents] = useState<
        import('../../kernel/services/provider-tracker').HealthEvent[]
    >([]);

    const isMountedRef = useRef(true);
    const prevTokensRef = useRef(kernel.getState().totalTokens);
    const prevCostRef = useRef(kernel.getState().estimatedCost);
    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const update = (data: Record<string, unknown>) => {
            const state = data as unknown as SystemState;
            if (!isMountedRef.current) return;
            try {
                setMetrics({ ...state.providers });
                setHistory(state.decisions ? [...state.decisions] : []);
                setKernelState(state ? { ...state } : kernel.getState());
                setCacheStats(cacheService.getStats());
                setHealthEvents(providerTracker.getHealthEvents(undefined, 12));
                setCurrentTime(Date.now());
                setError(null);
                const deltaTokens = state.totalTokens - prevTokensRef.current;
                prevTokensRef.current = state.totalTokens;
                setTokenHistory((prev) => {
                    const next = deltaTokens > 0 ? [...prev, deltaTokens] : prev;
                    return next.length > 24 ? next.slice(-24) : next;
                });
                const deltaCost = state.estimatedCost - prevCostRef.current;
                prevCostRef.current = state.estimatedCost;
                setCostHistory((prev) => {
                    const next = deltaCost > 0 ? [...prev, deltaCost] : prev;
                    return next.length > 24 ? next.slice(-24) : next;
                });
            } catch (e) {
                LOGGER.warn('Failed to process telemetry update', String(e));
                if (isMountedRef.current) {
                    setError('Failed to process telemetry update');
                    clearError();
                }
            }
        };
        update(kernel.getState() as unknown as Record<string, unknown>);
        const unsub = eventBus.on(EVENTS.KERNEL_UPDATED, update);
        return () => unsub();
    }, [clearError]);

    const totalRequests = kernelState.totalRequests;
    const avgLatency =
        Object.values(metrics).length > 0
            ? Math.round(
                  Object.values(metrics).reduce((acc, m) => acc + m.avgTTFT, 0) /
                      Object.values(metrics).length,
              )
            : 0;
    const latencyHistory = kernelState.history?.slice(-24).map((h) => h.ttft) || [];
    const reliabilityHistory =
        kernelState.history?.slice(-24).map((h) => h.reliability * 100) || [];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
        },
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <BarChart3 size={28} color="#3b82f6" /> {t('analytics.title')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                        {t('analytics.subtitle')}
                    </p>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '0.3rem',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                    }}
                    role="tablist"
                    aria-label="Analytics views"
                >
                    {[
                        {
                            id: 'overview',
                            label: t('analytics.tab.overview'),
                            icon: <Activity size={14} />,
                        },
                        {
                            id: 'providers',
                            label: t('analytics.tab.providers'),
                            icon: <Globe size={14} />,
                        },
                        {
                            id: 'decisions',
                            label: t('analytics.tab.decisions'),
                            icon: <History size={14} />,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            style={{
                                padding: '0.6rem 1.25rem',
                                borderRadius: 10,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background:
                                    activeTab === tab.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                                color: activeTab === tab.id ? '#3b82f6' : 'var(--text-muted)',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div role="alert" aria-live="polite" style={errorBanner}>
                    <AlertTriangle size={14} /> {error}
                    <button onClick={() => setError(null)} style={dismissBtn}>
                        <X size={14} />
                    </button>
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                        >
                            <SummaryStatsGrid
                                totalRequests={totalRequests}
                                totalTokens={kernelState.totalTokens}
                                estimatedCost={kernelState.estimatedCost}
                                avgLatency={avgLatency}
                                itemVariants={itemVariants}
                                t={t}
                            />
                            <ChartsSection
                                metrics={metrics}
                                tokenHistory={tokenHistory}
                                costHistory={costHistory}
                                cacheStats={cacheStats}
                                itemVariants={itemVariants}
                                t={t}
                            />
                            <ProviderHealthSection
                                metrics={metrics}
                                latencyHistory={latencyHistory}
                                reliabilityHistory={reliabilityHistory}
                                healthEvents={healthEvents}
                                itemVariants={itemVariants}
                                t={t}
                            />
                        </motion.div>
                    )}
                    {activeTab === 'providers' && (
                        <ProvidersTab metrics={metrics} itemVariants={itemVariants} />
                    )}
                    {activeTab === 'decisions' && (
                        <DecisionsTab
                            history={history}
                            currentTime={currentTime}
                            itemVariants={itemVariants}
                        />
                    )}
                </AnimatePresence>
            </div>
            <ModuleInfo moduleKey="analytics" />
        </div>
    );
};

export default AnalyticsPanel;
