import { flexCenterGap6px } from '../../styles/common';
import type { ApiKey } from '../../types/metrics';

interface ProviderUsageBarsProps {
    apiKey: ApiKey;
}

export const ProviderUsageBars: React.FC<ProviderUsageBarsProps> = ({ apiKey }) => {
    const stats = apiKey.stats?.extended;
    const usage = stats?.usageToday;
    if (!usage?.requests && !usage?.tokens) return null;
    const reqLimit = stats?.rules?.quota?.requestsPerDay;
    const tokLimit = stats?.rules?.quota?.tokensPerDay;
    return (
        <div
            style={{
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
            }}
        >
            {reqLimit && reqLimit > 0 && (
                <div style={flexCenterGap6px}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)', minWidth: 48 }}>
                        {usage.requests}/{reqLimit}
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${Math.min(100, (usage.requests / reqLimit) * 100)}%`,
                                height: '100%',
                                borderRadius: 2,
                                background:
                                    usage.requests / reqLimit > 0.8
                                        ? '#ef4444'
                                        : usage.requests / reqLimit > 0.5
                                          ? '#f59e0b'
                                          : '#3b82f6',
                            }}
                        />
                    </div>
                </div>
            )}
            {tokLimit && tokLimit > 0 && (
                <div style={flexCenterGap6px}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)', minWidth: 48 }}>
                        {(usage.tokens / 1000).toFixed(0)}k/{(tokLimit / 1000).toFixed(0)}k
                    </span>
                    <div
                        style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 2,
                            background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                width: `${Math.min(100, (usage.tokens / tokLimit) * 100)}%`,
                                height: '100%',
                                borderRadius: 2,
                                background:
                                    usage.tokens / tokLimit > 0.8
                                        ? '#ef4444'
                                        : usage.tokens / tokLimit > 0.5
                                          ? '#f59e0b'
                                          : '#10b981',
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
