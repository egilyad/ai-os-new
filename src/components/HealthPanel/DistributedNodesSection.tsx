import { Globe, Network } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { sectionHeaderRow, textSmSecondaryMargin } from '../../styles/common';
import type { KeyEntry } from '../../kernel/instances';
import type { Bee } from './health-panel-utils';

interface DistributedNodesSectionProps {
    keys: KeyEntry[];
    bees: Bee[];
    totalActive: number;
}

export const DistributedNodesSection: React.FC<DistributedNodesSectionProps> = ({
    keys,
    bees,
    totalActive,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                position: 'relative',
                padding: '2rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
            }}
        >
            <div style={sectionHeaderRow}>
                <Network size={22} color="#10b981" aria-hidden="true" />
                <h3
                    style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        margin: 0,
                        color: 'var(--slate-50)',
                    }}
                >
                    {t('health.distributed_nodes')}
                </h3>
                <div
                    style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        background: 'rgba(245,158,11,0.2)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 20,
                        color: 'var(--warning)',
                    }}
                >
                    🐝 {t('health.active_workers', { count: totalActive })}
                </div>
            </div>

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
                {bees.map((bee) => {
                    const keyObj = keys.find((k) => k.id === bee.providerId);
                    const latency = keyObj?.latency ?? 0;
                    return (
                        <div
                            key={bee.id}
                            style={{
                                position: 'absolute',
                                left: `${bee.x}%`,
                                top: `${bee.y}%`,
                                width: 24,
                                height: 24,
                                animation: `beeFloat 3s ease-in-out ${bee.delay}s infinite, beeWobble 0.5s ease-in-out ${bee.delay}s infinite`,
                                filter: 'drop-shadow(0 0 4px gold)',
                                cursor: 'default',
                                pointerEvents: 'auto',
                                fontSize: 18,
                            }}
                            title={t('health.bee_title', {
                                provider: keyObj?.provider || 'Unknown',
                                latency: latency ? `${latency}ms` : 'active',
                            })}
                        >
                            🐝
                        </div>
                    );
                })}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    position: 'relative',
                    zIndex: 2,
                }}
            >
                {keys.map((key) => {
                    const isOnline = key.status === 'active';
                    return (
                        <div
                            key={key.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.03)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'center',
                                }}
                            >
                                <ProviderIcon provider={key.provider} size={20} />
                                <div>
                                    <div
                                        style={{
                                            fontSize: '0.95rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-200)',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {key.provider}
                                    </div>
                                    <div style={textSmSecondaryMargin}>
                                        {key.model || t('health.auto_routing')}
                                    </div>
                                </div>
                            </div>
                            <div
                                style={{
                                    textAlign: 'right',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: 4,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        color: isOnline ? '#10b981' : '#ef4444',
                                    }}
                                >
                                    {key.latency
                                        ? `${key.latency}ms`
                                        : isOnline
                                          ? t('health.sub_10ms')
                                          : t('health.offline')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    {t('health.ping_latency')}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {keys.length === 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3rem 0',
                            color: 'var(--slate-500)',
                            gap: '1rem',
                        }}
                    >
                        <Globe size={32} opacity={0.3} aria-hidden="true" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {t('health.no_external_nodes')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
