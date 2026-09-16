import { motion } from 'framer-motion';
import { PowerOff, Power, Copy, Check, RotateCcw } from 'lucide-react';
import type { KeyExtendedStats } from '../../kernel/types/metrics-types';
import type { ApiKey } from '../../types/metrics';
import { flexGap2 } from '../../styles/common';
import { Button } from '../Common';

interface Props {
    stats: KeyExtendedStats;
    apiKey: ApiKey;
    copied: boolean;
    resetting: boolean;
    onToggleStatus: () => void;
    onCopyKey: () => void;
    onResetMetrics: () => void;
    onSetSLA: (sla: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const SLA_MODES = [
    { id: 'LOW_LATENCY', labelKey: 'overview.sla_low_latency' },
    { id: 'HIGH_QUALITY', labelKey: 'overview.sla_high_quality' },
    { id: 'BALANCED', labelKey: 'overview.sla_balanced' },
    { id: 'FREE_FIRST', labelKey: 'overview.sla_free_first' },
] as const;

const OverviewActionHeader: React.FC<Props> = ({
    stats,
    apiKey,
    copied,
    resetting,
    onToggleStatus,
    onCopyKey,
    onResetMetrics,
    onSetSLA,
    t,
}) => {
    const stateColor = stats.state === 'HEALTHY' ? '#10b981' : '#ef4444';

    return (
        <div
            style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <span
                    style={{
                        padding: '0.3rem 0.8rem',
                        background:
                            stats.state === 'HEALTHY'
                                ? 'rgba(16,185,129,0.1)'
                                : 'rgba(239,68,68,0.1)',
                        color: stateColor,
                        borderRadius: 100,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        border: `1px solid ${stats.state === 'HEALTHY' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                >
                    {stats.state === 'HEALTHY' ? 'HEALTHY' : stats.state}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1rem' }}>
                    {SLA_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => onSetSLA(mode.id)}
                            style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.6rem',
                                background:
                                    stats.activeSLA === mode.id
                                        ? 'rgba(96,165,250,0.2)'
                                        : 'transparent',
                                color:
                                    stats.activeSLA === mode.id ? '#60a5fa' : 'var(--text-muted)',
                                border: `1px solid ${stats.activeSLA === mode.id ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}
                            aria-label={t('overview.set_sla_aria', { mode: t(mode.labelKey) })}
                        >
                            {t(mode.labelKey)}
                        </button>
                    ))}
                </div>
            </div>
            <div style={flexGap2}>
                <Button
                    variant="ghost"
                    onClick={onToggleStatus}
                    aria-label={t(
                        apiKey.status === 'active'
                            ? 'overview.disable_provider'
                            : 'overview.enable_provider',
                    )}
                >
                    {apiKey.status === 'active' ? (
                        <PowerOff size={16} aria-hidden="true" />
                    ) : (
                        <Power size={16} aria-hidden="true" />
                    )}
                    {t(apiKey.status === 'active' ? 'overview.disable' : 'overview.enable')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onCopyKey}
                    aria-label={t('overview.copy_key_aria')}
                >
                    {copied ? (
                        <Check size={16} color="#10b981" aria-hidden="true" />
                    ) : (
                        <Copy size={16} aria-hidden="true" />
                    )}
                    {copied ? t('overview.copied') : t('overview.copy_key')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onResetMetrics}
                    disabled={resetting}
                    aria-label={t('overview.reset_metrics_aria')}
                >
                    {resetting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        >
                            <RotateCcw size={16} aria-hidden="true" />
                        </motion.div>
                    ) : (
                        <RotateCcw size={16} aria-hidden="true" />
                    )}
                    {t('overview.reset_metrics')}
                </Button>
            </div>
        </div>
    );
};

export default OverviewActionHeader;
