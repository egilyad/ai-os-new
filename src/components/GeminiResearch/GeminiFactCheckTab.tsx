import React, { useState, useCallback } from 'react';
import { Shield, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type {
    IGeminiResearchService,
    GeminiClaimAnalysis,
} from '../../kernel/contracts/gemini-research';

interface Props {
    service: IGeminiResearchService;
    sessionId: string;
}

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
};

const assessmentIcon = (status: string) => {
    switch (status) {
        case 'supported':
            return <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />;
        case 'contradicted':
            return <XCircle size={14} style={{ color: 'var(--error)' }} />;
        case 'partially_supported':
            return <AlertCircle size={14} style={{ color: 'var(--warning)' }} />;
        default:
            return <AlertCircle size={14} style={{ color: 'var(--slate-500)' }} />;
    }
};

export const GeminiFactCheckTab: React.FC<Props> = ({ service, sessionId }) => {
    const [data, setData] = useState<GeminiClaimAnalysis[] | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRun = useCallback(async () => {
        if (!sessionId || !service) return;
        setLoading(true);
        try {
            const r = await service.analyzeClaims(sessionId);
            setData(r);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [sessionId, service]);

    return (
        <div>
            <button
                onClick={handleRun}
                disabled={!sessionId || loading || !service}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: loading ? '#f59e0b40' : '#f59e0b',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: 16,
                    opacity: !sessionId || !service ? 0.4 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="spin" /> : <Shield size={16} />}
                {loading ? 'Analyzing...' : 'Analyze Claims with Gemini'}
            </button>

            {data && data.length === 0 && (
                <div style={{ ...cardStyle, color: 'var(--slate-500)', textAlign: 'center', padding: 30 }}>
                    No claims found in this session
                </div>
            )}

            {data && data.length > 0 && (
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {(
                            [
                                'supported',
                                'contradicted',
                                'partially_supported',
                                'unverifiable',
                            ] as const
                        ).map((s) => {
                            const count = data.filter((a) => a.assessment === s).length;
                            const colors: Record<string, string> = {
                                supported: '#22c55e',
                                contradicted: '#ef4444',
                                partially_supported: '#f59e0b',
                                unverifiable: '#64748b',
                            };
                            return (
                                <div
                                    key={s}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        background: `${colors[s]}15`,
                                        color: colors[s],
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {s.replace('_', ' ')}: {count}
                                </div>
                            );
                        })}
                    </div>
                    {data.map((a) => (
                        <div key={a.claimId} style={cardStyle}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6,
                                }}
                            >
                                {assessmentIcon(a.assessment)}
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        background: `${a.confidence > 0.6 ? '#22c55e20' : '#64748b20'}`,
                                        color: a.confidence > 0.6 ? '#22c55e' : '#64748b',
                                    }}
                                >
                                    {(a.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', marginBottom: 6 }}>
                                {a.claim}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                {a.reasoning}
                            </div>
                            {a.suggestedCorrection && (
                                <div
                                    style={{
                                        marginTop: 6,
                                        fontSize: '0.8rem',
                                        color: 'var(--warning)',
                                        padding: '6px 10px',
                                        borderRadius: 6,
                                        background: 'rgba(245,158,11,0.08)',
                                    }}
                                >
                                    Suggested correction: {a.suggestedCorrection}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
