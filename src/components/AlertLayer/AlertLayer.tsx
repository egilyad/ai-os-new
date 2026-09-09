import { genId } from '../../utils/gen-id';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, AlertTriangle, Info, CheckCircle, Activity } from 'lucide-react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { keyService } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import type { ProviderAlert } from '../../types/metrics';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    timestamp: number;
}

const TOAST_DURATION = 8000;
const MAX_TOASTS = 5;

const ICONS: Record<string, React.ReactNode> = {
    success: <CheckCircle size={16} color="#10b981" />,
    error: <X size={16} color="#ef4444" />,
    info: <Info size={16} color="#3b82f6" />,
    warning: <AlertTriangle size={16} color="#f59e0b" />,
};

const getToastType = (type: string): Toast['type'] => {
    if (type === 'success' || type === 'error' || type === 'warning' || type === 'info')
        return type;
    return 'info';
};

const AlertLayer: React.FC = () => {
    const { t } = useTranslation();
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [alerts, setAlerts] = useState<ProviderAlert[]>([]);
    const [expanded, setExpanded] = useState(false);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const handleViewAllAlerts = useCallback(() => setExpanded(true), []);

    const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
        const id = genId();
        const toast: Toast = { id, type, title, message, timestamp: Date.now() };
        setToasts((prev) => {
            const next = [toast, ...prev].slice(0, MAX_TOASTS);
            return next;
        });
        timers.current.set(
            id,
            setTimeout(() => {
                setToasts((prev) => prev.filter((x) => x.id !== id));
                timers.current.delete(id);
            }, TOAST_DURATION),
        );
        // C-97: removed re-emit — caused double toasts (NOTIFICATION → addToast → NOTIFICATION → addToast)
    }, []);

    const dismissToast = useCallback((id: string) => {
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
        setToasts((prev) => prev.filter((x) => x.id !== id));
    }, []);

    useEffect(() => {
        const currentTimers = timers.current;
        const refreshAlerts = () => setAlerts(keyService.getAlerts().filter((a) => !a.resolved));
        refreshAlerts();

        const getStr = (d: Record<string, unknown>, k: string, fallback = ''): string =>
            typeof d[k] === 'string' ? (d[k] as string) : fallback;
        const getNum = (d: Record<string, unknown>, k: string, fallback = 0): number =>
            typeof d[k] === 'number' ? (d[k] as number) : fallback;

        const unsubs = [
            eventBus.onSafe<Record<string, unknown>>(EVENTS.NOTIFICATION, (data) => {
                const msg = getStr(data, 'message', '');
                const type = getStr(data, 'type', 'info');
                addToast(getToastType(type), 'System', msg);
            }),
            eventBus.onSafe<Record<string, unknown>>(EVENTS.KEY_QUOTA_EXCEEDED, (d) => {
                addToast(
                    'warning',
                    'Quota Exceeded',
                    `${getStr(d, 'provider')}: ${getStr(d, 'quotaType')} limit reached`,
                );
                refreshAlerts();
            }),
            eventBus.onSafe<Record<string, unknown>>(EVENTS.KEY_LATENCY_BURST, (d) => {
                addToast(
                    'warning',
                    'Latency Burst',
                    `${getStr(d, 'provider')} spike: ${getNum(d, 'latency')}ms`,
                );
            }),
            eventBus.onSafe<Record<string, unknown>>(EVENTS.KEY_HEALTH_CHECK_FAILED, (d) => {
                addToast(
                    'error',
                    'Health Check Failed',
                    `${getStr(d, 'provider')}: ${getStr(d, 'error')}`,
                );
                refreshAlerts();
            }),
            eventBus.onSafe<Record<string, unknown>>(
                EVENTS.KEY_REPUTATION_THRESHOLD_CROSSED,
                (d) => {
                    addToast(
                        'warning',
                        'Reputation Drop',
                        `${getStr(d, 'provider')} score: ${getNum(d, 'score')}`,
                    );
                    refreshAlerts();
                },
            ),
            eventBus.onSafe<Record<string, unknown>>(EVENTS.KEY_STATE_CHANGED, (d) => {
                addToast(
                    'info',
                    'State Changed',
                    `${getStr(d, 'provider')}: ${getStr(d, 'previousState')} → ${getStr(d, 'state')}`,
                );
            }),
            eventBus.onSafe<Record<string, unknown>>(EVENTS.KEY_COMPROMISED, (d) => {
                addToast(
                    'error',
                    'Key Compromised',
                    `${getStr(d, 'provider')}: key ${getStr(d, 'id')} marked compromised via ${getStr(d, 'source', 'unknown')} — revoked from all pools`,
                );
                refreshAlerts();
            }),
            eventBus.onSafe<Record<string, unknown>>(EVENTS.METRICS_ALERT, (d) => {
                const sev = getStr(d, 'severity') === 'critical' ? 'error' : 'warning';
                const val = getNum(d, 'value');
                addToast(
                    sev,
                    'Metric Alert',
                    `${getStr(d, 'metric')} = ${val} (${getStr(d, 'severity')})`,
                );
            }),
            eventBus.on(EVENTS.KEY_UPDATED, refreshAlerts),
        ];

        return () => {
            unsubs.forEach((u) => u());
            currentTimers.forEach((timer) => clearTimeout(timer));
        };
    }, [addToast]);

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(
        (a) => a.severity === 'high' || a.severity === 'medium',
    ).length;

    return (
        <div
            style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxWidth: 380,
                pointerEvents: 'none',
            }}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onMouseEnter={() => {
                        const timer = timers.current.get(toast.id);
                        if (timer) {
                            clearTimeout(timer);
                            timers.current.delete(toast.id);
                        }
                    }}
                    onMouseLeave={() => {
                        timers.current.set(
                            toast.id,
                            setTimeout(() => {
                                setToasts((prev) => prev.filter((x) => x.id !== toast.id));
                                timers.current.delete(toast.id);
                            }, TOAST_DURATION),
                        );
                    }}
                    style={{
                        pointerEvents: 'auto',
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        background: 'var(--slate-800)',
                        border: `1px solid ${toast.type === 'error' ? '#ef4444' : toast.type === 'warning' ? '#f59e0b' : toast.type === 'success' ? '#10b981' : '#3b82f6'}30`,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        animation: 'slideIn 0.3s ease',
                    }}
                >
                    <div style={{ marginTop: 2 }}>{ICONS[toast.type]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                marginBottom: 2,
                            }}
                        >
                            {toast.title}
                        </div>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                wordBreak: 'break-word',
                            }}
                        >
                            {toast.message}
                        </div>
                    </div>
                    <button
                        onClick={() => dismissToast(toast.id)}
                        aria-label={t('common.close')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            padding: 2,
                            flexShrink: 0,
                        }}
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </div>
            ))}

            {alerts.length > 0 && (
                <div style={{ pointerEvents: 'auto', marginTop: '0.25rem' }}>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 10,
                            background:
                                criticalAlerts > 0
                                    ? 'rgba(239,68,68,0.15)'
                                    : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${criticalAlerts > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.2)'}`,
                            color: criticalAlerts > 0 ? '#fca5a5' : '#fde68a',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <AlertTriangle size={14} />
                        <span>
                            {criticalAlerts} critical, {warningAlerts} warnings
                        </span>
                        <Activity size={14} style={{ marginLeft: 'auto' }} />
                    </button>
                    {expanded && (
                        <div
                            style={{
                                marginTop: '0.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                            }}
                        >
                            {alerts.slice(0, 8).map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-300)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            flexShrink: 0,
                                            background:
                                                a.severity === 'critical'
                                                    ? '#ef4444'
                                                    : a.severity === 'high'
                                                      ? '#f59e0b'
                                                      : '#3b82f6',
                                        }}
                                    />
                                    <span style={{ flex: 1 }}>{a.message}</span>
                                    <span style={{ color: 'var(--slate-500)', fontSize: '0.6rem' }}>
                                        {new Date(a.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                            {alerts.length > 8 && (
                                <button
                                    onClick={handleViewAllAlerts}
                                    style={{
                                        fontSize: '0.65rem',
                                        color: '#60a5fa',
                                        textAlign: 'center',
                                        padding: '0.25rem',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        width: '100%',
                                    }}
                                >
                                    View all {alerts.length} alerts →
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AlertLayer;
