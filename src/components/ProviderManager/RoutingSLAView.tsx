import React, { useState } from 'react';
import { Activity, Shield, Settings2 } from 'lucide-react';
import { keyService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('RoutingSLAView');
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import type { ApiKey } from '../../types/metrics';
import { repColor } from '../Common/status-vocabulary';

interface RoutingSLAViewProps {
    keys: ApiKey[];
    onAddProvider?: () => void;
}

const RoutingSLAView: React.FC<RoutingSLAViewProps> = ({ keys, onAddProvider }) => {
    const initialPolicy = (() => {
        try {
            return keyService.getRoutingPolicy();
        } catch {
            return { globalSLAMode: 'BALANCED', latencyThreshold: 2000 };
        }
    })();
    const [globalSLA, setGlobalSLAState] = useState(initialPolicy.globalSLAMode);
    const [latencyThreshold, setLatencyThreshold] = useState(initialPolicy.latencyThreshold);
    const [fallbackEnabled, setFallbackEnabled] = useState(true);
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

    React.useEffect(() => {
        const p = keyService.getRoutingPolicy();
        setGlobalSLAState(p.globalSLAMode);
        setLatencyThreshold(p.latencyThreshold);
    }, []);

    const handleSetGlobalSLA = (mode: string) => {
        setGlobalSLAState(mode);
        keyService.setGlobalSLA(mode);
    };

    const handleSetProviderSLA = (keyId: string, mode: string) => {
        keyService.setSLA(keyId, mode);
    };

    const handleToggleFallback = () => {
        const next = !fallbackEnabled;
        setFallbackEnabled(next);
        try {
            keyService.setGlobalSLA(next ? 'BALANCED' : 'HIGH_QUALITY');
        } catch (e) {
            LOGGER.warn('RoutingSLAView', 'setGlobalSLA error', { error: e });
        }
    };

    const activeKeys = keys.filter((k) => k.status === 'active');

    return (
        <div className="provider-sla-grid">
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div className="provider-sla-header">
                    <Activity size={20} color="#3b82f6" />
                    <h3>Global Routing Policy</h3>
                </div>
                <div className="provider-sla-content">
                    <div>
                        <label className="provider-sla-label">Global SLA Mode</label>
                        <select
                            value={globalSLA}
                            onChange={(e) => handleSetGlobalSLA(e.target.value)}
                            className="provider-sla-select"
                            aria-label="Global SLA mode"
                        >
                            <option value="LOW_LATENCY">Lowest Latency (Racing Mode)</option>
                            <option value="HIGH_QUALITY">Maximum Reliability / Quality</option>
                            <option value="BALANCED">Balanced (Smart Semantic)</option>
                            <option value="ECONOMY">Economy (Lowest Cost)</option>
                        </select>
                    </div>
                    <div>
                        <label className="provider-sla-label">Latency Threshold (ms)</label>
                        <input
                            type="range"
                            min="100"
                            max="5000"
                            value={latencyThreshold}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setLatencyThreshold(v);
                                keyService.setLatencyThreshold(v);
                            }}
                            style={{ width: '100%' }}
                            aria-label="Latency threshold"
                        />
                        <div
                            className="provider-inline-flex"
                            style={{
                                justifyContent: 'space-between',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginTop: '0.4rem',
                            }}
                        >
                            <span>100ms</span>
                            <span>{latencyThreshold}ms</span>
                            <span>5000ms</span>
                        </div>
                        <div
                            className="provider-inline-flex"
                            style={{
                                justifyContent: 'space-between',
                                fontSize: '0.65rem',
                                color: 'var(--slate-500)',
                                marginTop: '0.2rem',
                                padding: '0 0.25rem',
                            }}
                        >
                            <span></span>
                            <span style={{ color: 'var(--success)' }}>200 (real-time)</span>
                            <span style={{ color: 'var(--accent)' }}>500 (interactive)</span>
                            <span style={{ color: 'var(--warning)' }}>1000 (responsive)</span>
                            <span style={{ color: 'var(--error)' }}>3000 (tolerant)</span>
                            <span></span>
                        </div>
                    </div>
                    <div className="provider-sla-fallback">
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                Automatic Fallback
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Retry on alternative provider if primary fails
                            </div>
                        </div>
                        <div
                            className="provider-sla-toggle"
                            role="switch"
                            aria-checked={fallbackEnabled}
                            aria-label="Automatic fallback toggle"
                            tabIndex={0}
                            onClick={handleToggleFallback}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleToggleFallback();
                                }
                            }}
                            style={{ background: fallbackEnabled ? '#3b82f6' : '#52525b' }}
                        >
                            <div
                                className="provider-sla-toggle-dot"
                                style={{ right: fallbackEnabled ? '2px' : '22px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <div className="provider-sla-header">
                    <Shield size={20} color="#10b981" />
                    <h3>Active Provider SLAs</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activeKeys.map((key) => {
                        const ext = key.stats?.extended;
                        const reputation = ext?.reputationScore || 0;
                        const rc = repColor(reputation);
                        const isExpanded = expandedProvider === key.id;
                        return (
                            <div key={key.id} className="provider-sla-item">
                                <div
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'stretch',
                                    }}
                                >
                                    <div className="provider-sla-item-info">
                                        <ProviderIcon provider={key.provider} size={16} />
                                        <div>
                                            <div className="provider-sla-item-name">
                                                {key.label}
                                            </div>
                                            <div className="provider-sla-item-sub">
                                                Uptime:{' '}
                                                {key.stats?.successCount || key.stats?.errorCount
                                                    ? (
                                                          (key.stats.successCount /
                                                              (key.stats.successCount +
                                                                  key.stats.errorCount)) *
                                                          100
                                                      ).toFixed(2)
                                                    : 'N/A'}
                                                % &middot; Latency:{' '}
                                                {Math.round(key.stats?.avgLatency || 0)}ms
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="provider-inline-flex"
                                        style={{ gap: '0.5rem', alignItems: 'center' }}
                                    >
                                        <div
                                            className="provider-sla-item-state"
                                            style={{ color: rc }}
                                        >
                                            {ext?.state || 'HEALTHY'}
                                        </div>
                                        <button
                                            onClick={() =>
                                                setExpandedProvider(isExpanded ? null : key.id)
                                            }
                                            className="provider-action-btn"
                                            style={{ padding: '0.3rem' }}
                                        >
                                            <Settings2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div
                                        className="provider-sla-provider-settings"
                                        style={{
                                            marginTop: '0.75rem',
                                            paddingTop: '0.75rem',
                                            borderTop: '1px solid var(--border)',
                                        }}
                                    >
                                        <div
                                            className="provider-sla-content"
                                            style={{ gap: '0.75rem' }}
                                        >
                                            <label
                                                className="provider-sla-label"
                                                style={{ marginBottom: '0.25rem' }}
                                            >
                                                Provider SLA Mode
                                            </label>
                                            <select
                                                value={ext?.activeSLA || 'BALANCED'}
                                                onChange={(e) =>
                                                    handleSetProviderSLA(key.id, e.target.value)
                                                }
                                                className="provider-sla-select"
                                            >
                                                <option value="LOW_LATENCY">Low Latency</option>
                                                <option value="HIGH_QUALITY">High Quality</option>
                                                <option value="BALANCED">Balanced</option>
                                                <option value="ECONOMY">Economy</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {activeKeys.length === 0 && (
                        <div className="provider-sla-empty">
                            <div style={{ marginBottom: '0.5rem' }}>
                                No active providers to monitor.
                            </div>
                            {onAddProvider && (
                                <button
                                    onClick={onAddProvider}
                                    className="btn-primary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                >
                                    Add Provider
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoutingSLAView;
