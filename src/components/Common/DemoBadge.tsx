import React from 'react';
import { FlaskConical } from 'lucide-react';
import { CONFIG } from '../../kernel/instances';

interface DemoBadgeProps {
    title?: string;
    body?: string;
}

/**
 * Amber "Demo mode" banner shown on panels backed by @deprecated MOCK services.
 * Reads the mockServices feature flag — renders nothing when the flag is disabled
 * (panels then show a placeholder via <DemoGate/> instead).
 */
export const DemoBadge: React.FC<DemoBadgeProps> = ({ title, body }) => {
    const enabled = CONFIG?.featureFlags?.mockServices?.enabled ?? true;
    if (!enabled) return null;

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(245,158,11,0.35)',
                background:
                    'linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.03) 100%)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                color: 'var(--warning)',
                lineHeight: 1.45,
            }}
        >
            <FlaskConical
                size={18}
                color="#f59e0b"
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div>
                <span style={{ fontWeight: 800, color: 'var(--warning)' }}>
                    {title ?? 'Demo mode — simulated backend'}:
                </span>{' '}
                {body ??
                    'This panel uses a simulated backend. No real API calls are made — data is mock.'}
            </div>
        </div>
    );
};

/** Reads the mockServices feature flag. */
export const isMockServicesEnabled = (): boolean =>
    CONFIG?.featureFlags?.mockServices?.enabled ?? true;

export default DemoBadge;
