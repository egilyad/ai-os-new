import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ProbeResult } from '../../kernel/contracts/probe';
import { textSecondary } from '../../styles/common';

interface ProbeResultSectionProps {
    probeResult: ProbeResult;
}

export const ProbeResultSection: React.FC<ProbeResultSectionProps> = ({ probeResult }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    marginTop: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    background:
                        probeResult.status === 'ready'
                            ? 'rgba(16,185,129,0.08)'
                            : probeResult.status === 'broken'
                              ? 'rgba(239,68,68,0.08)'
                              : 'rgba(245,158,11,0.08)',
                }}
            >
                <div
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background:
                            probeResult.status === 'ready'
                                ? '#10b981'
                                : probeResult.status === 'broken'
                                  ? '#ef4444'
                                  : '#f59e0b',
                    }}
                />
                <span
                    style={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.68rem',
                        color:
                            probeResult.status === 'ready'
                                ? '#10b981'
                                : probeResult.status === 'broken'
                                  ? '#ef4444'
                                  : '#f59e0b',
                    }}
                >
                    {probeResult.status}
                </span>
                {probeResult.latency > 0 && (
                    <span style={textSecondary}>{probeResult.latency}ms</span>
                )}
                <span style={textSecondary}>quota: {probeResult.quotaRemaining ?? '?'}</span>
                {probeResult.error && (
                    <span style={{ color: 'var(--error)', marginLeft: 'auto', fontSize: '0.7rem' }}>
                        {probeResult.error.slice(0, 40)}
                    </span>
                )}
                {probeResult.status === 'ready' && (
                    <CheckCircle2 size={12} color="#10b981" style={{ marginLeft: 'auto' }} />
                )}
                <span
                    style={{
                        color: 'var(--slate-600)',
                        fontSize: '0.65rem',
                        marginLeft: probeResult.error ? 4 : 'auto',
                    }}
                >
                    {expanded ? '▲' : '▼'}
                </span>
            </div>
            {expanded && probeResult.responseContent && (
                <div
                    style={{
                        marginTop: '0.25rem',
                        padding: '0.5rem 0.7rem',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.15)',
                        fontSize: '0.78rem',
                        color: 'var(--slate-300)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 150,
                        overflowY: 'auto',
                        lineHeight: 1.4,
                    }}
                >
                    {probeResult.responseContent}
                </div>
            )}
        </div>
    );
};
