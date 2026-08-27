import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ClipboardList,
    Search,
    Download,
    Trash2,
    X,
    Loader2,
    Clock,
    DollarSign,
    Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/useTranslation';
import { usePolling } from './Common/usePolling';
import { errorContainer, dismissBtnRed } from '../styles/common';
import { useConfirm } from '../hooks/useConfirm';
import { STORAGE_KEY, MAX_DECISIONS, loadFromStorage } from './DecisionLogPanel/decision-log-types';
import { StatBox } from './DecisionLogPanel/StatBox';
import { DecisionCard } from './DecisionLogPanel/DecisionCard';
import { storageAdapter } from '../kernel/instances';

const DecisionLogPanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [decisions, setDecisions] = useState<ReturnType<typeof loadFromStorage>>([]);
    const [search, setSearch] = useState('');
    const [providerFilter, setProviderFilter] = useState<string>('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    const refresh = useCallback(() => {
        setDecisions(loadFromStorage());
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        refresh();
        setLoading(false);
        return () => {
            isMountedRef.current = false;
        };
    }, [refresh]);

    usePolling(refresh, 3000);

    const handleExport = useCallback(() => {
        try {
            const json = JSON.stringify(decisions, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `decision-log-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
            }, 100);
        } catch (err) {
            setError(String(err));
        }
    }, [decisions]);

    const handleClear = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Clear Decision Log',
                message: t('decision_log.confirm_clear'),
                variant: 'danger',
            }))
        )
            return;
        storageAdapter.removeItem(STORAGE_KEY);
        refresh();
    }, [refresh, t, confirm]);

    const filtered = decisions.filter((d) => {
        if (search.trim()) {
            const q = search.toLowerCase();
            if (
                !d.chosenProvider.toLowerCase().includes(q) &&
                !d.chosenModel.toLowerCase().includes(q) &&
                !d.promptPreview.toLowerCase().includes(q) &&
                !d.reason.toLowerCase().includes(q)
            )
                return false;
        }
        if (providerFilter && d.chosenProvider !== providerFilter) return false;
        return true;
    });

    const allProviders = Array.from(new Set(decisions.map((d) => d.chosenProvider))).sort();
    const totalCost = filtered.reduce((s, d) => s + d.estimatedCost, 0);
    const totalTokens = filtered.reduce((s, d) => s + d.tokensEstimate, 0);
    const avgLatency =
        filtered.length === 0 ? 0 : filtered.reduce((s, d) => s + d.latencyMs, 0) / filtered.length;

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
            >
                <Loader2 size={20} className="animate-spin" />
            </div>
        );
    }

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem',
                overflow: 'auto',
            }}
        >
            <div
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '1rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <ClipboardList size={26} color="#10b981" /> {t('decision_log.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('decision_log.subtitle', { count: decisions.length })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleExport}
                        disabled={decisions.length === 0}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: decisions.length === 0 ? '#475569' : '#94a3b8',
                            cursor: decisions.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Download size={12} /> {t('decision_log.export')}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={decisions.length === 0}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: 6,
                            border: 'none',
                            background: decisions.length > 0 ? '#ef4444' : 'rgba(239,68,68,0.2)',
                            color: '#fff',
                            cursor: decisions.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <Trash2 size={12} /> {t('decision_log.clear')}
                    </button>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={errorContainer}
                >
                    {error}
                    <button onClick={() => setError(null)} style={dismissBtnRed}>
                        <X size={18} />
                    </button>
                </motion.div>
            )}

            {decisions.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.5rem',
                    }}
                >
                    <StatBox
                        icon={<ClipboardList size={14} color="#10b981" />}
                        label={t('decision_log.total_decisions')}
                        value={filtered.length}
                        color="#10b981"
                    />
                    <StatBox
                        icon={<DollarSign size={14} color="#f59e0b" />}
                        label={t('decision_log.total_cost')}
                        value={`$${totalCost.toFixed(4)}`}
                        color="#f59e0b"
                    />
                    <StatBox
                        icon={<Zap size={14} color="#3b82f6" />}
                        label={t('decision_log.total_tokens')}
                        value={totalTokens.toLocaleString()}
                        color="#3b82f6"
                    />
                    <StatBox
                        icon={<Clock size={14} color="#a855f7" />}
                        label={t('decision_log.avg_latency')}
                        value={`${avgLatency.toFixed(0)}ms`}
                        color="#a855f7"
                    />
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                    <Search
                        size={14}
                        style={{ position: 'absolute', left: 8, top: 8, color: 'var(--slate-400)' }}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('decision_log.search_placeholder')}
                        style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem 0.4rem 28px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.8rem',
                        }}
                    />
                </div>
                <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                    }}
                >
                    <option value="">{t('decision_log.all_providers')}</option>
                    {allProviders.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <AnimatePresence>
                    {filtered.slice(0, MAX_DECISIONS).map((d) => (
                        <DecisionCard
                            key={d.id}
                            entry={d}
                            isExpanded={expandedId === d.id}
                            onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        />
                    ))}
                </AnimatePresence>
                {decisions.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>
                        <ClipboardList size={48} color="#475569" />
                        <p style={{ marginTop: '1rem' }}>{t('decision_log.empty')}</p>
                    </div>
                )}
            </div>

            <ConfirmDialog />
        </div>
    );
};

export default DecisionLogPanel;
