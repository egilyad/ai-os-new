import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import ProviderIcon from '../ProviderIcon/ProviderIcon';

import type { ApiKey } from '../../types/metrics';
import { repColor, TagPill } from '../Common/status-vocabulary';
import { probeService, keyService, keyStateStore } from '../../kernel/instances';
import type { ProbeResult } from '../../kernel/contracts/probe';
import { useTranslation } from '../../i18n/useTranslation';
import { useNow } from '../../hooks/useNow';
import { statusBadge, highlightText } from './provider-utils';
import { HealthBandBadge, ProviderHealthBar } from './ProviderHealthBar';
import { ProviderUsageBars } from './ProviderUsageBars';
import { ProbeResultSection } from './ProbeResultSection';
import { QuickTestSection } from './QuickTestSection';
import { ProviderCardActions, ConfirmRemoveBanner } from './ProviderCardActions';
import { posRelative, textXs, infoIcon } from '../../styles/common';
import { PersonalityBadge } from './PersonalityBadge';

export interface ProviderCardProps {
    apiKey: ApiKey;
    onSelect: (key: ApiKey, tab: 'overview' | 'sandbox') => void;
    onCheckHealth: (keyId: string) => void;
    onToggleStatus: (keyId: string) => void;
    onRemoveKey: (keyId: string) => void;
    isChecking: boolean;
    searchQuery: string;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
    apiKey,
    onSelect,
    onCheckHealth,
    onToggleStatus,
    onRemoveKey,
    isChecking,
    searchQuery,
}) => {
    const { t } = useTranslation();
    const now = useNow();
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
    const [probeLoading, setProbeLoading] = useState(false);
    const status = statusBadge(apiKey.status);
    const reputation = apiKey.stats?.extended?.reputationScore || 0;
    const modelCount = apiKey.availableModels?.length || 0;
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!confirmRemove) return;
        const timer = setTimeout(() => setConfirmRemove(false), 5000);
        return () => clearTimeout(timer);
    }, [confirmRemove]);

    const handleProbe = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setProbeLoading(true);
        setProbeResult(null);
        try {
            const results = await probeService.probeForDebate([
                { id: apiKey.id, provider: apiKey.provider, modelId: apiKey.model },
            ]);
            if (isMounted.current) setProbeResult(results.get(apiKey.id) || null);
        } finally {
            if (isMounted.current) setProbeLoading(false);
        }
    };

    const ks = keyStateStore?.get?.(apiKey.id);
    const alerts = keyService.getAlerts().filter((a) => a.keyId === apiKey.id);

    return (
        <motion.div
            onClick={() => onSelect(apiKey, 'overview')}
            className="glass-panel provider-card-item"
            style={posRelative}
            whileHover={{ scale: 1.01, borderColor: 'rgba(59,130,246,0.3)' }}
            whileTap={{ scale: 0.98 }}
        >
            {isChecking && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                    }}
                >
                    <Loader2 size={20} className="provider-spin" color="#3b82f6" />
                </div>
            )}

            <div
                className="provider-inline-flex"
                style={{
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                }}
            >
                <div className="provider-inline-flex" style={{ gap: '1rem' }}>
                    <div className="provider-card-icon-box">
                        <ProviderIcon provider={apiKey.provider} size={20} />
                    </div>
                    <div>
                        <div className="provider-card-title">
                            {highlightText(apiKey.label, searchQuery)}
                        </div>
                        <div className="provider-name-sub" style={textXs}>
                            {highlightText(apiKey.provider, searchQuery)}
                        </div>
                        <div style={{ marginTop: 4 }}>
                            <PersonalityBadge provider={apiKey.provider} compact />
                        </div>
                    </div>
                </div>
                <div className="provider-card-end">
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
                            <span style={infoIcon} title={apiKey.stats.lastError.message}>
                                ⓘ
                            </span>
                        )}
                    </span>
                    {ks && <HealthBandBadge healthScore={ks.healthScore} />}
                    {apiKey.expiresAt && (
                        <span
                            style={{
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                marginTop: 4,
                                display: 'inline-block',
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
                            {apiKey.expiresAt < now
                                ? `${t('provider.expired')}: `
                                : `${t('provider.expires')}: `}
                            {new Date(apiKey.expiresAt).toLocaleDateString()}
                        </span>
                    )}
                    {apiKey.tags && apiKey.tags.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.25rem',
                                flexWrap: 'wrap',
                                marginTop: '0.25rem',
                            }}
                        >
                            {apiKey.tags.map((tag) => (
                                <TagPill key={tag} tag={tag} />
                            ))}
                        </div>
                    )}
                    {alerts.length > 0 && (
                        <span
                            style={{
                                marginLeft: 8,
                                fontSize: '0.65rem',
                                color: 'var(--warning)',
                                fontWeight: 700,
                            }}
                            title={alerts.map((a) => a.message).join('; ')}
                        >
                            ⚠ {alerts.length}
                        </span>
                    )}
                    <div
                        className="provider-inline-flex"
                        style={{ gap: '0.4rem', marginTop: '0.25rem' }}
                    >
                        <div className="provider-rep-bar">
                            <div
                                className="provider-rep-fill"
                                style={{
                                    width: `${reputation}%`,
                                    background: repColor(reputation),
                                }}
                            />
                        </div>
                        <span
                            className="provider-rep-text"
                            style={{ fontSize: '0.65rem', color: repColor(reputation) }}
                        >
                            {reputation} REP
                        </span>
                    </div>
                    {(apiKey.group || apiKey.account || apiKey.accountId) && (
                        <div
                            style={{ fontSize: '0.65rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}
                        >
                            {apiKey.group && <span style={{ opacity: 0.6 }}>{apiKey.group}/</span>}
                            {apiKey.account || apiKey.accountId}
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: '0.4rem',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {ks?.flags?.circuitOpen && (
                            <span
                                className="cb-pulse"
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: 'var(--error)',
                                    background: 'rgba(239,68,68,0.15)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                                title="Circuit breaker is OPEN — requests are being blocked"
                            >
                                <span
                                    className="cb-dot"
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: 'var(--error)',
                                        display: 'inline-block',
                                    }}
                                />
                                CIRCUIT OPEN
                            </span>
                        )}
                        {ks?.flags?.rateLimited && (
                            <span
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: '#f97316',
                                    background: 'rgba(249,115,22,0.15)',
                                    border: '1px solid rgba(249,115,22,0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                                title="Rate limited — requests are throttled"
                            >
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: '#f97316',
                                        display: 'inline-block',
                                    }}
                                />
                                RATE LIMITED
                            </span>
                        )}
                        {ks?.flags?.authFailed && (
                            <span
                                style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    color: 'var(--slate-500)',
                                    background: 'rgba(100,116,139,0.15)',
                                    border: '1px solid rgba(100,116,139,0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                                title="Authentication failed on last probe"
                            >
                                AUTH FAILED
                            </span>
                        )}
                        {ks &&
                            !ks.flags.circuitOpen &&
                            !ks.flags.rateLimited &&
                            !ks.flags.authFailed && (
                                <span
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                        fontSize: '0.6rem',
                                        fontWeight: 600,
                                        color: 'var(--success)',
                                        background: 'var(--success-tint)',
                                        border: '1px solid rgba(16,185,129,0.15)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                    title="Circuit breaker is closed — normal operation"
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: 'var(--success)',
                                            display: 'inline-block',
                                        }}
                                    />
                                    CB OK
                                </span>
                            )}
                    </div>
                </div>
            </div>

            <div className="provider-card-metric-grid">
                <div className="provider-card-metric-cell">
                    <div className="provider-metric-label">{t('provider.latency_label')}</div>
                    <div className="provider-metric-value">
                        {apiKey.stats?.avgLatency
                            ? `${Math.round(apiKey.stats.avgLatency)}ms`
                            : '\u2014'}
                    </div>
                </div>
                <div className="provider-card-metric-cell provider-card-metric-cell--bordered">
                    <div className="provider-metric-label">{t('provider.tps_label')}</div>
                    <div className="provider-metric-value">
                        {typeof apiKey.stats?.extended?.latencyBreakdown?.tokensPerSec === 'number'
                            ? apiKey.stats.extended.latencyBreakdown.tokensPerSec.toFixed(1)
                            : '\u2014'}
                    </div>
                </div>
                <div className="provider-card-metric-cell">
                    <div className="provider-metric-label">{t('provider.reliability_label')}</div>
                    <div className="provider-metric-value">
                        {apiKey.stats?.successCount || apiKey.stats?.errorCount
                            ? `${Math.round((apiKey.stats.successCount / (apiKey.stats.successCount + apiKey.stats.errorCount)) * 100)}%`
                            : 'N/A'}
                    </div>
                </div>
            </div>

            {ks && <ProviderHealthBar healthScore={ks.healthScore} />}
            <ProviderUsageBars apiKey={apiKey} />

            <div
                className="provider-inline-flex"
                style={{ justifyContent: 'space-between', marginTop: '0.75rem' }}
            >
                {modelCount > 0 && (
                    <span className="provider-model-badge">
                        <Layers size={12} /> {modelCount} model{modelCount > 1 ? 's' : ''}
                    </span>
                )}
                <ProviderCardActions
                    status={apiKey.status}
                    probeLoading={probeLoading}
                    isChecking={isChecking}
                    onToggleStatus={() => onToggleStatus(apiKey.id)}
                    onProbe={handleProbe}
                    onCheckHealth={() => onCheckHealth(apiKey.id)}
                    onSandbox={() => onSelect(apiKey, 'sandbox')}
                    onRemove={() => setConfirmRemove(true)}
                    confirmRemove={confirmRemove}
                    onConfirmRemove={() => onRemoveKey(apiKey.id)}
                    onCancelRemove={() => setConfirmRemove(false)}
                />
            </div>

            {confirmRemove && (
                <ConfirmRemoveBanner
                    onCancel={() => setConfirmRemove(false)}
                    onConfirm={() => onRemoveKey(apiKey.id)}
                />
            )}
            {probeResult && <ProbeResultSection probeResult={probeResult} />}
            <QuickTestSection apiKey={apiKey} />
        </motion.div>
    );
};

export default ProviderCard;
