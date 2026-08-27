import { Bug } from 'lucide-react';
import type { ErrorBreakdown } from '../../kernel/types/metrics-types';
import { glassCard, flexCenterGap2Mb1 } from '../../styles/common';

interface Props {
    errorBreakdown: ErrorBreakdown;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const ERROR_TYPES = [
    { labelKey: 'overview.error_rate_limit', field: 'rateLimit' as const, color: 'var(--error)' },
    { labelKey: 'overview.error_timeout', field: 'timeout' as const, color: 'var(--warning)' },
    { labelKey: 'overview.error_server', field: 'serverError' as const, color: '#ec4899' },
    { labelKey: 'overview.error_validation', field: 'validationError' as const, color: '#a855f7' },
];

const ErrorBreakdownSection: React.FC<Props> = ({ errorBreakdown, t }) => (
    <div style={glassCard}>
        <div style={flexCenterGap2Mb1}>
            <Bug size={14} color="#ef4444" aria-hidden="true" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {t('overview.error_breakdown')}
            </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {ERROR_TYPES.map((e) => (
                <div
                    key={e.labelKey}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                    }}
                >
                    <span style={{ color: 'var(--text-muted)' }}>{t(e.labelKey)}</span>
                    <span style={{ color: e.color, fontWeight: 700 }}>
                        {errorBreakdown[e.field] || 0}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

export default ErrorBreakdownSection;
