import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

/**
 * Compact "Experimental" pill badge rendered above cognitive-aux / research panels.
 * Driven by the `experimental` RouteMeta flag (see src/types/routing.ts) — P1.21.
 */
export const ExperimentalBadge: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div
            role="status"
            title={t('experimental.badge_title')}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid rgba(167,139,250,0.4)',
                background:
                    'linear-gradient(90deg, rgba(167,139,250,0.14) 0%, rgba(139,92,246,0.04) 100%)',
                marginBottom: '0.75rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#c4b5fd',
            }}
        >
            <FlaskConical size={13} color="#a78bfa" aria-hidden="true" />
            {t('experimental.badge')}
        </div>
    );
};

export default ExperimentalBadge;
