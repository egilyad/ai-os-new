import React, { useState } from 'react';
import { Plus, Trash2, Play, Shield, XCircle } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { DemoGate } from './Common/DemoGate';
import { healthSlaService } from '../kernel/instances';

const METRIC_LABELS: Record<string, string> = {
    latency: 'Latency',
    uptime: 'Uptime',
    error_rate: 'Error Rate',
    throughput: 'Throughput',
};
const METRIC_UNITS: Record<string, string> = {
    latency: 'ms',
    uptime: '%',
    error_rate: '%',
    throughput: 'req/s',
};
const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
};

const HealthSlaPanelContent: React.FC = () => {
    const [profiles, setProfiles] = useState(() => healthSlaService.getProfiles());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');

    const refresh = () => setProfiles([...healthSlaService.getProfiles()]);
    const selected = profiles.find((p) => p.id === selectedId);

    const handleCreate = () => {
        if (!formName.trim()) return;
        healthSlaService.createProfile(formName, formDesc);
        setShowForm(false);
        setFormName('');
        setFormDesc('');
        refresh();
    };

    const handleDelete = (id: string) => {
        healthSlaService.deleteProfile(id);
        if (selectedId === id) setSelectedId(null);
        refresh();
    };

    const handleEvaluate = (id: string) => {
        const results = healthSlaService.evaluateProfile(id);
        const passedCount = results.filter((r) => r.passed).length;
        alert(`Evaluation: ${passedCount}/${results.length} rules passed`);
    };

    const toggleRule = (profileId: string, ruleId: string) => {
        healthSlaService.updateRule(profileId, ruleId, {
            enabled: !selected?.rules.find((r) => r.id === ruleId)?.enabled,
        });
        refresh();
    };

    const addRule = (profileId: string) => {
        const metric = ['latency', 'uptime', 'error_rate', 'throughput'][
            Math.floor(Math.random() * 4)
        ] as 'latency' | 'uptime' | 'error_rate' | 'throughput';
        healthSlaService.addRule(profileId, {
            name: `New ${METRIC_LABELS[metric]} Rule`,
            metric,
            operator: 'lt',
            threshold: metric === 'uptime' ? 99 : metric === 'latency' ? 2000 : 1,
            unit: METRIC_UNITS[metric]!,
            severity: 'warning',
            enabled: true,
        });
        refresh();
    };

    return (
        <div
            style={{
                padding: 16,
                height: '100%',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px',
                            fontSize: 18,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Shield size={20} color="#10b981" /> Health SLA Config
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        Define and manage Service Level Agreements for provider health
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        background: showForm ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: showForm ? '#ef4444' : '#10b981',
                    }}
                >
                    {showForm ? <XCircle size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'New Profile'}
                </button>
            </div>

            {showForm && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <input
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Profile name..."
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <input
                            value={formDesc}
                            onChange={(e) => setFormDesc(e.target.value)}
                            placeholder="Description..."
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={!formName.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(16,185,129,0.2)',
                            color: 'var(--success)',
                            fontSize: 13,
                            fontWeight: 600,
                            opacity: formName.trim() ? 1 : 0.5,
                        }}
                    >
                        <Plus size={14} /> Create Profile
                    </button>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr',
                    gap: 16,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
                >
                    {profiles.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            style={{
                                background: selectedId === p.id ? '#1e293b' : 'transparent',
                                borderRadius: 8,
                                padding: 10,
                                cursor: 'pointer',
                                border:
                                    selectedId === p.id
                                        ? '1px solid rgba(16,185,129,0.3)'
                                        : '1px solid transparent',
                            }}
                        >
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}>
                                {p.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                {p.rules.length} rules · {p.providers.join(', ')}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            setSelectedId(null);
                            setShowForm(true);
                        }}
                        style={{
                            padding: '10px',
                            borderRadius: 8,
                            border: '1px dashed rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            fontSize: 12,
                        }}
                    >
                        <Plus size={14} style={{ display: 'inline' }} /> New Profile
                    </button>
                </div>

                <div style={{ overflowY: 'auto' }}>
                    {selected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div
                                        style={{ fontWeight: 700, fontSize: 16, color: 'var(--slate-200)' }}
                                    >
                                        {selected.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                                        {selected.description}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={() => handleEvaluate(selected.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: 'rgba(16,185,129,0.15)',
                                            color: 'var(--success)',
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Play size={12} /> Evaluate
                                    </button>
                                    <button
                                        onClick={() => addRule(selected.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: 'rgba(59,130,246,0.15)',
                                            color: 'var(--accent)',
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Plus size={12} /> Add Rule
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selected.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: 'rgba(239,68,68,0.15)',
                                            color: 'var(--error)',
                                            fontSize: 11,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {selected.providers.map((p) => (
                                    <span
                                        key={p}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            background: 'var(--success-tint)',
                                            color: 'var(--success)',
                                        }}
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selected.rules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '10px 12',
                                            borderRadius: 8,
                                            background: 'var(--slate-900)',
                                            border: '1px solid rgba(255,255,255,0.04)',
                                            opacity: rule.enabled ? 1 : 0.4,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: SEVERITY_COLORS[rule.severity],
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: 'var(--slate-200)',
                                                }}
                                            >
                                                {rule.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                                {rule.metric} {rule.operator} {rule.threshold}
                                                {rule.unit}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleRule(selected.id, rule.id)}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: 4,
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                background: rule.enabled
                                                    ? 'rgba(16,185,129,0.15)'
                                                    : 'rgba(100,116,139,0.15)',
                                                color: rule.enabled ? '#10b981' : '#64748b',
                                            }}
                                        >
                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--slate-600)' }}>
                                Created {new Date(selected.createdAt).toLocaleDateString()} ·
                                Updated {new Date(selected.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-500)' }}>
                            <Shield size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <div style={{ fontSize: 14 }}>Select an SLA profile</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>
                                Choose a profile from the left to view and edit its rules
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const HealthSlaPanel: React.FC = () => (
    <PanelLoader name="Health SLA">
        <DemoGate title="Health SLA Config">
            <HealthSlaPanelContent />
        </DemoGate>
    </PanelLoader>
);

export default HealthSlaPanel;
