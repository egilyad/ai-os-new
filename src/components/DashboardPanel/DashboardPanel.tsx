import React, { useEffect, useMemo, useState, useRef } from 'react';
import { usePolling } from '../Common/usePolling';
import { AlertTriangle, X } from 'lucide-react';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('DashboardPanel');
import { kernel } from '../../kernel/instances';
import { settingsService } from '../../kernel/instances';
import { cognitiveService, debateEngine } from '../../kernel/instances';
import { budgetService } from '../../kernel/instances';
import { routerService } from '../../kernel/instances';
import { monitoringService } from '../../kernel/instances';
import { agentService } from '../../kernel/instances/services-core';
import { useKeyStore } from '../../stores/useKeyStore';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import type { SystemState } from '../../types/metrics';
import type { CognitiveTrace } from '../../types/domain';
import type { RouterDecision } from '../../kernel/instances';
import { summarizeEvent } from './DashboardComponents';
import SystemHealthPanel from './SystemHealthPanel';
import { ProviderPressureMap } from './ProviderPressureMap';
import { InferenceMeshSection } from './InferenceMeshSection';
import DashboardHeader from './DashboardHeader';
import GetStartedPanel from './GetStartedPanel';
import QuickActionBar from './QuickActionBar';
import CriticalAlertBanner from './CriticalAlertBanner';
import StatsGrid from './StatsGrid';
import RoutingActivitySection from './RoutingActivitySection';
import LiveTerminalSection, { type RecentEvent } from './LiveTerminalSection';
import { dismissBtn, errorBanner } from '../../styles/common';

interface DashboardPanelProps {
    onNavigate: (page: string) => void;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ onNavigate }) => {
    const rawKeys = useKeyStore((s) => s.keys);
    const checkAllHealth = useKeyStore((s) => s.checkAllHealth);
    const keys = useMemo(() => rawKeys ?? [], [rawKeys]);
    const eventIdCounter = useRef(0);
    const [systemState, setSystemState] = useState<SystemState>(() => kernel.getState());
    const [events, setEvents] = useState<RecentEvent[]>([]);
    const [traces, setTraces] = useState(() => {
        try {
            return cognitiveService.getTraces() ?? [];
        } catch {
            return [];
        }
    });
    const safeTraces = useMemo(() => traces ?? [], [traces]);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [error, setError] = useState<string | null>(null);
    const [routerDecisions, setRouterDecisions] = useState<RouterDecision[]>(() => {
        try {
            const result = routerService?.getDecisionHistory?.(10);
            return Array.isArray(result) ? result : [];
        } catch {
            return [] as RouterDecision[];
        }
    });
    const [healthIndicators, setHealthIndicators] = useState(() => {
        try {
            return monitoringService?.getSystemHealthIndicators?.();
        } catch {
            return null;
        }
    });
    const settings = (() => {
        try {
            return settingsService.getSettings();
        } catch {
            return {
                theme: 'dark' as const,
                language: 'en',
                notifications: true,
                autoSave: true,
                fontSize: 14,
                codeTheme: 'dark',
                enableVault: false,
                vaultTimeout: 5,
                model: 'auto',
                temperature: 0.7,
                maxTokens: 2048,
                presencePenalty: 0,
                frequencyPenalty: 0,
            };
        }
    })();
    const fallbackEnabled = 'fallbackEnabled' in settings ? settings.fallbackEnabled : true;
    const { t } = useTranslation();

    const isMountedRef = useRef(true);

    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    usePolling(() => {
        if (!isMountedRef.current) return;
        setCurrentTime(Date.now());
        try {
            const result = routerService?.getDecisionHistory?.();
            if (Array.isArray(result) && result.length > 0) {
                setRouterDecisions(result.slice(0, 60));
            }
        } catch {
            /* not critical */
        }
    }, 10000);

    useEffect(() => {
        const unsubscribeKernel = eventBus.on(EVENTS.KERNEL_UPDATED, (state) => {
            if (!isMountedRef.current) return;
            try {
                setSystemState(state as unknown as SystemState);
                setError(null);
            } catch (e) {
                LOGGER.warn('DashboardPanel', 'Failed to update system state', { error: e });
                if (isMountedRef.current) {
                    setError('Failed to update system state');
                    clearError();
                }
            }
        });
        // SI-41: Immediately re-read state after subscribing to catch updates
        // between useState initializer and useEffect subscription
        try {
            setSystemState({ ...kernel.getState() });
        } catch {
            /* kernel may not be ready */
        }

        const unsubscribeTraces = eventBus.onSafe<CognitiveTrace[]>(
            EVENTS.COGNITIVE_TRACE_UPDATED,
            (newTraces) => {
                if (!isMountedRef.current) return;
                try {
                    setTraces([...newTraces]);
                    setError(null);
                } catch (e) {
                    LOGGER.warn('DashboardPanel', 'Failed to update traces', { error: e });
                    if (isMountedRef.current) {
                        setError('Failed to update traces');
                        clearError();
                    }
                }
            },
        );

        const unsubscribeHealth = eventBus.on(EVENTS.SYSTEM_HEALTH_CHANGED, () => {
            if (!isMountedRef.current) return;
            try {
                setHealthIndicators(monitoringService?.getSystemHealthIndicators?.());
            } catch {
                LOGGER.warn('DashboardPanel', 'Health indicator refresh failed');
            }
        });

        // Надёжная подписка на все события
        let unsubscribeAll: (() => void) | undefined;
        const handler = ({ event, data }: { event: string; data: unknown }) => {
            if (!isMountedRef.current) return;
            try {
                const eventDataType =
                    typeof data === 'object' && data
                        ? (data as Record<string, unknown>).type
                        : undefined;
                const severity: RecentEvent['severity'] =
                    event.includes('error') || eventDataType === 'error'
                        ? 'error'
                        : event.includes('violation') || eventDataType === 'warning'
                          ? 'warning'
                          : event.includes('end') || eventDataType === 'success'
                            ? 'success'
                            : 'info';

                eventIdCounter.current += 1;
                const id = Date.now() * 1000 + (eventIdCounter.current % 1000);
                setEvents((prev) =>
                    [
                        {
                            id,
                            time: new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            }),
                            event,
                            summary: summarizeEvent(
                                data as Record<string, unknown> | string | null | undefined,
                                t,
                            ),
                            severity,
                        },
                        ...prev,
                    ].slice(0, 10),
                );
            } catch (e) {
                LOGGER.warn('DashboardPanel', 'Failed to process event', { error: e });
                if (isMountedRef.current) {
                    setError('Failed to process event');
                    clearError();
                }
            }
        };

        const maybeUnsubscribe = eventBus.subscribeAll(handler);
        if (typeof maybeUnsubscribe === 'function') {
            unsubscribeAll = maybeUnsubscribe;
        } else {
            LOGGER.warn(
                'DashboardPanel',
                'eventBus.subscribeAll does not return an unsubscribe function; event bus may leak',
            );
        }

        return () => {
            unsubscribeKernel();
            unsubscribeTraces();
            if (unsubscribeHealth) unsubscribeHealth();
            if (unsubscribeAll) unsubscribeAll();
        };
    }, [clearError, t]);

    const providerCounts = useMemo(
        () => ({
            active: (keys ?? []).filter((k) => k.status === 'active').length,
            checking: (keys ?? []).filter((k) => k.status === 'checking').length,
            error: (keys ?? []).filter((k) => k.status === 'error').length,
            inactive: (keys ?? []).filter((k) => k.status === 'inactive').length,
        }),
        [keys],
    );

    const todayRequests = useMemo(
        () => (traces ?? []).filter((t) => t.startTime > currentTime - 24 * 60 * 60 * 1000).length,
        [traces, currentTime],
    );

    const totalTokens = useMemo(
        () => safeTraces.reduce((sum, t) => sum + (t.totalTokens || 0), 0),
        [safeTraces],
    );

    const estimatedCost = useMemo(
        () => budgetService.getBudgetInfo()?.spentThisMonth ?? (totalTokens / 1000) * 0.01,
        [totalTokens],
    );

    const activeDebates = useMemo(() => {
        try {
            return debateEngine?.getAllSessions?.()?.length ?? 0;
        } catch {
            return 0;
        }
    }, []);

    const tokenSparkData = useMemo(() => {
        const now = Date.now();
        const buckets: number[] = [];
        for (let i = 5; i >= 0; i--) {
            const start = now - (i + 1) * 60000;
            const end = now - i * 60000;
            buckets.push(
                safeTraces
                    .filter((t) => t.startTime >= start && t.startTime < end)
                    .reduce((s, t) => s + (t.totalTokens || 0), 0),
            );
        }
        return buckets;
    }, [safeTraces]);

    const rps = useMemo(() => {
        const recentTraces = safeTraces.filter((t) => t.startTime > currentTime - 60000);
        return recentTraces.length;
    }, [safeTraces, currentTime]);

    const errorRateTrend = useMemo(() => {
        const recent = safeTraces.filter((t) => t.startTime > currentTime - 300000);
        const older = safeTraces.filter(
            (t) => t.startTime > currentTime - 600000 && t.startTime <= currentTime - 300000,
        );
        const recentErrors = recent.filter((t) => t.status === 'failed').length;
        const olderErrors = older.filter((t) => t.status === 'failed').length;
        const recentPct = recent.length > 0 ? recentErrors / recent.length : 0;
        const olderPct = older.length > 0 ? olderErrors / older.length : 0;
        if (olderPct === 0 && recentPct === 0) return 'stable';
        if (recentPct <= olderPct * 0.8) return 'improving';
        if (recentPct >= olderPct * 1.2) return 'worsening';
        return 'stable';
    }, [safeTraces, currentTime]);

    const hasProviderErrors =
        providerCounts.error > 0 || (systemState?.violations?.length ?? 0) > 0;

    return (
        <div
            style={{
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                height: '100%',
                overflowY: 'auto',
                paddingRight: '0.5rem',
            }}
        >
            <DashboardHeader checkAllHealth={checkAllHealth} onNavigate={onNavigate} />

            <GetStartedPanel
                show={providerCounts.active === 0 && keys.length === 0}
                onNavigate={onNavigate}
            />

            {(() => {
                try {
                    const agents = agentService.getAgents?.() ?? [];
                    if (agents.length === 0) {
                        return (
                            <div style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: 14, border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))', alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🤖</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--slate-50)', fontSize: '0.95rem' }}>{(t as any)('onboarding.agents_get_started_title') ?? 'Create your first agent'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: 2 }}>{(t as any)('onboarding.agents_get_started_body') ?? 'Agents are your AI workforce. Create one to start debates, chats, and tasks.'}</div>
                                </div>
                                <button onClick={() => onNavigate('agents')} style={{ padding: '0.55rem 1.1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>{(t as any)('onboarding.create_agent') ?? 'Create Agent'}</button>
                            </div>
                        );
                    }
                } catch {}
                return null;
            })()}

            <QuickActionBar onNavigate={onNavigate} />

            <CriticalAlertBanner
                show={hasProviderErrors}
                providerErrors={providerCounts.error}
                violations={systemState.violations?.length ?? 0}
                fallbackEnabled={fallbackEnabled}
                onNavigate={onNavigate}
            />

            {error && (
                <div style={errorBanner} role="alert">
                    <AlertTriangle size={14} aria-hidden="true" /> {error}
                    <button
                        onClick={() => setError(null)}
                        style={dismissBtn}
                        aria-label={t('common.dismiss_error')}
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </div>
            )}

            <StatsGrid
                providerCounts={providerCounts}
                keysLength={keys.length}
                todayRequests={todayRequests}
                tracesCount={safeTraces.length}
                rps={rps}
                activeDebates={activeDebates}
                totalTokens={totalTokens}
                estimatedCost={estimatedCost}
            />

            <SystemHealthPanel
                providerCounts={providerCounts}
                keys={keys}
                errorRateTrend={errorRateTrend}
                healthIndicators={healthIndicators}
                tokenSparkData={tokenSparkData}
                rps={rps}
                todayRequests={todayRequests}
                estimatedCost={estimatedCost}
                onNavigate={onNavigate}
            />

            <ProviderPressureMap keys={keys} onNavigate={onNavigate} />

            <RoutingActivitySection decisions={routerDecisions} onNavigate={onNavigate} />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1.3fr 0.7fr',
                    gap: '1.25rem',
                    alignItems: 'start',
                }}
            >
                <InferenceMeshSection keys={keys} onNavigate={onNavigate} />

                <LiveTerminalSection events={events} onNavigate={onNavigate} />
            </div>
            <ModuleInfo moduleKey="dashboard" />
        </div>
    );
};

export default DashboardPanel;
