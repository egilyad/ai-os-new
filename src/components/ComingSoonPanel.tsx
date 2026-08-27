import React from 'react';
import ModuleInfo from './ModuleInfo';
import { Construction } from 'lucide-react';

interface Props {
    routeId?: string;
    serviceName?: string;
}

const ComingSoonPanel: React.FC<Props> = ({ routeId, serviceName }) => {
    const route = routeId || 'unknown';
    const svc = serviceName || route;

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                padding: 32,
                overflow: 'auto',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <ModuleInfo
                moduleKey={route as unknown as Parameters<typeof ModuleInfo>[0]['moduleKey']}
            />

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    maxWidth: 400,
                    textAlign: 'center',
                }}
            >
                <Construction size={48} color="#f59e0b" />
                <h2 style={{ color: 'var(--slate-50)', margin: 0, fontSize: 18, fontWeight: 700 }}>
                    {route.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </h2>
                <p style={{ color: 'var(--slate-500)', margin: 0, fontSize: 13 }}>
                    This panel is coming soon. It will display data from{' '}
                    <code style={{ color: '#a5b4fc', fontSize: 11 }}>{svc}</code>.
                </p>
                <div
                    style={{
                        background: 'rgba(15,23,42,0.6)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        fontSize: 11,
                        color: 'var(--slate-400)',
                        fontFamily: 'monospace',
                        maxWidth: '100%',
                        overflow: 'auto',
                    }}
                >
                    Route: <span style={{ color: '#22d3ee' }}>/{route}</span>
                    <br />
                    Service: <span style={{ color: '#34d399' }}>{svc}</span>
                </div>
            </div>
        </div>
    );
};

export default ComingSoonPanel;
