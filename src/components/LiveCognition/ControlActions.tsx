import { Activity } from 'lucide-react';
import { Button } from '../Common';

interface Props {
    onInitializeRequest: () => void;
    onReloadRuntime: () => void;
    onManualRoute: () => void;
    onClearLogs: () => void;
    onCheckAllHealth: () => void;
}

const ControlActions: React.FC<Props> = ({
    onInitializeRequest,
    onReloadRuntime,
    onManualRoute,
    onClearLogs,
    onCheckAllHealth,
}) => (
    <div
        style={{
            padding: '1.5rem',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(10px)',
        }}
    >
        <h3
            style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <Activity size={18} color="#3b82f6" aria-hidden="true" /> Control Plane Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Button
                variant="primary"
                onClick={onInitializeRequest}
                aria-label="Initialize a test request"
            >
                Initialize Request
            </Button>
            <Button
                variant="secondary"
                onClick={onReloadRuntime}
                aria-label="Reload runtime configuration"
            >
                Reload Runtime
            </Button>
            <Button
                variant="secondary"
                onClick={onManualRoute}
                aria-label="Manually trigger routing"
            >
                Manual Routing
            </Button>
            <Button variant="secondary" onClick={onClearLogs} aria-label="Clear event logs">
                Clear Logs
            </Button>
        </div>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginTop: '0.75rem',
            }}
        >
            <Button
                variant="secondary"
                onClick={onCheckAllHealth}
                aria-label="Check health of all providers"
            >
                Check All Providers
            </Button>
        </div>
    </div>
);

export default ControlActions;
