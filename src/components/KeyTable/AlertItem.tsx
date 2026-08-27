import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { ProviderAlert } from '../../kernel/types/metrics-types';

const AlertItem = React.memo<{ alert: ProviderAlert }>(({ alert }) => (
    <div
        style={{
            padding: '0.75rem',
            background:
                alert.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${alert.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        }}
    >
        <AlertCircle
            size={16}
            color={alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}
            aria-hidden="true"
        />
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{alert.message}</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>
                {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
        </div>
    </div>
));

export default AlertItem;
