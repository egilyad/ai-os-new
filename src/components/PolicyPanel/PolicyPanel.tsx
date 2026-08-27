import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalShell } from '../ModalShell';
import {
    Shield,
    Plus,
    Trash2,
    Search,
    AlertTriangle,
    X,
    Edit3,
    Clock,
    Activity,
    Eye,
    EyeOff,
} from 'lucide-react';
import {
    policyService,
    type PolicyType,
    type PolicyAction,
    type PolicyViolation,
    type SecurityPattern,
    type ISPolicy,
} from '../../kernel/instances';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import { getPolicyDimensionColor } from '../Common/status-vocabulary';
import {
    errorBannerLg,
    formFieldWhite,
    modalFormSelect,
    modalLabelUppercase,
    patternCard,
    statCard,
    textareaDark,
} from '../../styles/common';
import { Button } from '../../components/Common';
import { useConfirm } from '../../hooks/useConfirm';
import ModuleInfo from '../ModuleInfo';

const POLICY_TYPE_LABELS: Record<PolicyType, { labelKey: string; icon: string }> = {
    latency: { labelKey: 'policy.type_latency', icon: '⏱' },
    privacy: { labelKey: 'policy.type_privacy', icon: '🔒' },
    cost: { labelKey: 'policy.type_cost', icon: '💰' },
    safety: { labelKey: 'policy.type_safety', icon: '🛡' },
    rate_limit: { labelKey: 'policy.type_rate_limit', icon: '🚦' },
    content: { labelKey: 'policy.type_content', icon: '📝' },
    custom: { labelKey: 'policy.type_custom', icon: '⚙' },
};

const ACTION_LABELS: Record<PolicyAction, string> = {
    block: 'policy.action_block',
    warn: 'policy.action_warn',
    log: 'policy.action_log',
    throttle: 'policy.action_throttle',
    mask: 'policy.action_mask',
};

const PolicyPanel: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [policies, setPolicies] = useState<ISPolicy[]>([]);
    const [violations, setViolations] = useState<PolicyViolation[]>([]);
    const [stats, setStats] = useState(() => {
        try {
            return policyService.getStats();
        } catch {
            return null;
        }
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showViolations, setShowViolations] = useState(false);
    const [activeTab, setActiveTab] = useState<'policies' | 'lab'>('policies');
    const [editingPolicy, setEditingPolicy] = useState<Partial<ISPolicy> | null>(null);
    const [editingPattern, setEditingPattern] = useState<Partial<SecurityPattern> | null>(null);
    const [patterns, setPatterns] = useState<SecurityPattern[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { t } = useTranslation();
    const isMountedRef = useRef(true);

    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        const load = () => {
            setPolicies(policyService.getPolicies());
            setPatterns(policyService.getPatterns());
            setViolations(policyService.getViolations(false, 100));
            setStats(policyService.getStats());
        };
        load();
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const refresh = () => {
        setPolicies(policyService.getPolicies());
        setPatterns(policyService.getPatterns());
        setViolations(policyService.getViolations(false, 100));
        setStats(policyService.getStats());
    };

    const handleSave = () => {
        if (!editingPolicy) return;
        try {
            if (editingPolicy.id) {
                policyService.updatePolicy(editingPolicy.id, editingPolicy);
            } else {
                policyService.addPolicy(editingPolicy as Omit<ISPolicy, 'id'>);
            }
            setEditingPolicy(null);
            refresh();
        } catch {
            setError(t('policy.error_save'));
            clearError();
        }
    };

    const handleDelete = async (id: string) => {
        if (
            !(await confirm({
                title: 'Delete Policy',
                message: t('policy.confirm_delete'),
                variant: 'danger',
            }))
        )
            return;
        policyService.removePolicy(id);
        refresh();
    };

    const handleResolveViolation = (id: string) => {
        policyService.resolveViolation(id);
        refresh();
    };

    const handleSavePattern = () => {
        if (!editingPattern) return;
        const all = policyService.getPatterns();
        if (editingPattern.id) {
            const updated = all.map((p) =>
                p.id === editingPattern.id ? { ...p, ...editingPattern } : p,
            );
            policyService.setPatterns(updated as SecurityPattern[]);
        } else {
            policyService.addPattern(editingPattern as SecurityPattern);
        }
        setEditingPattern(null);
        refresh();
    };

    const handleDeletePattern = async (id: string) => {
        if (
            !(await confirm({
                title: 'Delete Pattern',
                message: t('policy.confirm_delete_pattern'),
                variant: 'danger',
            }))
        )
            return;
        const updated = patterns.filter((p) => p.id !== id);
        policyService.setPatterns(updated);
        refresh();
    };

    const filteredPolicies = policies.filter(
        (p) =>
            p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const createNew = () => {
        setEditingPolicy({
            id: '',
            type: 'latency',
            target_nodes: ['all'],
            value: 1000,
            action: 'warn',
        });
    };

    return (
        <div
            style={{
                color: 'var(--text-main)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                overflowY: 'auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1.5rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div>
                        <h2
                            style={{
                                fontSize: '1.75rem',
                                fontWeight: 800,
                                margin: '0 0 0.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                color: 'var(--slate-50)',
                            }}
                        >
                            <Shield size={28} color="#10b981" /> {t('policy.title')}
                        </h2>
                        <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                            {t('policy.subtitle')}
                        </p>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.3rem',
                            borderRadius: 12,
                        }}
                    >
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('policies')}
                            style={{
                                background:
                                    activeTab === 'policies'
                                        ? 'rgba(16,185,129,0.2)'
                                        : 'transparent',
                                color: activeTab === 'policies' ? '#10b981' : '#64748b',
                            }}
                        >
                            {t('policy.tab.policies')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveTab('lab')}
                            style={{
                                background:
                                    activeTab === 'lab' ? 'rgba(16,185,129,0.2)' : 'transparent',
                                color: activeTab === 'lab' ? '#10b981' : '#64748b',
                            }}
                        >
                            {t('policy.tab.lab')}
                        </Button>
                    </div>
                </div>
                <button
                    onClick={
                        activeTab === 'policies'
                            ? createNew
                            : () =>
                                  setEditingPattern({
                                      type: 'pii',
                                      label: '',
                                      pattern: '',
                                      replacement: '',
                                  })
                    }
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                        border: 'none',
                        color: 'white',
                        borderRadius: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    }}
                >
                    <Plus size={18} />{' '}
                    {activeTab === 'policies' ? t('policy.add') : t('policy.add_pattern')}
                </button>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorBannerLg}
                        role="alert"
                    >
                        <AlertTriangle size={18} /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: '#fca5a5',
                                cursor: 'pointer',
                            }}
                            aria-label={t('common.dismiss_error')}
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                {[
                    {
                        label: t('policy.stats.total_violations'),
                        value: stats?.totalViolations ?? 0,
                        color: 'var(--error)',
                        icon: <AlertTriangle size={20} />,
                    },
                    {
                        label: t('policy.stat_active'),
                        value: stats?.activeViolations ?? 0,
                        color: 'var(--warning)',
                        icon: <Activity size={20} />,
                    },
                    {
                        label: t('policy.stats.last_violation'),
                        value: stats?.lastViolation
                            ? new Date(stats.lastViolation).toLocaleTimeString()
                            : t('policy.stats.none'),
                        color: 'var(--accent)',
                        icon: <Clock size={20} />,
                    },
                    {
                        label: t('policy.stat_active_policies'),
                        value: policies.length,
                        color: 'var(--success)',
                        icon: <Shield size={20} />,
                    },
                ].map((stat) => (
                    <div key={stat.label} style={statCard}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: '0.5rem',
                                color: stat.color,
                            }}
                        >
                            {stat.icon}
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: 'var(--slate-400)',
                                }}
                            >
                                {stat.label}
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                            }}
                        >
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder={t('policy.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.85rem 1rem 0.85rem 2.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 12,
                            color: 'white',
                            fontSize: '0.9rem',
                            outline: 'none',
                        }}
                    />
                </div>
                <button
                    onClick={() => setShowViolations(!showViolations)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.85rem 1.25rem',
                        borderRadius: 12,
                        fontWeight: 700,
                        background: showViolations
                            ? 'rgba(239,68,68,0.1)'
                            : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${showViolations ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: showViolations ? '#ef4444' : '#e2e8f0',
                        cursor: 'pointer',
                    }}
                >
                    {showViolations ? <EyeOff size={16} /> : <Eye size={16} />}{' '}
                    {showViolations
                        ? t('policy.hide_violations')
                        : t('policy.show_violations', { count: stats?.activeViolations ?? 0 })}
                </button>
                {violations.length > 0 && (
                    <button
                        onClick={() => {
                            if (
                                !window.confirm(
                                    'Are you sure you want to clear all policy violations?',
                                )
                            )
                                return;
                            policyService.clearViolations();
                            refresh();
                        }}
                        style={{
                            padding: '0.85rem 1.25rem',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Trash2 size={16} /> {t('policy.clear_all')}
                    </button>
                )}
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
                {showViolations && violations.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h4
                            style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: 'var(--slate-50)',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <AlertTriangle size={16} color="#ef4444" />{' '}
                            {t('policy.recent_violations')}
                        </h4>
                        {violations.slice(0, 20).map((v) => (
                            <div
                                key={v.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(239,68,68,0.03)',
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <div
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background:
                                            v.severity === 'critical'
                                                ? '#ef4444'
                                                : v.severity === 'error'
                                                  ? '#f59e0b'
                                                  : '#3b82f6',
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--slate-400)',
                                        fontFamily: 'monospace',
                                        minWidth: 60,
                                    }}
                                >
                                    {v.type}
                                </span>
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: '0.85rem',
                                        color: 'var(--slate-300)',
                                    }}
                                >
                                    {v.detail}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                    {new Date(v.timestamp).toLocaleTimeString()}
                                </span>
                                <button
                                    onClick={() => handleResolveViolation(v.id)}
                                    style={{
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: 6,
                                        fontSize: '0.7rem',
                                        background: 'var(--success-tint)',
                                        border: '1px solid rgba(16,185,129,0.2)',
                                        color: 'var(--success)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('policy.resolve')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'policies' ? (
                    filteredPolicies.length === 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                                height: '100%',
                                color: 'var(--slate-500)',
                            }}
                        >
                            <Shield size={48} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                {searchQuery ? t('policy.empty_search') : t('policy.empty_none')}
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: '1rem',
                            }}
                        >
                            <AnimatePresence>
                                {filteredPolicies.map((policy) => {
                                    const typeColor = getPolicyDimensionColor(policy.type);
                                    const actionColor = getPolicyDimensionColor(policy.action);
                                    const meta =
                                        POLICY_TYPE_LABELS[policy.type] ||
                                        POLICY_TYPE_LABELS.custom;
                                    const actionLabelKey =
                                        ACTION_LABELS[policy.action as PolicyAction] ||
                                        'policy.action_warn';
                                    return (
                                        <motion.div
                                            key={policy.id}
                                            layoutId={policy.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{
                                                padding: '1.5rem',
                                                borderRadius: 16,
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                background: 'rgba(255,255,255,0.02)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: 12,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 10,
                                                            background: `${typeColor}15`,
                                                            border: `1px solid ${typeColor}30`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1.2rem',
                                                        }}
                                                    >
                                                        {meta.icon}
                                                    </div>
                                                    <div>
                                                        <h4
                                                            style={{
                                                                fontSize: '1rem',
                                                                fontWeight: 700,
                                                                margin: 0,
                                                                color: 'var(--slate-50)',
                                                            }}
                                                        >
                                                            {t(meta.labelKey)}
                                                        </h4>
                                                        <span
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                color: 'var(--slate-500)',
                                                                fontFamily: 'monospace',
                                                            }}
                                                        >
                                                            {policy.id}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                    <button
                                                        onClick={() =>
                                                            setEditingPolicy({ ...policy })
                                                        }
                                                        style={{
                                                            padding: '0.4rem',
                                                            borderRadius: 8,
                                                            background: 'rgba(59,130,246,0.05)',
                                                            border: '1px solid rgba(59,130,246,0.2)',
                                                            color: 'var(--accent)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(policy.id)}
                                                        style={{
                                                            padding: '0.4rem',
                                                            borderRadius: 8,
                                                            background: 'rgba(239,68,68,0.05)',
                                                            border: '1px solid rgba(239,68,68,0.2)',
                                                            color: 'var(--error)',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    fontSize: '0.8rem',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '0.3rem 0.6rem',
                                                        borderRadius: 6,
                                                        background: `${actionColor}15`,
                                                        border: `1px solid ${actionColor}30`,
                                                        color: actionColor,
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                    }}
                                                >
                                                    {t(actionLabelKey)}
                                                </div>
                                                <div style={{ color: 'var(--slate-400)' }}>
                                                    {t('policy.target_label')}:{' '}
                                                    <span style={{ color: 'var(--slate-200)' }}>
                                                        {policy.target_nodes?.join(', ') || 'all'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--slate-300)',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '0.75rem',
                                                    borderRadius: 8,
                                                    fontFamily: 'monospace',
                                                }}
                                            >
                                                {t('policy.value_label')}:{' '}
                                                <span style={{ color: 'var(--warning)' }}>
                                                    {typeof policy.value === 'object'
                                                        ? JSON.stringify(policy.value)
                                                        : String(policy.value)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                            gap: '1.5rem',
                        }}
                    >
                        {patterns.map((pattern) => (
                            <div key={pattern.id} className="glass-panel" style={patternCard}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '1rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background:
                                                    pattern.type === 'pii'
                                                        ? '#10b981'
                                                        : pattern.type === 'blocklist'
                                                          ? '#ef4444'
                                                          : '#a855f7',
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                color:
                                                    pattern.type === 'pii'
                                                        ? '#10b981'
                                                        : pattern.type === 'blocklist'
                                                          ? '#ef4444'
                                                          : '#a855f7',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {pattern.type}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => setEditingPattern(pattern)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--slate-500)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePattern(pattern.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--error)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-50)',
                                        marginBottom: '0.5rem',
                                    }}
                                >
                                    {pattern.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--slate-400)',
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '0.75rem',
                                        borderRadius: 8,
                                        fontFamily: 'monospace',
                                        marginBottom: '0.75rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {pattern.pattern}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                    {t('policy.replacement_label')}:{' '}
                                    <span style={{ color: 'var(--slate-200)' }}>
                                        {pattern.replacement}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ModalShell open={editingPolicy !== null} onClose={() => setEditingPolicy(null)}>
                {(() => {
                    const p = editingPolicy;
                    if (!p) return null;
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div
                                style={{
                                    padding: '2rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        margin: 0,
                                        color: 'var(--slate-50)',
                                    }}
                                >
                                    {p.id ? t('policy.edit_title') : t('policy.new_title')}
                                </h3>
                                <button
                                    onClick={() => setEditingPolicy(null)}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-200)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div
                                style={{
                                    padding: '2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                }}
                            >
                                <div>
                                    <label style={modalLabelUppercase}>
                                        {t('policy.form_type')}
                                    </label>
                                    <select
                                        value={p.type}
                                        onChange={(e) =>
                                            setEditingPolicy({
                                                ...p,
                                                type: e.target.value as PolicyType,
                                            })
                                        }
                                        style={modalFormSelect}
                                    >
                                        {Object.entries(POLICY_TYPE_LABELS).map(([key, meta]) => (
                                            <option key={key} value={key}>
                                                {meta.icon} {t(meta.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={modalLabelUppercase}>
                                        {t('policy.form_action')}
                                    </label>
                                    <select
                                        value={p.action}
                                        onChange={(e) =>
                                            setEditingPolicy({
                                                ...p,
                                                action: e.target.value as PolicyAction,
                                            })
                                        }
                                        style={modalFormSelect}
                                    >
                                        {Object.entries(ACTION_LABELS).map(([key, labelKey]) => (
                                            <option key={key} value={key}>
                                                {t(labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={modalLabelUppercase}>
                                        {t('policy.form_target')}
                                    </label>
                                    <input
                                        type="text"
                                        value={(p.target_nodes || []).join(', ')}
                                        onChange={(e) =>
                                            setEditingPolicy({
                                                ...p,
                                                target_nodes: e.target.value
                                                    .split(',')
                                                    .map((s) => s.trim())
                                                    .filter(Boolean) || ['all'],
                                            })
                                        }
                                        style={modalFormSelect}
                                    />
                                </div>
                                <div>
                                    <label style={modalLabelUppercase}>
                                        {t('policy.form_threshold')}
                                    </label>
                                    <input
                                        type="text"
                                        value={String(p.value ?? '')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const num = parseFloat(val);
                                            setEditingPolicy({
                                                ...p,
                                                value: isNaN(num) ? val : num,
                                            });
                                        }}
                                        style={modalFormSelect}
                                    />
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: '1.5rem 2rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '1rem',
                                }}
                            >
                                <button
                                    onClick={() => setEditingPolicy(null)}
                                    style={{
                                        padding: '0.8rem 1.5rem',
                                        borderRadius: 12,
                                        fontWeight: 700,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-200)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('policy.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    style={{
                                        padding: '0.8rem 2rem',
                                        borderRadius: 12,
                                        fontWeight: 800,
                                        background: 'linear-gradient(90deg, #10b981, #059669)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('policy.save')}
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </ModalShell>
            <ModalShell open={editingPattern !== null} onClose={() => setEditingPattern(null)}>
                {(() => {
                    const pat = editingPattern;
                    if (!pat) return null;
                    return (
                        <div>
                            <h3
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-50)',
                                    marginBottom: '1.5rem',
                                }}
                            >
                                {pat.id
                                    ? t('policy.edit_pattern_title')
                                    : t('policy.new_pattern_title')}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        {t('policy.form_type')}
                                    </label>
                                    <select
                                        value={pat.type || 'pii'}
                                        onChange={(e) =>
                                            setEditingPattern({
                                                ...pat,
                                                type: e.target.value as SecurityPattern['type'],
                                            })
                                        }
                                        style={formFieldWhite}
                                    >
                                        <option value="pii">{t('policy.pattern_pii')}</option>
                                        <option value="toxic">{t('policy.pattern_toxic')}</option>
                                        <option value="blocklist">
                                            {t('policy.pattern_blocklist')}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        {t('policy.form_label')}
                                    </label>
                                    <input
                                        type="text"
                                        value={pat.label}
                                        onChange={(e) =>
                                            setEditingPattern({ ...pat, label: e.target.value })
                                        }
                                        style={formFieldWhite}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        {t('policy.form_pattern')}
                                    </label>
                                    <textarea
                                        value={pat.pattern}
                                        onChange={(e) =>
                                            setEditingPattern({ ...pat, pattern: e.target.value })
                                        }
                                        style={textareaDark}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-500)',
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                        }}
                                    >
                                        {t('policy.form_replacement')}
                                    </label>
                                    <input
                                        type="text"
                                        value={pat.replacement}
                                        onChange={(e) =>
                                            setEditingPattern({
                                                ...pat,
                                                replacement: e.target.value,
                                            })
                                        }
                                        style={formFieldWhite}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    onClick={() => setEditingPattern(null)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 12,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('policy.cancel')}
                                </button>
                                <button
                                    onClick={handleSavePattern}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 12,
                                        background: 'var(--success)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('policy.save_pattern')}
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </ModalShell>
            <ModuleInfo moduleKey="policy" />
            <ConfirmDialog />
        </div>
    );
};

export default PolicyPanel;
