import { SEVERITY_CONFIG } from './sre-constants';
import type { SREAlert } from './sre-constants';

interface Props {
    alert: SREAlert;
}

const AlertItem: React.FC<Props> = ({ alert: a }) => {
    const cfg = SEVERITY_CONFIG[a.severity]!;
    return (
        <div
            style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                alignItems: 'flex-start',
            }}
        >
            <span style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-200)', fontWeight: 600 }}>
                    {a.message}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                    {new Date(a.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};

export default AlertItem;
