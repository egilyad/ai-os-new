import { useState, useCallback } from 'react';
import {
    Shield,
    Clock,
    DollarSign,
    Globe,
    Server,
    Activity,
    Cpu,
    Settings,
    Plug,
    PlugZap,
    Loader2,
} from 'lucide-react';
import { nvidiaEnterpriseService, providerAchievementService } from '../../kernel/instances';
import { usePolling } from '../Common/usePolling';
import { AchievementList } from '../ProviderManager/AchievementList';
import type {
    NvidiaEnterpriseConfig,
    ComplianceStatus,
    SLARecord,
    RegionStatus,
    EnterpriseFeature,
    NgcConnectionStatus,
} from '../../kernel/contracts/nvidia-enterprise';

import {
    ComplianceCard,
    SLATable,
    RegionCard,
    FeatureRow,
    StatCard,
} from './NvidiaEnterpriseComponents';
import NvidiaKeyTable from './NvidiaKeyTable';

export default function NvidiaEnterprisePanel() {
    const [config, setConfig] = useState<NvidiaEnterpriseConfig>(() =>
        nvidiaEnterpriseService.getConfig(),
    );
    const [compliance, setCompliance] = useState<ComplianceStatus[]>(() =>
        nvidiaEnterpriseService.getCompliance(),
    );
    const [slaRecords, setSlaRecords] = useState<SLARecord[]>(() =>
        nvidiaEnterpriseService.getSLAHistory(),
    );
    const [regions, setRegions] = useState<RegionStatus[]>(() =>
        nvidiaEnterpriseService.getRegions(),
    );
    const [features, setFeatures] = useState<EnterpriseFeature[]>(() =>
        nvidiaEnterpriseService.getFeatures(),
    );
    const [costs, setCosts] = useState<
        { model: string; costPer1k: number; usage: number; total: number }[]
    >(() => nvidiaEnterpriseService.getEstimatedCosts());
    const [connStatus, setConnStatus] = useState<NgcConnectionStatus>(() =>
        nvidiaEnterpriseService.getConnectionStatus(),
    );
    const [ngcKeyInput, setNgcKeyInput] = useState('');
    const [ngcOrgInput, setNgcOrgInput] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [tab, setTab] = useState<
        | 'overview'
        | 'compliance'
        | 'sla'
        | 'regions'
        | 'keys'
        | 'features'
        | 'costs'
        | 'achievements'
    >('overview');

    const refresh = useCallback(() => {
        setConfig(nvidiaEnterpriseService.getConfig());
        setCompliance(nvidiaEnterpriseService.getCompliance());
        setSlaRecords(nvidiaEnterpriseService.getSLAHistory());
        setRegions(nvidiaEnterpriseService.getRegions());
        setFeatures(nvidiaEnterpriseService.getFeatures());
        setCosts(nvidiaEnterpriseService.getEstimatedCosts());
        setConnStatus(nvidiaEnterpriseService.getConnectionStatus());
    }, []);

    usePolling(refresh, 15000);

    const handleToggleFeature = (id: string, enabled: boolean) => {
        nvidiaEnterpriseService.toggleFeature(id, enabled);
        refresh();
    };

    const handleConfigChange = (updates: Partial<NvidiaEnterpriseConfig>) => {
        nvidiaEnterpriseService.updateConfig(updates);
        refresh();
    };

    const handleConnect = async () => {
        if (!ngcKeyInput.trim()) return;
        setConnecting(true);
        await nvidiaEnterpriseService.connectNgc(
            ngcKeyInput.trim(),
            ngcOrgInput.trim() || undefined,
        );
        setConnecting(false);
        setNgcKeyInput('');
        setNgcOrgInput('');
        refresh();
    };

    const handleDisconnect = () => {
        nvidiaEnterpriseService.disconnectNgc();
        refresh();
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: <Cpu size={16} /> },
        { key: 'compliance', label: 'Compliance', icon: <Shield size={16} /> },
        { key: 'sla', label: 'SLA History', icon: <Activity size={16} /> },
        { key: 'regions', label: 'Regions', icon: <Globe size={16} /> },
        { key: 'keys', label: 'Keys', icon: <Server size={16} /> },
        { key: 'features', label: 'Features', icon: <Settings size={16} /> },
        { key: 'costs', label: 'Cost Analytics', icon: <DollarSign size={16} /> },
        { key: 'achievements', label: 'Achievements', icon: <Cpu size={16} /> },
    ] as const;

    const lastSla = slaRecords[slaRecords.length - 1];
    const avgLatency = slaRecords.reduce((s, r) => s + r.p50Latency, 0) / slaRecords.length;

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            {/* NGC Connection Status */}
            <div
                style={{
                    background: connStatus.connected
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${connStatus.connected ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 13,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {connStatus.connected ? (
                        <PlugZap size={16} color="#10b981" />
                    ) : (
                        <Plug size={16} color="#f59e0b" />
                    )}
                    <span>
                        {connStatus.connected
                            ? `Connected to NGC${connStatus.org ? ` (org: ${connStatus.org})` : ''}`
                            : connStatus.error
                              ? `NGC: ${connStatus.error}`
                              : 'NGC not connected — using provider data + static defaults'}
                    </span>
                </div>
                {!connStatus.connected ? (
                    <details style={{ fontSize: 12 }}>
                        <summary style={{ cursor: 'pointer', color: '#76b900', fontWeight: 600 }}>
                            Connect NGC
                        </summary>
                        <div
                            style={{
                                marginTop: 8,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                minWidth: 320,
                            }}
                        >
                            <input
                                placeholder="NGC API Key"
                                value={ngcKeyInput}
                                onChange={(e) => setNgcKeyInput(e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="NGC Org (optional, default: nvidia)"
                                value={ngcOrgInput}
                                onChange={(e) => setNgcOrgInput(e.target.value)}
                                style={inputStyle}
                            />
                            <button
                                onClick={handleConnect}
                                disabled={connecting || !ngcKeyInput.trim()}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: connecting ? '#999' : '#76b900',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: connecting ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    justifyContent: 'center',
                                }}
                            >
                                {connecting && (
                                    <Loader2
                                        size={14}
                                        style={{ animation: 'spin 1s linear infinite' }}
                                    />
                                )}
                                {connecting ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    </details>
                ) : (
                    <button
                        onClick={handleDisconnect}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'transparent',
                            color: 'var(--error)',
                            fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Disconnect
                    </button>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Cpu size={24} style={{ color: '#76b900' }} />
                <div>
                    <h2 style={{ margin: 0 }}>NVIDIA Enterprise Dashboard</h2>
                    <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                        Compliance · SLA · Regions · Features · Costs
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <StatCard
                    icon={<Shield size={18} />}
                    label="Compliance"
                    value={`${compliance.filter((c) => c.certified).length}/${compliance.length}`}
                    color="#10b981"
                />
                <StatCard
                    icon={<Activity size={18} />}
                    label="Uptime (7d avg)"
                    value={`${lastSla ? slaRecords.reduce((s, r) => s + r.uptime, 0) / slaRecords.length : 0}%`}
                    color="#3b82f6"
                />
                <StatCard
                    icon={<Clock size={18} />}
                    label="Avg Latency"
                    value={`${Math.round(avgLatency)}ms`}
                    color="#f59e0b"
                />
                <StatCard
                    icon={<Globe size={18} />}
                    label="Active Regions"
                    value={`${regions.filter((r) => r.available).length}/${regions.length}`}
                    color="#8b5cf6"
                />
                <StatCard
                    icon={<DollarSign size={18} />}
                    label="Est. Monthly"
                    value={`$${costs.reduce((s, c) => s + c.total, 0).toFixed(2)}`}
                    color="#ef4444"
                />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: tab === t.key ? 'rgba(118,185,0,0.12)' : 'transparent',
                            color: tab === t.key ? '#76b900' : 'inherit',
                            fontWeight: tab === t.key ? 600 : 400,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && (
                <div style={{ display: 'grid', gap: 16 }}>
                    <div
                        style={{
                            background: 'rgba(118,185,0,0.04)',
                            border: '1px solid rgba(118,185,0,0.12)',
                            borderRadius: 12,
                            padding: 16,
                        }}
                    >
                        <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>
                            Enterprise Config
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <label style={{ fontSize: '0.85rem' }}>
                                Default Region
                                <select
                                    value={config.defaultRegion}
                                    onChange={(e) =>
                                        handleConfigChange({ defaultRegion: e.target.value })
                                    }
                                    style={inputStyle}
                                >
                                    {regions.map((r) => (
                                        <option
                                            key={r.region}
                                            value={r.region}
                                            disabled={!r.available}
                                        >
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label style={{ fontSize: '0.85rem' }}>
                                SLA Target (%)
                                <input
                                    type="number"
                                    value={config.slaTarget}
                                    onChange={(e) =>
                                        handleConfigChange({ slaTarget: Number(e.target.value) })
                                    }
                                    style={inputStyle}
                                    step={0.1}
                                />
                            </label>
                            <label style={{ fontSize: '0.85rem' }}>
                                Budget Alert ($)
                                <input
                                    type="number"
                                    value={config.budgetAlert}
                                    onChange={(e) =>
                                        handleConfigChange({ budgetAlert: Number(e.target.value) })
                                    }
                                    style={inputStyle}
                                />
                            </label>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 16,
                                    paddingBottom: 6,
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={config.enableCompliance}
                                        onChange={(e) =>
                                            handleConfigChange({
                                                enableCompliance: e.target.checked,
                                            })
                                        }
                                    />
                                    Compliance
                                </label>
                                <label
                                    style={{
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={config.costOptimization}
                                        onChange={(e) =>
                                            handleConfigChange({
                                                costOptimization: e.target.checked,
                                            })
                                        }
                                    />
                                    Cost Opt.
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div
                            style={{
                                background: 'rgba(16,185,129,0.04)',
                                border: '1px solid rgba(16,185,129,0.12)',
                                borderRadius: 12,
                                padding: 16,
                            }}
                        >
                            <h3
                                style={{
                                    margin: '0 0 12px',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Shield size={16} /> Compliance Summary
                            </h3>
                            <div
                                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                            >
                                {compliance.map((c) => (
                                    <ComplianceCard key={c.standard} c={c} />
                                ))}
                            </div>
                        </div>

                        <div
                            style={{
                                background: 'rgba(245,158,11,0.04)',
                                border: '1px solid rgba(245,158,11,0.12)',
                                borderRadius: 12,
                                padding: 16,
                            }}
                        >
                            <h3
                                style={{
                                    margin: '0 0 12px',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Server size={16} /> Active Regions
                            </h3>
                            {regions
                                .filter((r) => r.available)
                                .slice(0, 3)
                                .map((r) => (
                                    <RegionCard key={r.region} r={r} />
                                ))}
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: '0.8rem',
                                    opacity: 0.5,
                                    textAlign: 'center',
                                }}
                            >
                                {regions.filter((r) => r.available).length} of {regions.length}{' '}
                                regions active
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'compliance' && (
                <div
                    style={{
                        background: 'rgba(16,185,129,0.04)',
                        border: '1px solid rgba(16,185,129,0.12)',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>
                        Compliance Certifications
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: 12,
                        }}
                    >
                        {compliance.map((c) => (
                            <ComplianceCard key={c.standard} c={c} />
                        ))}
                    </div>
                </div>
            )}

            {tab === 'sla' && (
                <div
                    style={{
                        background: 'rgba(59,130,246,0.04)',
                        border: '1px solid rgba(59,130,246,0.12)',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>
                        SLA History (7 days)
                    </h3>
                    <SLATable records={slaRecords} />
                </div>
            )}

            {tab === 'regions' && (
                <div
                    style={{
                        background: 'rgba(139,92,246,0.04)',
                        border: '1px solid rgba(139,92,246,0.12)',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>Global Regions</h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 12,
                        }}
                    >
                        {regions.map((r) => (
                            <RegionCard key={r.region} r={r} />
                        ))}
                    </div>
                </div>
            )}

            {tab === 'keys' && (
                <div
                    style={{
                        background: 'rgba(118,185,0,0.04)',
                        border: '1px solid rgba(118,185,0,0.12)',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>NVIDIA NIM Keys</h3>
                    <NvidiaKeyTable />
                </div>
            )}

            {tab === 'features' && (
                <div
                    style={{
                        background: 'rgba(139,92,246,0.04)',
                        border: '1px solid rgba(139,92,246,0.12)',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>Enterprise Features</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {features.map((f) => (
                            <FeatureRow key={f.id} f={f} onToggle={handleToggleFeature} />
                        ))}
                    </div>
                </div>
            )}

            {tab === 'costs' && (
                <div
                    style={{
                        background: 'rgba(239,68,68,0.04)',
                        border: '1px solid rgba(239,68,68,0.12)',
                        borderRadius: 12,
                        padding: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>
                        Cost Analytics — Last 30 Days
                    </h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {costs.map((c) => {
                            const maxTotal = Math.max(...costs.map((x) => x.total));
                            return (
                                <div key={c.model}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: '0.85rem',
                                            marginBottom: 4,
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{c.model}</span>
                                        <span>${c.total.toFixed(2)}</span>
                                    </div>
                                    <div
                                        style={{
                                            height: 8,
                                            background: 'rgba(0,0,0,0.04)',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${(c.total / maxTotal) * 100}%`,
                                                background: '#76b900',
                                                borderRadius: 4,
                                                transition: 'width 0.3s',
                                            }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: 2 }}>
                                        ${c.costPer1k}/1k tokens · {(c.usage / 1000000).toFixed(1)}M
                                        tokens used
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div
                        style={{
                            marginTop: 16,
                            fontSize: '0.85rem',
                            opacity: 0.6,
                            textAlign: 'right',
                        }}
                    >
                        Total: ${costs.reduce((s, c) => s + c.total, 0).toFixed(2)}
                    </div>
                </div>
            )}

            {tab === 'achievements' && (
                <AchievementList
                    achievements={providerAchievementService.getAchievements('nvidia')}
                    progress={providerAchievementService.getProgress('nvidia', {
                        requests: features.filter((f) => f.enabled).length * 10 + slaRecords.length,
                        largePrompts: slaRecords.filter((r) => r.p95Latency > 2000).length,
                        enterpriseFeatures: features.filter((f) => f.enabled).length,
                        compliancePassed: compliance.filter((c) => c.certified).length,
                        regionsUsed: regions.length,
                        uptimePct: lastSla ? lastSla.uptime : 0,
                        costEntries: costs.length,
                        modelsUsed: costs.length,
                        nvidiaAchievements: providerAchievementService
                            .getAwardedIds()
                            .filter(
                                (id) => id.startsWith('pa-') && parseInt(id.split('-')[1]!) > 30,
                            ).length,
                    })}
                />
            )}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: '0.85rem',
    background: 'rgba(0,0,0,0.02)',
    color: 'inherit',
    width: '100%',
    marginTop: 4,
    outline: 'none',
    boxSizing: 'border-box',
};
