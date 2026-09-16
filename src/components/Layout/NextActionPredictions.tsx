import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';

interface Prediction {
    id: string;
    label: string;
    path: string;
    reason: string;
    icon: string;
}

const ROUTE_PREDICTIONS: Record<string, Prediction[]> = {
    '': [
        {
            id: 'start-debate',
            label: 'nav.start_debate',
            path: '/debate',
            reason: 'prediction.start_debate',
            icon: '🎙',
        },
        {
            id: 'add-key',
            label: 'nav.providers',
            path: '/keys',
            reason: 'prediction.add_key',
            icon: '🔑',
        },
        {
            id: 'open-sandbox',
            label: 'nav.tools',
            path: '/tools',
            reason: 'prediction.open_sandbox',
            icon: '🧪',
        },
    ],
    providers: [
        {
            id: 'probe-all',
            label: 'nav.health',
            path: '/health',
            reason: 'prediction.probe_all',
            icon: '📡',
        },
        {
            id: 'add-key',
            label: 'nav.connectors',
            path: '/connectors',
            reason: 'prediction.add_key',
            icon: '🔑',
        },
        {
            id: 'view-routing',
            label: 'nav.router_trace',
            path: '/router-trace',
            reason: 'prediction.view_routing',
            icon: '🔄',
        },
    ],
    debate: [
        {
            id: 'live-debate',
            label: 'nav.debate_live',
            path: '/debate-live',
            reason: 'prediction.live_debate',
            icon: '🎬',
        },
        {
            id: 'debate-history',
            label: 'nav.debate_history',
            path: '/debate-history',
            reason: 'prediction.debate_history',
            icon: '📋',
        },
        {
            id: 'audience',
            label: 'nav.audience',
            path: '/audience',
            reason: 'prediction.audience',
            icon: '👥',
        },
    ],
    memory: [
        {
            id: 'memory-palace',
            label: 'nav.memory_palace',
            path: '/memory-palace',
            reason: 'prediction.memory_palace',
            icon: '🏛',
        },
        {
            id: 'memory-search',
            label: 'nav.memory_search',
            path: '/diagnostics/memory',
            reason: 'prediction.memory_search',
            icon: '🔍',
        },
        {
            id: 'export-memory',
            label: 'nav.memory_export_import',
            path: '/memory-export-import',
            reason: 'prediction.export_memory',
            icon: '📤',
        },
    ],
    health: [
        {
            id: 'traces',
            label: 'nav.traces',
            path: '/debugger',
            reason: 'prediction.traces',
            icon: '📊',
        },
        {
            id: 'logs',
            label: 'nav.log_browser',
            path: '/logs',
            reason: 'prediction.logs',
            icon: '📝',
        },
    ],
    settings: [
        {
            id: 'appearance',
            label: 'nav.appearance',
            path: '/settings',
            reason: 'prediction.appearance',
            icon: '🎨',
        },
        {
            id: 'notifications',
            label: 'nav.notifications',
            path: '/settings',
            reason: 'prediction.notifications',
            icon: '🔔',
        },
        {
            id: 'keyboard',
            label: 'nav.keyboard_shortcuts',
            path: '/settings',
            reason: 'prediction.keyboard',
            icon: '⌨',
        },
    ],
};

export const NextActionPredictions: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [visible, setVisible] = useState(true);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const routeSegment = location.pathname.split('/')[1] || '';
    const predictions = ROUTE_PREDICTIONS[routeSegment] || ROUTE_PREDICTIONS[''];

    useEffect(() => {
        setVisible(true);
    }, [routeSegment]);

    const filtered = predictions!.filter((p) => !dismissed.has(p.id));
    if (!visible || filtered.length === 0) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                background: 'rgba(59,130,246,0.08)',
                borderRadius: 8,
                margin: '0 0.5rem',
                flexWrap: 'wrap',
            }}
        >
            <span
                style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted, #64748b)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                }}
            >
                {t('layout.next_actions')}:
            </span>
            {filtered.map((p) => (
                <button
                    key={p.id}
                    onClick={() => navigate(p.path)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        padding: '0.2rem 0.6rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary, #cbd5e1)',
                        fontSize: '0.72rem',
                        transition: 'all 0.15s',
                    }}
                    title={t(p.reason)}
                >
                    <span style={{ fontSize: '0.8rem' }}>{p.icon}</span>
                    <span>{t(p.label)}</span>
                </button>
            ))}
            <button
                onClick={() =>
                    setDismissed((prev) => new Set([...prev, ...filtered.map((p) => p.id)]))
                }
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.3rem',
                    opacity: 0.6,
                }}
                aria-label={t('common.aria.dismiss')}
            >
                ✕
            </button>
        </div>
    );
};
