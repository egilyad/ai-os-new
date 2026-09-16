import React from 'react';
import { Network, Zap } from 'lucide-react';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { FREE_TIER_LIMITS } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { StatusBadge, latencyColor } from '../Common/status-vocabulary';
import { SectionTitle, EmptyState, QuotaDisplay } from './DashboardComponents';
import { flexColGap3, flexCenterGap3 } from '../../styles/common';
import type { ApiKey } from '../../kernel/types/metrics-types';

interface InferenceMeshSectionProps {
    keys: ApiKey[];
    onNavigate: (page: string) => void;
}

export const InferenceMeshSection: React.FC<InferenceMeshSectionProps> = ({ keys, onNavigate }) => {
    const { t } = useTranslation();

    return (
        <div
            className="glass-panel"
            style={{
                padding: '1.5rem',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
            }}
        >
            <SectionTitle
                icon={<Network size={20} color="#3b82f6" />}
                title={t('dashboard.inference_mesh')}
                action={t('dashboard.configure')}
                onAction={() => onNavigate('keys')}
            />
            <div style={flexColGap3}>
                {keys.map((key) => (
                    <div
                        key={key.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 0.7fr 0.7fr 1fr 0.6fr auto',
                            gap: '0.75rem',
                            alignItems: 'center',
                            padding: '1rem',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.03)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                        }}
                    >
                        <div style={flexCenterGap3}>
                            <ProviderIcon provider={key.provider} size={18} />
                            <div>
                                <div
                                    style={{
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        color: 'var(--slate-200)',
                                    }}
                                >
                                    {key.label}
                                </div>
                                <div
                                    style={{
                                        color: 'var(--slate-500)',
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginTop: '0.1rem',
                                    }}
                                >
                                    {key.provider}
                                </div>
                            </div>
                        </div>
                        <div>
                            <StatusBadge status={key.status} size="sm" />
                        </div>
                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: 'var(--slate-400)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Zap size={12} color={latencyColor(key.latency || 0)} />{' '}
                            {key.latency
                                ? `${key.latency}${t('chat.latency_ms')}`
                                : t('dashboard.dash')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                            {key.stats?.extended?.usageToday ? (
                                <QuotaDisplay
                                    used={key.stats.extended.usageToday.requests}
                                    limit={FREE_TIER_LIMITS[key.provider]?.requestsPerDay}
                                />
                            ) : (
                                t('dashboard.dash')
                            )}
                        </div>
                        <div
                            style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}
                        >{`${key.stats?.successCount || 0} ${t('dashboard.reqs_unit')}`}</div>
                        <button
                            onClick={() => onNavigate('keys')}
                            style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: 8,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                            }}
                            aria-label={`${t('dashboard.inspect_aria')} ${key.label}`}
                        >
                            {t('dashboard.inspect')}
                        </button>
                    </div>
                ))}
                {keys.length === 0 && (
                    <EmptyState
                        text={t('dashboard.no_providers')}
                        action={t('dashboard.connect_provider')}
                        onAction={() => onNavigate('keys')}
                    />
                )}
            </div>
        </div>
    );
};
