import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { BarChart3, Plus, Trash2, RefreshCw, LayoutDashboard } from 'lucide-react';
import type { CustomMetric, MetricDashboard } from '../kernel/contracts/custom-metrics';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
};

const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: 'rgba(255,255,255,0.05)',
};

import { errorBanner, dismissBtn } from '../styles/common';

const CustomMetricsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<CustomMetric[]>([]);
    const [dashboards, setDashboards] = useState<MetricDashboard[]>([]);
    const [values, setValues] = useState<Record<string, number>>({});
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [field, setField] = useState('');
    const [showDash, setShowDash] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const m = await import('../kernel/instances');
            const svc = m.customMetricsService;
            if (!svc) return;
            setMetrics(await svc.listMetrics());
            setDashboards(await svc.listDashboards());
            const vals: Record<string, number> = {};
            const all = await svc.listMetrics();
            for (const metric of all) {
                try {
                    const v = await svc.computeValue(metric.id);
                    vals[metric.id] = v.value;
                } catch (e) {
                    setError(
                        `Failed to compute value for '${metric.name}': ${e instanceof Error ? e.message : 'Unknown error'}`,
                    );
                }
            }
            setValues(vals);
        } catch (e) {
            setError(`Failed to load metrics: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }

    async function handleCreate() {
        if (!name.trim() || !field.trim()) return;
        try {
            const m = await import('../kernel/instances');
            const svc = m.customMetricsService;
            if (!svc) return;
            await svc.createMetric({
                name,
                description: '',
                category: 'custom',
                aggregation: 'avg',
                source: 'system',
                field,
                unit: '',
                color: 'var(--accent)',
            });
            setName('');
            setField('');
            setShowCreate(false);
            await load();
        } catch (e) {
            setError(
                `Failed to create metric: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
        }
    }

    async function handleDelete(id: string) {
        try {
            const m = await import('../kernel/instances');
            const svc = m.customMetricsService;
            if (svc) await svc.deleteMetric(id);
            await load();
        } catch (e) {
            setError(
                `Failed to delete metric: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
        }
    }

    async function handleCreateDash() {
        try {
            const m = await import('../kernel/instances');
            const svc = m.customMetricsService;
            if (!svc) return;
            const ids = metrics.map((mm) => mm.id);
            await svc.createDashboard(`Dashboard ${dashboards.length + 1}`, ids);
            await load();
        } catch (e) {
            setError(
                `Failed to create dashboard: ${e instanceof Error ? e.message : 'Unknown error'}`,
            );
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 900 }}>
            {error && (
                <div role="alert" aria-live="polite" style={errorBanner}>
                    {error}
                    <button onClick={() => setError(null)} style={dismissBtn} aria-label="Dismiss">
                        ✕
                    </button>
                </div>
            )}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('metrics.title') || 'Custom Metrics'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {t('metrics.subtitle') || 'Define custom KPIs and dashboards'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={btn} onClick={() => setShowDash(!showDash)}>
                        <LayoutDashboard size={16} /> {t('metrics.dashboards') || 'Dashboards'}
                    </button>
                    <button style={btn} onClick={load}>
                        <RefreshCw size={16} /> {t('metrics.refresh') || 'Refresh'}
                    </button>
                    <button
                        style={{
                            ...btn,
                            background: 'rgba(59,130,246,0.2)',
                            borderColor: 'rgba(59,130,246,0.3)',
                        }}
                        onClick={() => setShowCreate(!showCreate)}
                    >
                        <Plus size={16} /> {t('metrics.add') || 'Add Metric'}
                    </button>
                </div>
            </div>

            {showCreate && (
                <div
                    style={{
                        ...card,
                        marginBottom: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <input
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                        placeholder={t('metrics.form_name') || 'Metric name'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                        placeholder={
                            t('metrics.form_field') || 'Data field (e.g. latency, reliability)'
                        }
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            style={{
                                ...btn,
                                background: 'rgba(59,130,246,0.2)',
                                borderColor: 'rgba(59,130,246,0.3)',
                            }}
                            onClick={handleCreate}
                        >
                            {t('metrics.save') || 'Create'}
                        </button>
                        <button style={btn} onClick={() => setShowCreate(false)}>
                            {t('metrics.cancel') || 'Cancel'}
                        </button>
                    </div>
                </div>
            )}

            {showDash && dashboards.length > 0 && (
                <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-400)' }}>
                        {t('metrics.dashboards') || 'Dashboards'}
                    </div>
                    {dashboards.map((d) => (
                        <div
                            key={d.id}
                            style={{
                                ...card,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ color: 'var(--slate-200)' }}>{d.name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                                {d.metricIds.length} metrics
                            </span>
                        </div>
                    ))}
                    <button style={btn} onClick={handleCreateDash}>
                        <Plus size={14} /> {t('metrics.add_dashboard') || 'New Dashboard'}
                    </button>
                </div>
            )}

            {metrics.length === 0 ? (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 40,
                        color: 'var(--slate-500)',
                        fontSize: '0.9rem',
                    }}
                >
                    <BarChart3 size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <div>{t('metrics.empty') || 'No metrics yet. Add your first metric!'}</div>
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 12,
                    }}
                >
                    {metrics.map((m) => (
                        <div
                            key={m.id}
                            style={{ ...card, borderTop: `3px solid ${m.color || '#3b82f6'}` }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: 'var(--slate-200)',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    {m.name}
                                </div>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-500)',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                    onClick={() => handleDelete(m.id)}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: 4 }}>
                                {m.source} &middot; {m.aggregation} &middot; {m.field}
                            </div>
                            <div
                                style={{
                                    fontSize: '1.3rem',
                                    fontWeight: 700,
                                    color: m.color || '#3b82f6',
                                    marginTop: 8,
                                }}
                            >
                                {values[m.id] !== undefined ? values[m.id]!.toFixed(2) : '—'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomMetricsPanel;
