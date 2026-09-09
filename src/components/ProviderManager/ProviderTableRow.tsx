import React, { useState, useEffect, useRef } from 'react';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import {
    GripVertical,
    PowerOff,
    Power,
    RefreshCw,
    Terminal,
    Trash2,
    AlertTriangle,
    Send,
    Loader2,
    Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { eventBus, EVENTS } from '../../kernel/instances';
import type { ApiKey } from '../../types/metrics';
import { repColor, TagPill } from '../Common/status-vocabulary';
import { keyStateStore } from '../../kernel/instances';
import { getHealthBand } from '../../kernel/contracts/key-state';
import {
    errorBox,
    flexBetweenSuccessLabel,
    iconBtn36,
    infoIcon,
    posRelative,
    selectSmall,
    successBox,
    textErrorContent,
    textErrorLabel,
    textResultBox,
    textXs,
} from '../../styles/common';
import { PersonalityBadge } from './PersonalityBadge';
import { useTranslation } from '../../i18n/useTranslation';
import { useNow } from '../../hooks/useNow';
import { statusBadge, highlightText } from './provider-utils';

export interface ProviderRowProps {
    apiKey: ApiKey;
    onSelect: (key: ApiKey, tab: 'overview' | 'sandbox') => void;
    onCheckHealth: (keyId: string) => void;
    onToggleStatus: (keyId: string) => void;
    onRemoveKey: (keyId: string) => void;
    isChecking: boolean;
    searchQuery: string;
    rowIndex?: number;
    isDragging?: boolean;
    isDragOver?: boolean;
    onDragStart?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: () => void;
}

const ProviderTableRow: React.FC<
    ProviderRowProps & { isExpanded?: boolean; onToggleExpand?: () => void }
> = ({
    apiKey,
    onSelect,
    onCheckHealth,
    onToggleStatus,
    onRemoveKey,
    isChecking,
    searchQuery,
    isExpanded,
    onToggleExpand,
    isDragging,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
}) => {
    const { t } = useTranslation();
    const now = useNow();
    const status = statusBadge(apiKey.status);
    const reputation = apiKey.stats?.extended?.reputationScore || 0;
    const modelCount = apiKey.availableModels?.length || 0;

    const [testPrompt, setTestPrompt] = useState('');
    const [testModel, setTestModel] = useState('');
    const [testTemperature] = useState(0.7);
    const [testMaxTokens] = useState(1024);
    const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [testResult, setTestResult] = useState<{
        content: string;
        latency?: number;
        model?: string;
    } | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [confirmRemove, setConfirmRemove] = useState(false);

    useEffect(() => {
        if (!confirmRemove) return;
        const timer = setTimeout(() => setConfirmRemove(false), 5000);
        return () => clearTimeout(timer);
    }, [confirmRemove]);

    const isMountedRef = useRef(true);
    const testInitiatedRef = useRef(false);
    const testPromptRef = React.useRef(testPrompt);
    const testModelRef = React.useRef(testModel);
    const testTempRef = React.useRef(testTemperature);
    const testMaxTokensRef = React.useRef(testMaxTokens);
    const apiKeyIdRef = React.useRef(apiKey.id);
    useEffect(() => {
        testPromptRef.current = testPrompt;
        testModelRef.current = testModel;
        testTempRef.current = testTemperature;
        testMaxTokensRef.current = testMaxTokens;
        apiKeyIdRef.current = apiKey.id;
    }, [testPrompt, testModel, testTemperature, testMaxTokens, apiKey.id]);

    const handleTest = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        if (!testPrompt.trim() || testStatus === 'loading') return;
        setTestStatus('loading');
        setTestResult(null);
        setTestError(null);
    };

    React.useEffect(() => {
        if (testStatus !== 'loading') return;
        if (testInitiatedRef.current) return;
        testInitiatedRef.current = true;
        isMountedRef.current = true;

        const prompt = testPromptRef.current;
        if (!prompt.trim()) return;

        const keyId = apiKeyIdRef.current;
        const p = apiKey.provider.toLowerCase();
        const defaultModel = PROVIDER_DEFAULT_MODELS[p] || 'auto';
        const resolvedModel = testModelRef.current || apiKey.availableModels?.[0] || defaultModel;

        const reqId = `quick-test-tbl-${keyId}-${crypto.randomUUID().slice(0, 6)}`;
        const start = Date.now();
        let isDone = false;

        eventBus.emit(EVENTS.SEND_MESSAGE, {
            provider: p,
            model: resolvedModel,
            messages: [{ role: 'user', content: prompt }],
            requestId: reqId,
            keyId,
            options: { temperature: testTempRef.current, maxTokens: testMaxTokensRef.current },
        });

        const subResp = eventBus.on(EVENTS.MESSAGE_RESPONSE, (res) => {
            if (!isMountedRef.current) return;
            if (res.requestId === reqId && !isDone) {
                isDone = true;
                if (res.status === 'error') {
                    setTestStatus('error');
                    setTestError(res.error || 'Unknown error');
                } else {
                    setTestStatus('success');
                    setTestResult({
                        content: res.content,
                        latency: Date.now() - start,
                        model: resolvedModel,
                    });
                }
            }
        });

        const subStreamEnd = eventBus.on(EVENTS.STREAM_END, ({ requestId, fullContent }) => {
            if (!isMountedRef.current) return;
            if (requestId === reqId && !isDone) {
                isDone = true;
                setTestStatus('success');
                setTestResult({
                    content: fullContent,
                    latency: Date.now() - start,
                    model: resolvedModel,
                });
            }
        });

        const subStreamErr = eventBus.on(EVENTS.STREAM_ERROR, ({ requestId, error }) => {
            if (!isMountedRef.current) return;
            if (requestId === reqId && !isDone) {
                isDone = true;
                setTestStatus('error');
                setTestError(error || 'Stream error');
            }
        });

        const timeout = setTimeout(() => {
            if (!isMountedRef.current) return;
            if (!isDone) {
                isDone = true;
                eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: reqId });
                setTestStatus('error');
                setTestError('Request timed out');
            }
        }, 45000);

        return () => {
            // Cancel the in-flight request on unmount/re-fire so it doesn't
            // continue consuming quota in the background after the UI is gone.
            if (!isDone) {
                eventBus.emit(EVENTS.CANCEL_MESSAGE, { requestId: reqId });
            }
            isMountedRef.current = false;
            testInitiatedRef.current = false;
            subResp();
            subStreamEnd();
            subStreamErr();
            clearTimeout(timeout);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testStatus]);

    return (
        <>
            <tr
                draggable={true}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => onSelect(apiKey, 'overview')}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(apiKey, 'overview');
                    }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${apiKey.label}`}
                style={{
                    opacity: isDragging ? 0.4 : 1,
                    borderBottom: isDragOver ? '2px solid #3b82f6' : undefined,
                    cursor: 'grab',
                }}
            >
                <td style={{ width: 32, textAlign: 'center', cursor: 'grab' }}>
                    <GripVertical size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </td>
                <td>
                    <div className="provider-inline-flex" style={{ gap: '0.75rem' }}>
                        <ProviderIcon provider={apiKey.provider} size={18} />
                        <div>
                            <div className="provider-name-label">
                                {highlightText(apiKey.label, searchQuery)}
                            </div>
                            <div className="provider-name-sub">
                                {highlightText(apiKey.provider, searchQuery)}
                                <span style={{ marginLeft: 6 }}>
                                    <PersonalityBadge provider={apiKey.provider} compact />
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <span
                        className="provider-status-badge"
                        style={{ color: status.color, background: status.bg }}
                        title={
                            apiKey.status === 'error' && apiKey.stats?.lastError?.message
                                ? apiKey.stats.lastError.message
                                : t(status.labelKey)
                        }
                    >
                        {status.icon} {t(status.labelKey)}
                        {apiKey.status === 'error' && apiKey.stats?.lastError?.message && (
                            <span style={infoIcon}>ⓘ</span>
                        )}
                    </span>
                    {(() => {
                        const ks = keyStateStore?.get?.(apiKey.id);
                        if (!ks) return null;
                        const band = getHealthBand(ks.healthScore);
                        const bandColors: Record<string, string> = {
                            healthy: '#10b981',
                            warm: '#f59e0b',
                            degraded: '#f97316',
                            cooling: '#ef4444',
                            dead: '#dc2626',
                        };
                        const c = bandColors[band] || '#64748b';
                        return (
                            <span
                                style={{
                                    marginLeft: 4,
                                    padding: '1px 6px',
                                    borderRadius: 8,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: c,
                                    background: `${c}18`,
                                    textTransform: 'uppercase',
                                }}
                                title={`Health score: ${ks.healthScore}/100 — ${band}`}
                            >
                                {band} {ks.healthScore}
                            </span>
                        );
                    })()}
                    {apiKey.expiresAt && (
                        <span
                            style={{
                                marginLeft: 4,
                                fontSize: '0.6rem',
                                padding: '1px 4px',
                                borderRadius: 4,
                                background:
                                    apiKey.expiresAt < now
                                        ? 'rgba(239,68,68,0.15)'
                                        : apiKey.expiresAt < now + 7 * 86400000
                                          ? 'rgba(245,158,11,0.15)'
                                          : 'rgba(255,255,255,0.05)',
                                color:
                                    apiKey.expiresAt < now
                                        ? '#ef4444'
                                        : apiKey.expiresAt < now + 7 * 86400000
                                          ? '#f59e0b'
                                          : '#94a3b8',
                            }}
                        >
                            {new Date(apiKey.expiresAt).toLocaleDateString()}
                        </span>
                    )}
                    {(() => {
                        const cbks = keyStateStore?.get?.(apiKey.id);
                        if (!cbks) return null;
                        if (cbks.flags.circuitOpen) {
                            return (
                                <span
                                    style={{
                                        marginLeft: 4,
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: 'var(--error)',
                                        background: 'rgba(239,68,68,0.15)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                    }}
                                    title="Circuit breaker is OPEN"
                                >
                                    <span
                                        style={{
                                            width: 5,
                                            height: 5,
                                            borderRadius: '50%',
                                            background: 'var(--error)',
                                            display: 'inline-block',
                                        }}
                                    />
                                    CB
                                </span>
                            );
                        }
                        if (cbks.flags.rateLimited) {
                            return (
                                <span
                                    style={{
                                        marginLeft: 4,
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        color: '#f97316',
                                        background: 'rgba(249,115,22,0.15)',
                                        border: '1px solid rgba(249,115,22,0.3)',
                                    }}
                                    title="Rate limited"
                                >
                                    RL
                                </span>
                            );
                        }
                        return null;
                    })()}
                </td>
                <td style={posRelative}>
                    <div className="provider-action-group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus(apiKey.id);
                            }}
                            className={`provider-action-btn ${apiKey.status === 'active' ? 'provider-action-btn--active' : 'provider-action-btn--inactive'}`}
                            title={
                                apiKey.status === 'active'
                                    ? t('provider.disable')
                                    : t('provider.enable')
                            }
                        >
                            {apiKey.status === 'active' ? (
                                <PowerOff size={14} />
                            ) : (
                                <Power size={14} />
                            )}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isChecking) onCheckHealth(apiKey.id);
                            }}
                            className={`provider-action-btn${isChecking ? ' provider-action-btn--checking' : ''}`}
                            disabled={isChecking}
                            title={
                                isChecking
                                    ? t('provider.checking_health')
                                    : t('provider.check_health')
                            }
                        >
                            <RefreshCw size={14} className={isChecking ? 'provider-spin' : ''} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleExpand) onToggleExpand();
                            }}
                            className={`provider-action-btn ${isExpanded ? 'provider-action-btn--active' : ''}`}
                            title={t('provider.tooltip_quick_test')}
                        >
                            <Terminal size={14} />
                        </button>
                        {confirmRemove ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveKey(apiKey.id);
                                }}
                                className="provider-action-btn provider-action-btn--danger"
                                title={t('provider.tooltip_confirm_remove')}
                            >
                                <AlertTriangle size={14} />
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmRemove(true);
                                }}
                                className="provider-action-btn provider-action-btn--remove"
                                title={t('provider.tooltip_remove')}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        {confirmRemove && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    background: 'var(--error-tint)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: 8,
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.7rem',
                                    color: '#fca5a5',
                                    whiteSpace: 'nowrap',
                                    zIndex: 10,
                                    marginTop: 4,
                                }}
                            >
                                {t('provider.confirm_remove')}{' '}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmRemove(false);
                                    }}
                                    style={{
                                        color: 'var(--slate-400)',
                                        textDecoration: 'underline',
                                        marginLeft: 8,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        )}
                    </div>
                </td>
                <td style={{ fontSize: '0.72rem', verticalAlign: 'middle' }}>
                    {(() => {
                        const usage = apiKey.stats?.extended?.usageToday;
                        const quota = apiKey.stats?.extended?.rules?.quota;
                        const tokensUsed = usage?.tokens || 0;
                        const tokensLimit = quota?.tokensPerDay || 0;
                        if (!tokensLimit) return '\u2014';
                        const pct = tokensUsed / tokensLimit;
                        return (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    minWidth: 80,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        color: 'var(--slate-400)',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    <span>{t('provider.tokens_short')}</span>
                                    <span
                                        style={{
                                            color:
                                                pct > 0.8
                                                    ? '#ef4444'
                                                    : pct > 0.5
                                                      ? '#f59e0b'
                                                      : '#10b981',
                                        }}
                                    >
                                        {tokensUsed.toLocaleString()}/{tokensLimit.toLocaleString()}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, pct * 100)}%`,
                                            borderRadius: 2,
                                            background:
                                                pct > 0.8
                                                    ? '#ef4444'
                                                    : pct > 0.5
                                                      ? '#f59e0b'
                                                      : '#10b981',
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        color: 'var(--slate-400)',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        marginTop: 1,
                                    }}
                                >
                                    <span>{t('provider.requests_short')}</span>
                                    <span
                                        style={{
                                            color:
                                                (usage?.requests || 0) >
                                                (quota?.requestsPerDay || 0)
                                                    ? '#ef4444'
                                                    : '#94a3b8',
                                        }}
                                    >
                                        {(usage?.requests || 0).toLocaleString()}/
                                        {Math.min(
                                            quota?.requestsPerDay || 0,
                                            tokensLimit,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}
                </td>
                <td className="provider-table-cell-value">
                    {apiKey.group || apiKey.account || apiKey.accountId ? (
                        <span
                            className="provider-account-badge"
                            title={`${apiKey.group ? apiKey.group + ' / ' : ''}${apiKey.account || apiKey.accountId || ''}`}
                        >
                            {apiKey.group && <span style={{ opacity: 0.6 }}>{apiKey.group}/</span>}
                            {apiKey.account || apiKey.accountId || '\u2014'}
                        </span>
                    ) : (
                        <span className="provider-empty-cell">\u2014</span>
                    )}
                </td>
                <td className="provider-table-cell-value">
                    {apiKey.stats?.avgLatency
                        ? `${Math.round(apiKey.stats.avgLatency)}ms`
                        : '\u2014'}
                </td>
                <td className="provider-table-cell-value">
                    {typeof apiKey.stats?.extended?.latencyBreakdown?.tokensPerSec === 'number'
                        ? apiKey.stats.extended.latencyBreakdown.tokensPerSec.toFixed(1)
                        : '\u2014'}
                </td>
                <td className="provider-table-cell-value">
                    {apiKey.stats?.successCount || apiKey.stats?.errorCount
                        ? `${Math.round((apiKey.stats.successCount / (apiKey.stats.successCount + apiKey.stats.errorCount)) * 100)}%`
                        : 'N/A'}
                </td>
                <td>
                    <div className="provider-inline-flex">
                        <div className="provider-rep-bar">
                            <div
                                className="provider-rep-fill"
                                style={{
                                    width: `${reputation}%`,
                                    background: repColor(reputation),
                                }}
                            />
                        </div>
                        <span className="provider-rep-text" style={{ color: repColor(reputation) }}>
                            {reputation}
                        </span>
                    </div>
                </td>
                <td>
                    {modelCount > 0 && (
                        <span
                            className="provider-model-badge"
                            title={`${modelCount} model${modelCount > 1 ? 's' : ''}`}
                        >
                            <Layers size={12} /> {modelCount}
                        </span>
                    )}
                </td>
                <td style={textXs}>
                    {apiKey.notes && apiKey.notes.length > 0 ? (
                        <span
                            style={{ color: 'var(--slate-400)', cursor: 'default' }}
                            title={apiKey.notes.map((n) => n.text).join(' | ')}
                        >
                            {apiKey.notes.length}
                        </span>
                    ) : (
                        '\u2014'
                    )}
                </td>
                <td>
                    {apiKey.tags && apiKey.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {apiKey.tags.map((tag) => (
                                <TagPill key={tag} tag={tag} />
                            ))}
                        </div>
                    )}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td
                        colSpan={14}
                        style={{
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.1)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <textarea
                                value={testPrompt}
                                onChange={(e) => setTestPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleTest(e);
                                    }
                                }}
                                placeholder={t('provider.test_prompt_placeholder', {
                                    label: apiKey.label,
                                })}
                                rows={1}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    resize: 'none',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                }}
                            />
                            {apiKey.availableModels && apiKey.availableModels.length > 0 && (
                                <select
                                    value={testModel}
                                    onChange={(e) => setTestModel(e.target.value)}
                                    style={selectSmall}
                                    aria-label={t('provider.select_model')}
                                >
                                    <option value="">{t('provider.default_model')}</option>
                                    {apiKey.availableModels.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={handleTest}
                                disabled={!testPrompt.trim() || testStatus === 'loading'}
                                className="btn-primary"
                                style={iconBtn36}
                            >
                                {testStatus === 'loading' ? (
                                    <Loader2 size={16} className="provider-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>
                        {testStatus === 'success' && testResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={successBox}
                            >
                                <div style={flexBetweenSuccessLabel}>
                                    <span>{testResult.model}</span>
                                    <span>{testResult.latency}ms</span>
                                </div>
                                <div style={textResultBox}>{testResult.content}</div>
                            </motion.div>
                        )}
                        {testStatus === 'error' && testError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={errorBox}
                            >
                                <div style={textErrorLabel}>{t('common.error').toUpperCase()}</div>
                                <div style={textErrorContent}>{testError}</div>
                            </motion.div>
                        )}
                        {apiKey.notes && apiKey.notes.length > 0 && (
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 8,
                                    fontSize: '0.75rem',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.25rem',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {t('common.notes')}
                                </div>
                                {apiKey.notes.map((n) => (
                                    <div
                                        key={n.id}
                                        style={{ color: 'var(--slate-400)', marginBottom: '0.15rem' }}
                                    >
                                        <span style={{ color: 'var(--slate-500)', fontSize: '0.65rem' }}>
                                            {new Date(n.timestamp).toLocaleDateString()}
                                        </span>{' '}
                                        {n.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
};

export default ProviderTableRow;
