import React from 'react';
import { Box } from 'lucide-react';
import { pctColor } from '../Common/status-vocabulary';
import { useTranslation } from '../../i18n/useTranslation';

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function QuickActionBtn({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.5rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--slate-400)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#94a3b8';
            }}
        >
            {icon} {label}
        </button>
    );
}

export const SectionTitle = ({
    icon,
    title,
    action,
    onAction,
}: {
    icon: React.ReactNode;
    title: string;
    action?: string;
    onAction?: () => void;
}) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
        }}
    >
        <h2
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '1.1rem',
                fontWeight: 800,
                margin: 0,
                color: 'var(--slate-50)',
            }}
        >
            <span aria-hidden="true">{icon}</span> {title}
        </h2>
        {action && (
            <button
                onClick={onAction}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    transition: 'color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#60a5fa')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#3b82f6')}
                aria-label={`${action} for ${title}`}
            >
                {action}
            </button>
        )}
    </div>
);

export const EmptyState = ({
    text,
    action,
    onAction,
}: {
    text: string;
    action?: string;
    onAction?: () => void;
}) => (
    <div
        style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--slate-500)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 12,
            fontSize: '0.9rem',
        }}
    >
        <Box size={32} opacity={0.3} style={{ margin: '0 auto 1rem' }} aria-hidden="true" />
        <div>{text}</div>
        {action && (
            <button
                onClick={onAction}
                style={{
                    marginTop: '1.25rem',
                    padding: '0.6rem 1rem',
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                }}
                aria-label={action}
            >
                {action}
            </button>
        )}
    </div>
);

export const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
};

export const QuotaDisplay = ({ used, limit }: { used: number; limit: number | undefined }) => {
    const { t } = useTranslation();
    if (!limit || limit === 0) return <>{`${formatNumber(used)} ${t('common.req_unit')}`}</>;
    const pct = Math.round((used / limit) * 100);
    return (
        <>
            <span style={{ color: pctColor(pct) }}>{formatNumber(used)}</span> /{' '}
            {formatNumber(limit)} {t('common.req_unit')}
        </>
    );
};

export const summarizeEvent = (
    data: Record<string, unknown> | string | null | undefined,
    t: TranslateFn,
): string => {
    if (!data) return t('dashboard.summary_no_payload');
    if (typeof data === 'string') return data;
    if (data.message) return String(data.message);
    if (data.provider)
        return `${String(data.provider)}${data.model ? ` / ${String(data.model)}` : ''}`;
    if (data.requestId) return `Req ID: ${String(data.requestId)}`;
    try {
        return JSON.stringify(data).slice(0, 100) + '...';
    } catch {
        return t('dashboard.summary_complex_payload');
    }
};
