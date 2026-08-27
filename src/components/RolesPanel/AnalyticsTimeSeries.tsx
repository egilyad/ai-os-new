import React from 'react';
import { Calendar } from 'lucide-react';
import type { DailyActivity } from './analytics-utils';

interface AnalyticsTimeSeriesProps {
    data: DailyActivity[];
}

const AnalyticsTimeSeries: React.FC<AnalyticsTimeSeriesProps> = ({ data }) => {
    const maxDaily = Math.max(...data.map((d) => d.invocations), 1);

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: '0.75rem',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: '0.5rem',
                }}
            >
                <Calendar size={14} color="#3b82f6" />
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--slate-400)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    Daily Activity (14 days)
                </span>
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 3,
                    height: 48,
                    padding: '0.25rem 0',
                }}
            >
                {data.map((d) => (
                    <div
                        key={d.day}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'flex-end',
                                width: '100%',
                                gap: 1,
                            }}
                        >
                            <div
                                style={{
                                    width: '50%',
                                    height: `${(d.invocations / maxDaily) * 100}%`,
                                    background: 'var(--accent)',
                                    borderRadius: '2px 2px 0 0',
                                    minHeight: d.invocations > 0 ? 4 : 0,
                                    transition: 'height 0.3s',
                                }}
                            />
                            <div
                                style={{
                                    width: '50%',
                                    height: `${(d.errors / Math.max(maxDaily, 1)) * 100}%`,
                                    background: 'var(--error)',
                                    borderRadius: '2px 2px 0 0',
                                    minHeight: d.errors > 0 ? 4 : 0,
                                    transition: 'height 0.3s',
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: '0.5rem',
                                color: 'var(--slate-500)',
                                writingMode: 'vertical-lr',
                                textOrientation: 'mixed',
                                height: 14,
                                overflow: 'hidden',
                            }}
                        >
                            {d.day.slice(5)}
                        </span>
                    </div>
                ))}
            </div>
            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    fontSize: '0.6rem',
                    color: 'var(--slate-500)',
                    marginTop: 4,
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} />{' '}
                    Invocations
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--error)' }} />{' '}
                    Errors
                </span>
            </div>
        </div>
    );
};

export default AnalyticsTimeSeries;
