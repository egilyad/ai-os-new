import React, { useEffect, useState } from 'react';
import { useVisibilityInterval } from '../utils/visibility-interval';
import {
    Rocket,
    Plus,
    Trash2,
    Play,
    RotateCcw,
    X,
    Globe,
    Terminal,
    CheckCircle,
    AlertCircle,
    Loader,
    Clock,
    Server,
    Layers,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { DemoGate } from './Common/DemoGate';
import { deployService } from '../kernel/instances';
import type {
    DeployConfig,
    Deployment,
    DeployTarget,
    DeployEnvironment,
    DeployLog,
    DeployStatus,
} from '../kernel/contracts/deploy';

const TARGETS: { id: DeployTarget; label: string }[] = [
    { id: 'vercel', label: 'Vercel' },
    { id: 'docker', label: 'Docker' },
    { id: 'custom', label: 'Custom Server' },
];

const STATUS_COLORS: Record<DeployStatus, string> = {
    pending: '#64748b',
    building: '#f59e0b',
    deploying: '#3b82f6',
    verifying: '#8b5cf6',
    live: '#22c55e',
    failed: '#ef4444',
    rolled_back: '#f97316',
};

const STATUS_ICONS: Record<DeployStatus, React.ReactNode> = {
    pending: <Clock size={14} />,
    building: <Loader size={14} className="animate-spin" />,
    deploying: <Rocket size={14} className="animate-pulse" />,
    verifying: <CheckCircle size={14} />,
    live: <CheckCircle size={14} />,
    failed: <AlertCircle size={14} />,
    rolled_back: <RotateCcw size={14} />,
};

const DeployPanelContent: React.FC = () => {
    const [configs, setConfigs] = useState<DeployConfig[]>([]);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedEnv, setSelectedEnv] = useState<DeployEnvironment>('development');
    const [expandedDeploy, setExpandedDeploy] = useState<string | null>(null);

    // form state
    const [cfgName, setCfgName] = useState('');
    const [cfgTarget, setCfgTarget] = useState<DeployTarget>('vercel');
    const [cfgDomain, setCfgDomain] = useState('');
    const [cfgBuild, setCfgBuild] = useState('npm run build');
    const [cfgOutput, setCfgOutput] = useState('dist');
    const [envKey, setEnvKey] = useState('');
    const [envVal, setEnvVal] = useState('');
    const [envVars, setEnvVars] = useState<Record<string, string>>({});

    const refresh = () => {
        setConfigs(deployService.getConfigs());
        setDeployments(deployService.getDeployments());
    };

    useEffect(() => {
        refresh();
    }, []);
    useVisibilityInterval(refresh, 3000);

    const filteredDeployments = deployments.filter((d) => d.environment === selectedEnv);

    const handleAddEnvVar = () => {
        if (!envKey.trim()) return;
        setEnvVars((prev) => ({ ...prev, [envKey.trim()]: envVal }));
        setEnvKey('');
        setEnvVal('');
    };

    const handleCreate = () => {
        if (!cfgName.trim()) return;
        deployService.addConfig({
            name: cfgName.trim(),
            target: cfgTarget,
            environment: selectedEnv,
            domain: cfgDomain || `${cfgName.toLowerCase().replace(/\s+/g, '-')}.example.com`,
            apiKeys: [],
            envVars,
            buildCommand: cfgBuild,
            outputDir: cfgOutput,
            region: cfgTarget === 'vercel' ? 'iad1' : 'us-east',
            autoDeploy: false,
        });
        setCfgName('');
        setCfgDomain('');
        setEnvVars({});
        setShowForm(false);
        refresh();
    };

    const handleDeploy = (configId: string) => {
        deployService.deploy(configId);
        refresh();
    };

    const handleRollback = (deploymentId: string) => {
        deployService.rollback(deploymentId);
        refresh();
    };

    const handleCancel = (deploymentId: string) => {
        deployService.cancelDeploy(deploymentId);
        refresh();
    };

    const renderLogs = (logs: DeployLog[]) => (
        <div
            style={{
                background: 'var(--slate-900)',
                borderRadius: 6,
                padding: '8px 12px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                maxHeight: 180,
                overflowY: 'auto',
                marginTop: 8,
            }}
        >
            {logs.map((log, i) => (
                <div
                    key={log.timestamp ?? i}
                    style={{
                        color:
                            log.level === 'error'
                                ? '#ef4444'
                                : log.level === 'warn'
                                  ? '#f59e0b'
                                  : '#94a3b8',
                        padding: '2px 0',
                    }}
                >
                    <span style={{ color: 'var(--slate-500)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                    </span>{' '}
                    {log.message}
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                        Deploy to Production
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate-400)' }}>
                        Manage deployments and environments
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    <Plus size={16} /> New Config
                </button>
            </div>

            {/* ── Environment Tabs ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {deployService.getEnvironments().map((env) => (
                    <button
                        key={env}
                        onClick={() => setSelectedEnv(env)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            background: selectedEnv === env ? '#1e293b' : 'transparent',
                            color: selectedEnv === env ? '#fff' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: selectedEnv === env ? 600 : 400,
                            textTransform: 'capitalize',
                        }}
                    >
                        <Layers size={14} />
                        {env}
                    </button>
                ))}
            </div>

            {/* ── New Config Form ── */}
            {showForm && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
                        New Deployment Config
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Config Name
                            </label>
                            <input
                                value={cfgName}
                                onChange={(e) => setCfgName(e.target.value)}
                                placeholder="My App"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Target
                            </label>
                            <select
                                value={cfgTarget}
                                onChange={(e) => setCfgTarget(e.target.value as DeployTarget)}
                                style={inputStyle}
                            >
                                {TARGETS.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Domain
                            </label>
                            <input
                                value={cfgDomain}
                                onChange={(e) => setCfgDomain(e.target.value)}
                                placeholder="app.example.com"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Environment
                            </label>
                            <select
                                value={selectedEnv}
                                onChange={(e) =>
                                    setSelectedEnv(e.target.value as DeployEnvironment)
                                }
                                style={inputStyle}
                            >
                                {deployService.getEnvironments().map((env) => (
                                    <option key={env} value={env}>
                                        {env}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Build Command
                            </label>
                            <input
                                value={cfgBuild}
                                onChange={(e) => setCfgBuild(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-400)',
                                    display: 'block',
                                    marginBottom: 4,
                                }}
                            >
                                Output Directory
                            </label>
                            <input
                                value={cfgOutput}
                                onChange={(e) => setCfgOutput(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* ── Env Vars ── */}
                    <div style={{ marginTop: 12 }}>
                        <label
                            style={{
                                fontSize: 11,
                                color: 'var(--slate-400)',
                                display: 'block',
                                marginBottom: 4,
                            }}
                        >
                            Environment Variables
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <input
                                value={envKey}
                                onChange={(e) => setEnvKey(e.target.value)}
                                placeholder="KEY"
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <input
                                value={envVal}
                                onChange={(e) => setEnvVal(e.target.value)}
                                placeholder="value"
                                style={{ ...inputStyle, flex: 2 }}
                            />
                            <button
                                onClick={handleAddEnvVar}
                                style={{
                                    padding: '6px 12px',
                                    background: 'var(--slate-700)',
                                    border: 'none',
                                    borderRadius: 6,
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                Add
                            </button>
                        </div>
                        {Object.entries(envVars).map(([k, v]) => (
                            <div
                                key={k}
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    background: 'var(--slate-900)',
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    fontSize: 12,
                                }}
                            >
                                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{k}</span>
                                <span style={{ color: 'var(--slate-400)' }}>=</span>
                                <span style={{ color: 'var(--success)' }}>{v}</span>
                                <button
                                    onClick={() => {
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                        const { [k]: _x_, ...rest } = envVars;
                                        setEnvVars(rest);
                                    }}
                                    style={{
                                        marginLeft: 'auto',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--error)',
                                        cursor: 'pointer',
                                        padding: 2,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleCreate}
                        style={{
                            marginTop: 12,
                            padding: '8px 20px',
                            background: 'var(--success)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        Create Config
                    </button>
                </div>
            )}

            {/* ── Configs List ── */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--slate-400)' }}>
                    Deployment Configs
                </h3>
                {configs.length === 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 32,
                            color: 'var(--slate-500)',
                            fontSize: 13,
                        }}
                    >
                        <Server size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>No deployment configs yet. Create one to get started.</p>
                    </div>
                )}
                {configs.map((cfg) => (
                    <div
                        key={cfg.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            background: 'var(--slate-800)',
                            borderRadius: 8,
                            marginBottom: 6,
                        }}
                    >
                        <Rocket size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{cfg.name}</div>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--slate-500)',
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 2,
                                }}
                            >
                                <span>{cfg.target}</span>
                                <span>·</span>
                                <span>{cfg.environment}</span>
                                <span>·</span>
                                <Globe size={11} />
                                <span>{cfg.domain}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeploy(cfg.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                background: 'var(--success)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 500,
                            }}
                        >
                            <Play size={12} /> Deploy
                        </button>
                        <button
                            onClick={() => {
                                deployService.removeConfig(cfg.id);
                                refresh();
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                padding: 4,
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* ── Deployments ── */}
            <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--slate-400)' }}>
                    {selectedEnv === 'development'
                        ? 'Development'
                        : selectedEnv === 'staging'
                          ? 'Staging'
                          : 'Production'}{' '}
                    Deployments
                </h3>
                {filteredDeployments.length === 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 24,
                            color: 'var(--slate-500)',
                            fontSize: 13,
                        }}
                    >
                        <Terminal size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                        <p>No deployments in this environment.</p>
                    </div>
                )}
                {filteredDeployments.map((dep) => {
                    const isExpanded = expandedDeploy === dep.id;
                    return (
                        <div
                            key={dep.id}
                            style={{
                                background: 'var(--slate-800)',
                                borderRadius: 10,
                                padding: 12,
                                marginBottom: 8,
                            }}
                        >
                            <div
                                onClick={() => setExpandedDeploy(isExpanded ? null : dep.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        background: `${STATUS_COLORS[dep.status]}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: STATUS_COLORS[dep.status],
                                        flexShrink: 0,
                                    }}
                                >
                                    {STATUS_ICONS[dep.status]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                                            {dep.version}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                background: `${STATUS_COLORS[dep.status]}20`,
                                                color: STATUS_COLORS[dep.status],
                                                fontWeight: 500,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {dep.status}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--slate-500)',
                                            marginTop: 2,
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Clock size={11} />
                                        <span>{new Date(dep.startedAt).toLocaleString()}</span>
                                        {dep.url && (
                                            <>
                                                <span>·</span>
                                                <Globe size={11} />
                                                <span style={{ color: 'var(--accent)' }}>{dep.url}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {dep.status === 'live' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRollback(dep.id);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '4px 10px',
                                                background: '#f97316',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                fontSize: 11,
                                            }}
                                        >
                                            <RotateCcw size={11} /> Rollback
                                        </button>
                                    )}
                                    {(dep.status === 'pending' ||
                                        dep.status === 'building' ||
                                        dep.status === 'deploying') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancel(dep.id);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '4px 10px',
                                                background: 'var(--error)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                fontSize: 11,
                                            }}
                                        >
                                            <X size={11} /> Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ── Progress Bar ── */}
                            <div
                                style={{
                                    marginTop: 8,
                                    height: 4,
                                    background: 'var(--slate-900)',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${dep.progress}%`,
                                        height: '100%',
                                        background: STATUS_COLORS[dep.status],
                                        borderRadius: 2,
                                        transition: 'width 1s ease',
                                    }}
                                />
                            </div>

                            {/* ── Expanded Detail ── */}
                            {isExpanded && (
                                <div style={{ marginTop: 12 }}>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 8,
                                            fontSize: 12,
                                            color: 'var(--slate-400)',
                                            marginBottom: 8,
                                        }}
                                    >
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Config: </span>
                                            {dep.configId.slice(-8)}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Environment: </span>
                                            {dep.environment}
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--slate-500)' }}>Commit: </span>
                                            {dep.commitHash?.slice(0, 8) || '-'}
                                        </div>
                                        {dep.rollbackTarget && (
                                            <div>
                                                <span style={{ color: 'var(--slate-500)' }}>
                                                    Rollback from:{' '}
                                                </span>
                                                {dep.rollbackTarget.slice(-8)}
                                            </div>
                                        )}
                                    </div>
                                    {renderLogs(dep.logs)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    background: 'var(--slate-900)',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box',
};

const DeployPanel: React.FC = () => (
    <PanelLoader>
        <DemoGate title="Deploy to Production">
            <DeployPanelContent />
        </DemoGate>
    </PanelLoader>
);

export default DeployPanel;
