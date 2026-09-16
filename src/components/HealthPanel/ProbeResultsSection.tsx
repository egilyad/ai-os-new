import { Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ProbeResult } from '../../kernel/contracts/probe';
import type { KeyEntry } from '../../kernel/instances';

const STATUS_COLORS: Record<string, string> = {
    ready: '#10b981',
    degraded: '#f59e0b',
    limited: '#f97316',
    broken: '#ef4444',
    unknown: '#64748b',
};

interface ProbeResultsSectionProps {
    probeResults: Map<string, ProbeResult>;
    expandedProbe: string | null;
    setExpandedProbe: (id: string | null) => void;
    keys: KeyEntry[];
}

export const ProbeResultsSection: React.FC<ProbeResultsSectionProps> = ({
    probeResults,
    expandedProbe,
    setExpandedProbe,
    keys,
}) => {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1.25rem 1.5rem',
                borderRadius: 16,
                background: 'rgba(59,130,246,0.03)',
                border: '1px solid rgba(59,130,246,0.1)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    paddingBottom: '0.6rem',
                }}
            >
                <Activity size={16} color="#3b82f6" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {t('health.probe_title')}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                    {t('health.probe_ready', {
                        ready: Array.from(probeResults.values()).filter((r) => r.status === 'ready')
                            .length,
                        total: probeResults.size,
                    })}
                    <span style={{ marginLeft: 8, color: 'var(--slate-600)' }}>
                        {t('health.probe_active_table', {
                            count: keys.filter((k) => k.status === 'active').length,
                        })}
                    </span>
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {Array.from(probeResults.entries()).map(([id, r]) => {
                    const key = keys.find((k) => k.id === id);
                    const c = STATUS_COLORS[r.status] || '#64748b';
                    const isExpanded = expandedProbe === id;
                    const preview = r.responseContent
                        ? r.responseContent.slice(0, 60) +
                          (r.responseContent.length > 60 ? '…' : '')
                        : undefined;
                    return (
                        <div key={id}>
                            <div
                                onClick={() => setExpandedProbe(isExpanded ? null : id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    borderRadius: isExpanded ? '10px 10px 0 0' : 10,
                                    background: 'rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem',
                                    border: isExpanded
                                        ? '1px solid rgba(59,130,246,0.15)'
                                        : '1px solid transparent',
                                    borderBottom: isExpanded ? 'none' : '1px solid transparent',
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: c,
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        color: 'var(--slate-200)',
                                        fontWeight: 600,
                                        minWidth: 90,
                                        flexShrink: 0,
                                    }}
                                >
                                    {key?.label || r.provider || id}
                                </span>
                                <span
                                    style={{
                                        color: c,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        fontSize: '0.68rem',
                                        minWidth: 45,
                                        flexShrink: 0,
                                    }}
                                >
                                    {r.status}
                                </span>
                                {r.latency > 0 && (
                                    <span
                                        style={{
                                            color: 'var(--slate-600)',
                                            fontSize: '0.72rem',
                                            minWidth: 40,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {r.latency}ms
                                    </span>
                                )}
                                {preview ? (
                                    <span
                                        style={{
                                            color: 'var(--slate-400)',
                                            fontSize: '0.75rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        {preview}
                                    </span>
                                ) : r.error ? (
                                    <span
                                        style={{
                                            color: 'var(--error)',
                                            fontSize: '0.72rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                        title={r.error}
                                    >
                                        {r.error}
                                    </span>
                                ) : (
                                    <span
                                        style={{
                                            color: 'var(--slate-500)',
                                            fontSize: '0.72rem',
                                            fontStyle: 'italic',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        {t('health.no_response')}
                                    </span>
                                )}
                                <span
                                    style={{
                                        color: 'var(--slate-600)',
                                        fontSize: '0.65rem',
                                        flexShrink: 0,
                                        marginLeft: 4,
                                    }}
                                >
                                    {isExpanded ? '▲' : '▼'}
                                </span>
                            </div>
                            {isExpanded && (
                                <div
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '0 0 10px 10px',
                                        background: 'rgba(0,0,0,0.15)',
                                        border: '1px solid rgba(59,130,246,0.15)',
                                        borderTop: 'none',
                                        fontSize: '0.82rem',
                                        color: 'var(--slate-300)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {r.responseContent || (
                                        <span
                                            style={{
                                                color: 'var(--slate-500)',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {t('health.no_response')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
