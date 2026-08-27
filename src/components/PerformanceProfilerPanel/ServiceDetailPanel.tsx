import { X } from 'lucide-react';

import type { ServiceStats } from './profiler-utils';
import { MiniStat } from './components';

interface ServiceDetailPanelProps {
    service: ServiceStats;
    entries: ReadonlyArray<{
        service?: string;
        latency?: number;
        timestamp: number;
        message: string;
    }>;
    now: number;
    onClose: () => void;
}

export const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({
    service: sel,
    entries,
    now,
    onClose,
}) => {
    const recent = entries
        .filter((e) => e.service === sel.service && typeof e.latency === 'number')
        .slice(-20)
        .reverse();
    const all = entries.filter((e) => e.service === sel.service);
    const oneMinuteAgo = now - 60_000;
    const lastMinute = all.filter((e) => e.timestamp >= oneMinuteAgo).length;

    return (
        <div
            style={{
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid rgba(168,85,247,0.2)',
                background: 'rgba(168,85,247,0.05)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                }}
            >
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--slate-50)' }}>{sel.service}</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={16} />
                </button>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.4rem',
                    marginBottom: '0.75rem',
                }}
            >
                <MiniStat label="min" value={`${sel.min.toFixed(0)}ms`} color="#10b981" />
                <MiniStat label="max" value={`${sel.max.toFixed(0)}ms`} color="#ef4444" />
                <MiniStat
                    label="total"
                    value={`${sel.totalLatency.toFixed(0)}ms`}
                    color="#f59e0b"
                />
                <MiniStat label="last 60s" value={lastMinute.toString()} color="#a855f7" />
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 2,
                    height: 50,
                    padding: '0.4rem 0',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {recent.map((e, i) => {
                    const lat = e.latency ?? 0;
                    const maxLat = Math.max(...recent.map((r) => r.latency ?? 0), 1);
                    const h = Math.max(2, (lat / maxLat) * 50);
                    const color = lat > 2000 ? '#ef4444' : lat > 500 ? '#f59e0b' : '#10b981';
                    return (
                        <div
                            key={`lat-${i}`}
                            style={{
                                flex: 1,
                                height: h,
                                background: color,
                                borderRadius: 1,
                                minWidth: 2,
                            }}
                            title={`${lat}ms`}
                        />
                    );
                })}
            </div>
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recent.slice(0, 5).map((e) => (
                    <div
                        key={e.timestamp}
                        style={{
                            display: 'flex',
                            gap: 8,
                            fontSize: '0.7rem',
                            color: 'var(--slate-400)',
                            fontFamily: 'ui-monospace, monospace',
                        }}
                    >
                        <span style={{ minWidth: 70 }}>
                            {new Date(e.timestamp).toISOString().slice(11, 19)}
                        </span>
                        <span
                            style={{
                                color: 'var(--slate-300)',
                                flex: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {e.message.slice(0, 80)}
                        </span>
                        <span style={{ color: 'var(--purple-muted)' }}>{e.latency}ms</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
