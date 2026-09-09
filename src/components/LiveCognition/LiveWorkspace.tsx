import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Brain, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import AgentLiveBoard from '../DashboardPanel/AgentLiveBoard';
import IntelligenceGraph from '../DashboardPanel/IntelligenceGraph';
import { adminService, kernel, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('LiveWorkspace');
import { eventBus, EVENTS } from '../../kernel/instances';
import LiveStatCard from './LiveStatCard';
import EventLog from './EventLog';
import ControlActions from './ControlActions';

const LiveWorkspace: React.FC = () => {
    const { t } = useTranslation();
    const [health, setHealth] = useState(() => {
        try {
            return adminService.getSystemHealth();
        } catch {
            return null;
        }
    });
    const [logs, setLogs] = useState<Array<{ time: string; event: string; type: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearErrorAfterDelay = useCallback(() => {
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setError(null);
        }, 5000);
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const unsubHealth = eventBus.on(EVENTS.KERNEL_UPDATED, () => {
            if (!isMountedRef.current) return;
            try {
                setHealth(adminService.getSystemHealth());
                setError(null);
            } catch (e) {
                LOGGER.warn('Failed to update health', String(e));
                if (isMountedRef.current) {
                    setError('Failed to update system health');
                    clearErrorAfterDelay();
                }
            }
        });
        let unsubscribeAll: (() => void) | undefined;
        const eventHandler = ({ event, data }: { event: string; data: unknown }) => {
            if (!isMountedRef.current) return;
            try {
                setLogs((prev) =>
                    [
                        {
                            time: new Date().toLocaleTimeString(),
                            event: `${event}: ${((data as Record<string, unknown>)?.output as string)?.substring(0, 50) || ((data as Record<string, unknown>)?.message as string) || 'Activity detected'}`,
                            type: event.includes('error')
                                ? 'warning'
                                : event.includes('success')
                                  ? 'success'
                                  : 'info',
                        },
                        ...prev,
                    ].slice(0, 15),
                );
                setError(null);
            } catch (e) {
                LOGGER.warn('Failed to process event', String(e));
                if (isMountedRef.current) {
                    setError('Failed to process event');
                    clearErrorAfterDelay();
                }
            }
        };
        const maybeUnsubscribe = eventBus.subscribeAll(eventHandler);
        if (typeof maybeUnsubscribe === 'function') unsubscribeAll = maybeUnsubscribe;
        else
            LOGGER.warn(
                'LiveWorkspace',
                'eventBus.subscribeAll does not return an unsubscribe function',
            );
        const savedIntervalRef = intervalRef;
        const savedTimeoutRef = errorTimeoutRef;
        return () => {
            isMountedRef.current = false;
            unsubHealth();
            if (savedIntervalRef.current) clearInterval(savedIntervalRef.current);
            if (unsubscribeAll) unsubscribeAll();
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        };
    }, [clearErrorAfterDelay]);

    const avgLatency = useCallback(() => {
        try {
            const state = kernel.getState();
            const latencies = Object.values(state.providers || {})
                .map((p) => p.avgTTFT)
                .filter(Boolean);
            return latencies.length > 0
                ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
                : 0;
        } catch {
            return 0;
        }
    }, []);

    const stats = [
        {
            label: 'Throughput',
            value: health?.vitals?.throughput ?? 0,
            unit: 'req/min',
            color: 'var(--warning)',
        },
        {
            label: 'Collective Latency',
            value: avgLatency().toString(),
            unit: 'ms',
            color: 'var(--accent)',
        },
        {
            label: 'Total Requests',
            value: health?.vitals?.totalRequests ?? 0,
            unit: 'req',
            color: 'var(--success)',
        },
        {
            label: 'Total Tokens',
            value: ((health?.vitals?.totalTokens ?? 0) / 1000).toFixed(1),
            unit: 'k',
            color: '#a855f7',
        },
    ];

    const handleInitializeRequest = useCallback(() => {
        try {
            adminService.initializeRequest();
            setError(null);
        } catch {
            setError('Failed to initialize request');
            clearErrorAfterDelay();
        }
    }, [clearErrorAfterDelay]);
    const handleReloadRuntime = useCallback(() => {
        try {
            adminService.reloadRuntime();
            setError(null);
        } catch {
            setError('Failed to reload runtime');
            clearErrorAfterDelay();
        }
    }, [clearErrorAfterDelay]);
    const handleManualRoute = useCallback(() => {
        try {
            adminService.manualRoute();
            setError(null);
        } catch {
            setError('Failed to manual route');
            clearErrorAfterDelay();
        }
    }, [clearErrorAfterDelay]);
    const handleClearLogs = useCallback(() => {
        setLogs([]);
        setError(null);
    }, []);
    const handleCheckAllHealth = useCallback(() => {
        try {
            eventBus.emit(EVENTS.CHECK_ALL_HEALTH, undefined);
            setError(null);
        } catch {
            setError('Failed to check all health');
            clearErrorAfterDelay();
        }
    }, [clearErrorAfterDelay]);

    return (
        <div
            style={{
                height: '100%',
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                gap: '1.5rem',
                overflow: 'hidden',
            }}
        >
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 10,
                            color: '#fca5a5',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                        role="alert"
                        aria-live="polite"
                    >
                        <AlertTriangle size={14} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                cursor: 'pointer',
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: 'inherit',
                            }}
                            aria-label={t('common.aria.dismiss_error')}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {stats.map((stat) => (
                    <LiveStatCard key={stat.label} {...stat} />
                ))}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 450px',
                    gap: '1.5rem',
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        minHeight: 0,
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            padding: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <Network size={18} color="#3b82f6" aria-hidden="true" /> System
                                Architecture Pulse
                            </h3>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--success)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: 'var(--success)',
                                    }}
                                />
                                LIVE TOPOLOGY
                            </div>
                        </div>
                        <div style={{ height: 'calc(100% - 3rem)' }}>
                            <IntelligenceGraph />
                        </div>
                    </div>
                    <div
                        style={{
                            height: '320px',
                            padding: '1.5rem',
                            overflowY: 'auto',
                            borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <Brain size={18} color="#a855f7" aria-hidden="true" /> Distributed
                                Agent Radar
                            </h3>
                        </div>
                        <AgentLiveBoard />
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        minHeight: 0,
                    }}
                >
                    <EventLog logs={logs} />
                    <ControlActions
                        onInitializeRequest={handleInitializeRequest}
                        onReloadRuntime={handleReloadRuntime}
                        onManualRoute={handleManualRoute}
                        onClearLogs={handleClearLogs}
                        onCheckAllHealth={handleCheckAllHealth}
                    />
                </div>
            </div>
        </div>
    );
};

export default LiveWorkspace;
