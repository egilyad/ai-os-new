import React from 'react';
import { FlaskConical } from 'lucide-react';
import { CONFIG } from '../../kernel/instances';
import { DemoBadge } from './DemoBadge';

interface DemoGateProps {
    /** Display name of the demo feature, e.g. "Deploy to Production". */
    title: string;
    children: React.ReactNode;
}

/**
 * Feature-flag gate for @deprecated MOCK panels. When featureFlags.mockServices.enabled
 * is false, renders a "disabled" placeholder instead of the simulated UI. When enabled,
 * renders the Demo badge above the panel content.
 */
export const DemoGate: React.FC<DemoGateProps> = ({ title, children }) => {
    const enabled = CONFIG?.featureFlags?.mockServices?.enabled ?? true;

    if (!enabled) {
        return (
            <div
                style={{
                    padding: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    color: 'var(--slate-500)',
                    textAlign: 'center',
                    height: '100%',
                    justifyContent: 'center',
                }}
            >
                <FlaskConical size={32} style={{ opacity: 0.35 }} aria-hidden="true" />
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--slate-400)' }}>{title}</div>
                <div style={{ fontSize: 12, maxWidth: 380 }}>
                    This demo feature is disabled (feature flag
                    <code style={{ color: 'var(--warning)', margin: '0 4px' }}>mockServices.enabled</code>
                    is off). Enable it in Settings → Feature Flags.
                </div>
            </div>
        );
    }

    return (
        <>
            <DemoBadge />
            {children}
        </>
    );
};

export default DemoGate;
