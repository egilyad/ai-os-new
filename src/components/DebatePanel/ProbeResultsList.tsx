import type { ProbeResult } from '../../kernel/contracts/probe';
import { textSecondaryItalic } from '../../styles/common';

const STATUS_COLORS: Record<string, string> = {
    ready: '#10b981',
    degraded: '#f59e0b',
    limited: '#f97316',
    broken: '#ef4444',
    unknown: '#64748b',
};

interface ProbeResultsListProps {
    probeResults: Map<string, ProbeResult>;
    availableAgents: Array<{ id: string; label: string }>;
    expandedProbe: string | null;
    onToggleProbe: (id: string | null) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const ProbeResultsList: React.FC<ProbeResultsListProps> = ({
    probeResults,
    availableAgents,
    expandedProbe,
    onToggleProbe,
    t,
}) => {
    if (probeResults.size === 0) return null;

    return (
        <div
            style={{
                marginTop: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
            }}
        >
            <div
                style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--slate-400)',
                    marginBottom: '0.25rem',
                }}
            >
                {t('debate.probe_title')}
                <span style={{ marginLeft: 8, color: 'var(--slate-500)', fontWeight: 400 }}>
                    {Array.from(probeResults.values()).filter((r) => r.status === 'ready').length}/
                    {probeResults.size} {t('debate.probe_ready')}
                </span>
            </div>
            {Array.from(probeResults.entries()).map(([id, r]) => {
                const node = availableAgents.find((a) => a.id === id);
                const name = node?.label || id;
                const c = STATUS_COLORS[r.status] || '#64748b';
                const isExpanded = expandedProbe === id;
                const preview = r.responseContent
                    ? r.responseContent.slice(0, 50) +
                      (r.responseContent.length > 50 ? '\u2026' : '')
                    : undefined;
                return (
                    <div key={id}>
                        <div
                            onClick={() => onToggleProbe(isExpanded ? null : id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '7px 10px',
                                borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                                background: 'rgba(0,0,0,0.2)',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                border: isExpanded
                                    ? '1px solid rgba(168,85,247,0.12)'
                                    : '1px solid transparent',
                                borderBottom: isExpanded ? 'none' : '1px solid transparent',
                            }}
                        >
                            <div
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: c,
                                    flexShrink: 0,
                                }}
                            />
                            <span
                                style={{
                                    color: 'var(--slate-200)',
                                    fontWeight: 600,
                                    minWidth: 80,
                                    flexShrink: 0,
                                }}
                            >
                                {name}
                            </span>
                            <span
                                style={{
                                    color: c,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.65rem',
                                    minWidth: 40,
                                    flexShrink: 0,
                                }}
                            >
                                {r.status}
                            </span>
                            {r.latency > 0 && (
                                <span
                                    style={{
                                        color: 'var(--slate-600)',
                                        fontSize: '0.7rem',
                                        minWidth: 35,
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
                                        fontSize: '0.72rem',
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
                                        fontSize: '0.7rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    {r.error}
                                </span>
                            ) : (
                                <span
                                    style={{
                                        color: 'var(--slate-500)',
                                        fontSize: '0.7rem',
                                        fontStyle: 'italic',
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                >
                                    {t('debate.probe_no_response')}
                                </span>
                            )}
                            <span style={{ color: 'var(--slate-600)', fontSize: '0.6rem', flexShrink: 0 }}>
                                {isExpanded ? '\u25B2' : '\u25BC'}
                            </span>
                        </div>
                        {isExpanded && (
                            <div
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '0 0 8px 8px',
                                    background: 'rgba(0,0,0,0.15)',
                                    border: '1px solid rgba(168,85,247,0.12)',
                                    borderTop: 'none',
                                    fontSize: '0.78rem',
                                    color: 'var(--slate-300)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    maxHeight: 150,
                                    overflowY: 'auto',
                                    lineHeight: 1.4,
                                }}
                            >
                                {r.responseContent || (
                                    <span style={textSecondaryItalic}>
                                        {t('debate.probe_no_response')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
