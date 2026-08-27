import { Layers, Loader2, Server } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { getStatusColor } from '../Common/status-vocabulary';
import { sectionHeaderRow, textSmSecondaryMargin } from '../../styles/common';

interface KernelServicesSectionProps {
    services: Array<{ name: string; status: string }>;
    isLoading: boolean;
}

export const KernelServicesSection: React.FC<KernelServicesSectionProps> = ({
    services,
    isLoading,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '2rem',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div style={sectionHeaderRow}>
                <Layers size={22} color="#3b82f6" aria-hidden="true" />
                <h3
                    style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        margin: 0,
                        color: 'var(--slate-50)',
                    }}
                >
                    {t('health.kernel_services')}
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {isLoading && services.length === 0 ? (
                    <div
                        style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--slate-500)',
                            fontSize: '0.85rem',
                        }}
                    >
                        <Loader2 size={20} className="spinning" style={{ margin: '0 auto 8px' }} />
                        {t('health.loading_services') ?? 'Loading services...'}
                    </div>
                ) : (
                    services.map((svc) => {
                        const statusColor = getStatusColor(svc.status);
                        return (
                            <div
                                key={svc.name}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.03)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <Server size={18} color="#64748b" aria-hidden="true" />
                                    <div>
                                        <div
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 700,
                                                color: 'var(--slate-200)',
                                            }}
                                        >
                                            {svc.name}
                                        </div>
                                        <div style={textSmSecondaryMargin}>
                                            {t('health.core_microservice')}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '0.4rem 0.8rem',
                                        background: `${statusColor}15`,
                                        borderRadius: 8,
                                        border: `1px solid ${statusColor}30`,
                                    }}
                                    aria-label={t('health.status_aria', {
                                        status: svc.status,
                                    })}
                                >
                                    <div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            background: statusColor,
                                            boxShadow: `0 0 5px ${statusColor}`,
                                        }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: statusColor,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {svc.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
