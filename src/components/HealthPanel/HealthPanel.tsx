import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    HeartPulse,
    ShieldCheck,
    Activity,
    Cpu,
    Clock,
    MemoryStick,
    RefreshCw,
    Loader2,
    AlertTriangle,
    X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useKeyStore } from '../../stores/useKeyStore';
import { adminService, probeService, keyStateStore, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('HealthPanel');
import { eventBus, EVENTS } from '../../kernel/instances';
import { keyService, kernel } from '../../kernel/instances';
import type { HealthEvent } from '../../kernel/instances';
import type { ProbeResult } from '../../kernel/contracts/probe';
import type { AlertEntry } from '../../kernel/types/interfaces';
import { APP_VERSION } from '../../utils/version';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { dismissBtn, statusDot } from '../../styles/common';
import { generateId, type Bee } from './health-panel-utils';
import { VitalCard } from './VitalCard';
import { KernelServicesSection } from './KernelServicesSection';
import { DistributedNodesSection } from './DistributedNodesSection';
import { ProbeResultsSection } from './ProbeResultsSection';
import { RateLimitIntrospection } from './RateLimitIntrospection';
import { HealthScoreSection } from './HealthScoreSection';
import { HealthTimelineSection } from './HealthTimelineSection';

const HealthPanel: React.FC = () => {
    const { t } = useTranslation();
    const keys = useKeyStore((s) => s.keys);
    const [health, setHealth] = useState(() => {
        try {
            return adminService.getSystemHealth();
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(!health);
    const safeHealth = health ?? {
        vitals: { cpu: 0, memory: 0, throughput: 0, totalRequests: 0, totalTokens: 0 },
        uptime: 0,
        services: [],
    };
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kernelId] = useState(generateId().slice(0, 8));
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    const clearError = useAutoClearError(setError);
    const totalActive =
        (health as { runtime?: { totalActive?: number } })?.runtime?.totalActive ?? 0;

    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(
        () => () => {
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        },
        [],
    );

    const handleRefresh = useCallback(() => {
        setIsLoading(true);
        setIsRefreshing(true);
        try {
            const result = adminService.getSystemHealth();
            if (result instanceof Promise) {
                result.catch(() => {
                    setError(t('health.error_refresh'));
                    clearError();
                });
            }
            setHealth(result);
        } catch {
            setError(t('health.error_refresh'));
            clearError();
        }
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
            setIsRefreshing(false);
            setIsLoading(false);
        }, 500);
    }, [clearError, t]);

    const [probeResults, setProbeResults] = useState<Map<string, ProbeResult> | null>(null);
    const [probeLoading, setProbeLoading] = useState(false);
    const [expandedProbe, setExpandedProbe] = useState<string | null>(null);
    const [introspectionResults, setIntrospectionResults] = useState<
        Record<string, Record<string, unknown>>
    >({});
    const [introspectingKeys, setIntrospectingKeys] = useState(false);
    const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
    const [healthEventFilter, setHealthEventFilter] = useState<string>('all');

    const [bees, setBees] = useState<Bee[]>([]);

    const isMountedRef = useRef(true);
    const allAlerts = useMemo(() => keyService.getAlerts(), []);

    useEffect(() => {
        const currentRefreshTimeout = refreshTimeoutRef.current;
        let styleEl: HTMLStyleElement | null = null;
        const existing = document.getElementById('health-panel-keyframes');
        if (!existing) {
            styleEl = document.createElement('style');
            styleEl.id = 'health-panel-keyframes';
            styleEl.textContent = `
        @keyframes beeFloat {
          0% { transform: translate(-50%, -50%) translateY(0px) translateX(0px); }
          25% { transform: translate(-50%, -50%) translateY(-6px) translateX(3px); }
          50% { transform: translate(-50%, -50%) translateY(2px) translateX(-3px); }
          75% { transform: translate(-50%, -50%) translateY(-4px) translateX(2px); }
          100% { transform: translate(-50%, -50%) translateY(0px) translateX(0px); }
        }
        @keyframes beeWobble {
          0%, 100% { rotate: 0deg; }
          25% { rotate: 10deg; }
          75% { rotate: -10deg; }
        }
      `;
            document.head.appendChild(styleEl);
        }

        isMountedRef.current = true;
        const unsub = eventBus.on(EVENTS.KERNEL_UPDATED, () => {
            if (!isMountedRef.current) return;
            try {
                setHealth(adminService.getSystemHealth());
                setHealthEvents(kernel.getHealthEvents());
                setError(null);
            } catch (e) {
                LOGGER.warn('Failed to refresh system health', String(e));
                if (isMountedRef.current) {
                    setError(t('health.error_refresh'));
                    clearError();
                }
            }
        });

        return () => {
            isMountedRef.current = false;
            unsub();
            if (currentRefreshTimeout) clearTimeout(currentRefreshTimeout);
            if (styleEl) styleEl.remove();
        };
    }, [clearError, t]);

    useEffect(() => {
        const activeKeys = keys.filter((k) => k.status === 'active');
        /* eslint-disable react-hooks/set-state-in-effect */
        const newBees: Bee[] = activeKeys.map((key, i) => ({
            id: generateId(),
            providerId: key.id,
            x: 10 + ((i * 30) % 80),
            y: 10 + Math.random() * 80,
            delay: Math.random() * 3,
        }));
        setBees(newBees);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [keys]);

    useEffect(() => {
        const activeKeys = keys.filter((k) => k.status === 'active');
        if (activeKeys.length === 0) return;
        const ac = new AbortController();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIntrospectingKeys(true);
        (async () => {
            const results: Record<string, Record<string, unknown>> = {};
            for (const key of activeKeys) {
                if (ac.signal.aborted) break;
                try {
                    results[key.id] = await keyService.getProviderIntrospection(
                        key.provider,
                        key.key,
                    );
                } catch {
                    if (!ac.signal.aborted) results[key.id] = { error: 'Introspection failed' };
                }
            }
            if (!ac.signal.aborted) {
                setIntrospectionResults(results);
                setIntrospectingKeys(false);
            }
        })();
        return () => {
            ac.abort();
        };
    }, [keys]);

    useEffect(() => {
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHealthEvents(kernel.getHealthEvents());
        } catch {
            /* kernel may not be ready */
        }
    }, []);

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                height: '100%',
                overflowY: 'auto',
                paddingRight: '0.5rem',
                background: 'radial-gradient(circle at 20% 30%, #0a0f1e, #03060c)',
            }}
        >
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: 0.1,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 15 L60 45 L30 60 L0 45 L0 15 Z' fill='none' stroke='%23f59e0b' stroke-width='1' /%3E%3C/svg%3E")`,
                    backgroundSize: '60px 60px',
                }}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
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
                        }}
                    >
                        <HeartPulse size={28} color="#10b981" aria-hidden="true" />{' '}
                        {t('health.system_health_matrix')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                        {t('health.subtitle')}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0.5rem 1rem',
                            background: 'var(--success-tint)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: 12,
                        }}
                    >
                        <div style={statusDot} aria-hidden="true" />
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--success)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {t('health.all_systems_operational')}
                        </span>
                    </div>
                    <button
                        onClick={async () => {
                            setProbeLoading(true);
                            setProbeResults(null);
                            try {
                                const results = await probeService.probeAll();
                                const map = new Map<string, ProbeResult>();
                                for (const r of results) map.set(r.keyId, r);
                                setProbeResults(map);
                            } finally {
                                setProbeLoading(false);
                            }
                        }}
                        style={{
                            padding: '0.5rem 0.8rem',
                            borderRadius: 8,
                            background: 'var(--accent-tint)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                        }}
                        disabled={probeLoading}
                        aria-label={t('health.quick_test_aria') ?? 'Quick Test All'}
                    >
                        {probeLoading ? (
                            <Loader2 size={14} className="spinning" />
                        ) : (
                            <Activity size={14} />
                        )}
                        {t('health.quick_test_all') ?? 'Quick Test All'}
                    </button>
                    <button
                        onClick={handleRefresh}
                        style={{
                            padding: '0.6rem',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label={t('health.refresh_aria')}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <RefreshCw size={16} aria-hidden="true" />
                            </motion.div>
                        ) : (
                            <RefreshCw size={16} aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        padding: '0.5rem 1rem',
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
                >
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

            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1.25rem',
                }}
            >
                <VitalCard
                    icon={<Cpu size={24} />}
                    title={t('health.cpu_load')}
                    value={`${safeHealth.vitals.cpu.toFixed(1)}%`}
                    subtitle="Global Threads"
                    fill={safeHealth.vitals.cpu}
                    color="#3b82f6"
                />
                <VitalCard
                    icon={<MemoryStick size={24} />}
                    title={t('health.memory_allocation')}
                    value={`${safeHealth.vitals.memory} MB`}
                    subtitle="Active JS Heap"
                    fill={Math.min(100, (safeHealth.vitals.memory / 1024) * 100)}
                    color="#a855f7"
                />
                <VitalCard
                    icon={<Clock size={24} />}
                    title={t('health.system_uptime')}
                    value={`${safeHealth.uptime}s`}
                    subtitle="Continuous Operation"
                    fill={100}
                    color="#10b981"
                />
                <VitalCard
                    icon={<Activity size={24} />}
                    title={t('health.throughput')}
                    value={`${safeHealth.vitals.throughput}`}
                    subtitle="Requests / Minute"
                    fill={Math.min(100, (safeHealth.vitals.throughput / 500) * 100)}
                    color="#f59e0b"
                />
            </div>

            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1.5rem',
                }}
            >
                <KernelServicesSection services={safeHealth.services} isLoading={isLoading} />
                <DistributedNodesSection keys={keys} bees={bees} totalActive={totalActive} />
            </div>

            {probeResults && (
                <ProbeResultsSection
                    probeResults={probeResults}
                    expandedProbe={expandedProbe}
                    setExpandedProbe={setExpandedProbe}
                    keys={keys}
                />
            )}

            <RateLimitIntrospection
                keys={keys}
                allAlerts={allAlerts as unknown as AlertEntry[]}
                introspectionResults={introspectionResults}
                introspectingKeys={introspectingKeys}
            />

            <HealthScoreSection keyStateStore={keyStateStore} keys={keys} now={now} />

            <HealthTimelineSection
                healthEvents={healthEvents}
                healthEventFilter={healthEventFilter}
                setHealthEventFilter={setHealthEventFilter}
                now={now}
            />

            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    background: 'rgba(255,255,255,0.02)',
                    padding: '1rem 1.5rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        color: 'var(--slate-400)',
                        fontSize: '0.8rem',
                    }}
                >
                    <ShieldCheck size={16} aria-hidden="true" /> {t('health.data_encryption')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontFamily: 'monospace' }}>
                    BUILD_VER: {APP_VERSION} | KERNEL_ID: {kernelId}
                </div>
            </div>
            <ModuleInfo moduleKey="health" />
        </div>
    );
};

export default HealthPanel;
