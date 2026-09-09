import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    Activity,
    AlertCircle,
    BarChart3,
    Database,
    AlertTriangle,
    X,
} from 'lucide-react';
import { keyService } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import { formatCost } from '../../shared/utils/format-cost';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useConfirm } from '../../hooks/useConfirm';
import { useTranslation } from '../../i18n/useTranslation';
import type { ApiKey } from '../../types/metrics';
import type { StreamEndPayload, StreamErrorPayload } from '../../kernel/events/chat-events';
import AlertItem from './AlertItem';
import { SparklineMemo } from './SparklineChart';
import KeyMetadataGrid from './KeyMetadataGrid';
import ModelTestSection from './ModelTestSection';
import OverviewActionHeader from './OverviewActionHeader';
import LatencyBreakdownSection from './LatencyBreakdownSection';
import ErrorBreakdownSection from './ErrorBreakdownSection';
import OverviewSignalCards from './OverviewSignalCards';
import {
    errorBanner,
    dismissBtn,
    flexBetweenMb1,
    flexBetweenTextSm,
    flexCenterGap2,
    flexCenterGap2Mb1,
    flexColGap6,
    glassCard,
    grid2,
    progressBar6,
    textWeight600Muted,
} from '../../styles/common';

interface Props {
    apiKey: ApiKey;
}

const OverviewTab: React.FC<Props> = ({ apiKey }) => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [copied, setCopied] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearError = useAutoClearError(setError);
    const [modelTestResults, setModelTestResults] = useState<Record<
        string,
        { status: string; latency: number; error?: string }
    > | null>(null);
    const [modelTesting, setModelTesting] = useState(false);
    const [refreshingModels, setRefreshingModels] = useState(false);

    const refreshModelList = useCallback(async () => {
        setRefreshingModels(true);
        try {
            await keyService.refreshModels(apiKey.id);
        } catch {
            /* silently fail */
        }
        if (isMountedRef.current) setRefreshingModels(false);
    }, [apiKey.id]);

    const testAllModels = useCallback(async () => {
        const models = apiKey.availableModels;
        if (!models || models.length === 0) return;
        setModelTesting(true);
        setModelTestResults(null);
        const results: Record<string, { status: string; latency: number; error?: string }> = {};
        for (const model of models) {
            const start = Date.now();
            try {
                if (!isMountedRef.current) break;
                const reqId = `mmtest-${apiKey.id}-${model.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
                results[model] = { status: 'testing', latency: 0 };
                setModelTestResults({ ...results });
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        try {
                            cleanup();
                        } catch {
                            /* ignore */
                        }
                        reject(new Error('Timed out'));
                    }, 10000);
                    let done = false;
                    const subResp = eventBus.on(
                        EVENTS.MESSAGE_RESPONSE,
                        (res: { requestId: string; status?: string; error?: string }) => {
                            if (res?.requestId === reqId && !done) {
                                done = true;
                                clearTimeout(timeout);
                                try {
                                    cleanup();
                                } catch {
                                    /* ignore */
                                }
                                const lat = Date.now() - start;
                                results[model] =
                                    res.status === 'error'
                                        ? {
                                              status: 'error',
                                              latency: lat,
                                              error: res.error || 'Unknown',
                                          }
                                        : { status: 'ok', latency: lat };
                                try {
                                    setModelTestResults({ ...results });
                                } catch {
                                    /* ignore */
                                }
                                resolve();
                            }
                        },
                    );
                    const subStreamEnd = eventBus.on(EVENTS.STREAM_END, (res: StreamEndPayload) => {
                        if (res?.requestId === reqId && !done) {
                            done = true;
                            clearTimeout(timeout);
                            try {
                                cleanup();
                            } catch {
                                /* ignore */
                            }
                            results[model] = { status: 'ok', latency: Date.now() - start };
                            try {
                                setModelTestResults({ ...results });
                            } catch {
                                /* ignore */
                            }
                            resolve();
                        }
                    });
                    const subErr = eventBus.on(EVENTS.STREAM_ERROR, (res: StreamErrorPayload) => {
                        if (res?.requestId === reqId && !done) {
                            done = true;
                            clearTimeout(timeout);
                            try {
                                cleanup();
                            } catch {
                                /* ignore */
                            }
                            results[model] = {
                                status: 'error',
                                latency: Date.now() - start,
                                error: res.error || 'Stream error',
                            };
                            try {
                                setModelTestResults({ ...results });
                            } catch {
                                /* ignore */
                            }
                            resolve();
                        }
                    });
                    const cleanup = () => {
                        try {
                            subResp();
                        } catch {
                            /* ignore */
                        }
                        try {
                            subStreamEnd();
                        } catch {
                            /* ignore */
                        }
                        try {
                            subErr();
                        } catch {
                            /* ignore */
                        }
                    };
                    eventBus.emit(EVENTS.SEND_MESSAGE, {
                        provider: apiKey.provider,
                        model,
                        messages: [{ role: 'user', content: 'hi' }],
                        requestId: reqId,
                        keyId: apiKey.id,
                        options: { temperature: 0.7, maxTokens: 64 },
                    });
                });
            } catch (e: unknown) {
                try {
                    results[model] = {
                        status: 'error',
                        latency: Date.now() - (start || Date.now()),
                        error: e instanceof Error ? e.message : 'Unknown',
                    };
                    setModelTestResults({ ...results });
                } catch {
                    /* ignore */
                }
            }
        }
        try {
            if (isMountedRef.current) setModelTesting(false);
        } catch {
            /* ignore */
        }
    }, [apiKey]);

    const stats = apiKey.stats?.extended;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        };
    }, []);

    if (!stats)
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('overview.empty_state')}
            </div>
        );

    const repColor =
        (stats.reputationScore || 0) >= 80
            ? '#10b981'
            : (stats.reputationScore || 0) >= 50
              ? '#f59e0b'
              : '#ef4444';
    const formatMs = (ms: number) => `${Math.round(ms)}ms`;

    const handleCopyKey = async () => {
        try {
            if (apiKey.key) {
                await navigator.clipboard.writeText(apiKey.key);
                if (isMountedRef.current) setCopied(true);
                if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
                copyTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) setCopied(false);
                }, 2000);
            }
        } catch {
            if (isMountedRef.current) {
                setError(t('overview.error_copy'));
                clearError();
            }
        }
    };

    const handleResetMetrics = async () => {
        if (
            !(await confirm({
                title: 'Reset Metrics',
                message: 'Are you sure you want to reset metrics for this key?',
                variant: 'danger',
            }))
        )
            return;
        setResetting(true);
        try {
            if (typeof keyService.resetStats === 'function') await keyService.resetStats(apiKey.id);
            else
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: t('overview.reset_requested'),
                    type: 'info',
                });
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: t('overview.reset_success'),
                type: 'success',
            });
            if (isMountedRef.current) setError(null);
        } catch {
            if (isMountedRef.current) {
                setError(t('overview.error_reset'));
                clearError();
            }
        } finally {
            if (isMountedRef.current) setResetting(false);
        }
    };

    const handleToggleStatus = async () => {
        try {
            const { groupManager } = await import('../../kernel/instances');
            await groupManager.syncKeyStatus(
                apiKey.id,
                apiKey.status === 'active' ? 'inactive' : 'active',
            );
            if (isMountedRef.current) setError(null);
        } catch {
            if (isMountedRef.current) {
                setError(t('overview.error_toggle'));
                clearError();
            }
        }
    };

    const handleSetSLA = (sla: string) => {
        try {
            keyService.setSLA(apiKey.id, sla);
            if (isMountedRef.current) setError(null);
        } catch {
            if (isMountedRef.current) {
                setError(t('overview.error_sla'));
                clearError();
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={flexColGap6}
        >
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorBanner}
                        role="alert"
                    >
                        <AlertTriangle size={14} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={dismissBtn}
                            aria-label={t('overview.dismiss_error')}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <OverviewActionHeader
                stats={stats}
                apiKey={apiKey}
                copied={copied}
                resetting={resetting}
                onToggleStatus={handleToggleStatus}
                onCopyKey={handleCopyKey}
                onResetMetrics={handleResetMetrics}
                onSetSLA={handleSetSLA}
                t={t}
            />

            <div style={grid2}>
                <div style={glassCard}>
                    <div style={flexBetweenMb1}>
                        <span style={textWeight600Muted}>{t('overview.reputation')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: repColor }}>
                            {Math.round(stats.reputationScore || 0)}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            / 100
                        </span>
                    </div>
                </div>
                <div style={glassCard}>
                    <div style={flexBetweenMb1}>
                        <span style={textWeight600Muted}>{t('overview.concurrency')}</span>
                        <Database size={16} color="#3b82f6" aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                        {stats.currentConcurrentRequests || 0}
                        <span
                            style={{
                                fontSize: '1rem',
                                color: 'var(--text-muted)',
                                fontWeight: 500,
                            }}
                        >
                            {' '}
                            / {stats.rules?.maxConcurrentRequests || 5}
                        </span>
                    </div>
                </div>
            </div>

            <ModelTestSection
                availableModels={apiKey.availableModels || []}
                modelTestResults={modelTestResults}
                modelTesting={modelTesting}
                refreshingModels={refreshingModels}
                onRefreshModels={refreshModelList}
                onTestAll={testAllModels}
                t={t}
            />

            <div style={grid2}>
                <div style={glassCard}>
                    <div style={flexCenterGap2Mb1}>
                        <Wallet size={14} color="#10b981" aria-hidden="true" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {t('overview.daily_limits')}
                        </span>
                    </div>
                    <div style={progressBar6}>
                        <div
                            style={{
                                width: `${Math.min(100, ((stats.usageToday?.tokens || 0) / (stats.rules?.quota?.tokensPerDay || 100000)) * 100)}%`,
                                height: '100%',
                                background: 'var(--success)',
                            }}
                        />
                    </div>
                    <div style={flexBetweenTextSm}>
                        <span>
                            {t('overview.tokens_used', { count: stats.usageToday?.tokens || 0 })}
                        </span>
                        <span>
                            {Math.round(
                                ((stats.usageToday?.tokens || 0) /
                                    (stats.rules?.quota?.tokensPerDay || 100000)) *
                                    100,
                            )}
                            %
                        </span>
                    </div>
                </div>
                <div style={glassCard}>
                    <div style={flexCenterGap2Mb1}>
                        <TrendingUp size={14} color="#a855f7" aria-hidden="true" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {t('overview.monthly_spend')}
                        </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                        {formatCost(stats.usageMonthly?.estimatedCost || 0)}
                    </div>
                    {stats.rules?.quota?.monthlyBudget && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {t('overview.of_budget', { budget: stats.rules.quota.monthlyBudget })}
                        </div>
                    )}
                </div>
            </div>

            <div style={glassCard}>
                <div style={flexBetweenMb1}>
                    <div style={flexCenterGap2}>
                        <Activity size={14} color="#3b82f6" aria-hidden="true" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {t('overview.latency_history')}
                        </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>
                        {t('overview.latency_avg', {
                            value: formatMs(stats.fourSignals?.latency || 0),
                        })}
                    </span>
                </div>
                <SparklineMemo
                    data={(stats.throughputHistory || []).map((h) =>
                        typeof h === 'number' ? h : h?.latency || 0,
                    )}
                    emptyLabel={t('overview.insufficient_data')}
                />
            </div>

            {stats.alerts && stats.alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                        }}
                    >
                        <AlertCircle size={14} color="#ef4444" aria-hidden="true" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {t('overview.active_alerts')}
                        </span>
                    </div>
                    {stats.alerts.map((alert) => (
                        <AlertItem key={alert.id} alert={alert} />
                    ))}
                </div>
            )}

            <LatencyBreakdownSection latencyBreakdown={stats.latencyBreakdown} t={t} />

            <div style={grid2}>
                <div style={glassCard}>
                    <div style={flexCenterGap2Mb1}>
                        <BarChart3 size={14} color="#f59e0b" aria-hidden="true" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {t('overview.request_quota')}
                        </span>
                    </div>
                    <div style={progressBar6}>
                        <div
                            style={{
                                width: `${Math.min(100, ((stats.usageToday?.requests || 0) / (stats.rules?.quota?.requestsPerDay || 1000)) * 100)}%`,
                                height: '100%',
                                background: 'var(--warning)',
                            }}
                        />
                    </div>
                    <div style={flexBetweenTextSm}>
                        <span>
                            {t('overview.requests_used', {
                                count: stats.usageToday?.requests || 0,
                            })}
                        </span>
                        <span>
                            {Math.round(
                                ((stats.usageToday?.requests || 0) /
                                    (stats.rules?.quota?.requestsPerDay || 1000)) *
                                    100,
                            )}
                            %
                        </span>
                    </div>
                </div>
                <ErrorBreakdownSection errorBreakdown={stats.errorBreakdown} t={t} />
            </div>

            <OverviewSignalCards fourSignals={stats.fourSignals} t={t} />

            <KeyMetadataGrid apiKey={apiKey} stats={stats} />
            <ConfirmDialog />
        </motion.div>
    );
};

export default OverviewTab;
