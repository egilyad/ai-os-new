import { CheckCircle, XCircle } from 'lucide-react';
import type { ServiceObsInfo } from '../../kernel/contracts/obs-gaps';

interface Props {
    service: ServiceObsInfo;
}

const ObsServiceRow: React.FC<Props> = ({ service }) => {
    const checks = [
        service.hasEvents,
        service.hasLogger,
        service.hasLifecycle,
        service.hasHealthCheck,
        service.hasTracing,
    ];
    const passed = checks.filter(Boolean).length;
    const total = checks.length;

    return (
        <div
            style={{
                padding: '0.4rem 0.65rem',
                borderRadius: 7,
                background: 'rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            <span
                style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    color: 'var(--slate-200)',
                    fontFamily: 'monospace',
                }}
            >
                {service.name}
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
                {service.hasEvents ? (
                    <CheckCircle size={10} color="#10b981" />
                ) : (
                    <XCircle size={10} color="#ef4444" />
                )}
                {service.hasLogger ? (
                    <CheckCircle size={10} color="#10b981" />
                ) : (
                    <XCircle size={10} color="#ef4444" />
                )}
                {service.hasLifecycle ? (
                    <CheckCircle size={10} color="#10b981" />
                ) : (
                    <XCircle size={10} color="#ef4444" />
                )}
                {service.hasHealthCheck ? (
                    <CheckCircle size={10} color="#10b981" />
                ) : (
                    <XCircle size={10} color="#64748b" />
                )}
                {service.hasTracing ? (
                    <CheckCircle size={10} color="#10b981" />
                ) : (
                    <XCircle size={10} color="#64748b" />
                )}
            </div>
            <span
                style={{
                    fontSize: '0.6rem',
                    color: passed === total ? '#10b981' : '#f59e0b',
                    minWidth: 28,
                    textAlign: 'right',
                    fontWeight: 700,
                }}
            >
                {passed}/{total}
            </span>
            {service.notes && (
                <span style={{ fontSize: '0.6rem', color: 'var(--warning)' }}>{service.notes}</span>
            )}
        </div>
    );
};

export default ObsServiceRow;
