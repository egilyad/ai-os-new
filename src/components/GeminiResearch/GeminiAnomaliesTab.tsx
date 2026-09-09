import React, { useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type {
    IGeminiResearchService,
    GeminiAnomalyResult,
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

export const GeminiAnomaliesTab: React.FC<Props> = ({ service, sessionId }) => {
    const [data, setData] = useState<GeminiAnomalyResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRun = useCallback(async () => {
        if (!sessionId || !service) return;
        setLoading(true);
        try {
            const r = await service.detectAnomalies(sessionId);
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
                    background: loading ? '#ef444440' : '#ef4444',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginBottom: 16,
                    opacity: !sessionId || !service ? 0.4 : 1,
                }}
            >
                {loading ? <Loader2 size={16} className="spin" /> : <AlertTriangle size={16} />}
                {loading ? 'Scanning...' : 'Detect Anomalies with Gemini'}
            </button>

            {data && data.anomalies.length === 0 && (
                <div style={{ ...cardStyle, textAlign: 'center', padding: 30, color: 'var(--success)' }}>
                    <CheckCircle2 size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                    <div>No anomalies detected</div>
                </div>
            )}

            {data && data.anomalies.length > 0 && (
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {(['critical', 'warning', 'info'] as const).map((sev) => {
                            const count = data.anomalies.filter((a) => a.severity === sev).length;
                            const colors: Record<string, string> = {
                                critical: '#ef4444',
                                warning: '#f59e0b',
                                info: '#3b82f6',
                            };
                            return (
                                <div
                                    key={sev}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        background: `${colors[sev]}15`,
                                        color: colors[sev],
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                    }}
                                >
                                    {sev}: {count}
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {(
                            [
                                'contradiction',
                                'data_gap',
                                'methodology_flaw',
                                'source_bias',
                            ] as const
                        ).map((t) => {
                            const count = data.anomalies.filter((a) => a.type === t).length;
                            return count > 0 ? (
                                <div
                                    key={t}
                                    style={{
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        fontSize: '0.7rem',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: 'var(--slate-400)',
                                    }}
                                >
                                    {t.replace(/_/g, ' ')}: {count}
                                </div>
                            ) : null;
                        })}
                    </div>
                    {data.anomalies.map((a, i) => {
                        const sevColor =
                            a.severity === 'critical'
                                ? '#ef4444'
                                : a.severity === 'warning'
                                  ? '#f59e0b'
                                  : '#3b82f6';
                        return (
                            <div
                                key={`${a.severity}-${a.description.slice(0, 40)}-${i}`}
                                style={{ ...cardStyle, borderLeft: `3px solid ${sevColor}` }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 6,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            background: `${sevColor}20`,
                                            color: sevColor,
                                        }}
                                    >
                                        {a.severity}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                        {a.type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--slate-300)',
                                        marginBottom: 6,
                                    }}
                                >
                                    {a.description}
                                </div>
                                {a.recommendation && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                                        → {a.recommendation}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
