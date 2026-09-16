import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Gem, Plus, Search, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { crystalVault } from '../../kernel/instances';
import type { Crystal } from '../../kernel/types/crystal-types';
import CrystalCard from './CrystalCard';
import CrystalProposeModal from './CrystalProposeModal';
import { useConfirm } from '../../hooks/useConfirm';

const STATUS_FILTERS = ['all', 'semi', 'crystal', 'superseded', 'refuted'] as const;

const CrystalVaultPanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [crystals, setCrystals] = useState<Crystal[]>([]);
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
    const [search, setSearch] = useState('');
    const [showPropose, setShowPropose] = useState(false);
    const [superseding, setSuperseding] = useState<Crystal | null>(null);

    const refresh = useCallback(async () => {
        setCrystals(await crystalVault.list());
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const filtered = useMemo(() => {
        let list = crystals;
        if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
        if (search.trim()) {
            list = list.filter((c) =>
                c.content.statement.toLowerCase().includes(search.toLowerCase()),
            );
        }
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
    }, [crystals, statusFilter, search]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: crystals.length };
        for (const s of STATUS_FILTERS) {
            if (s === 'all') continue;
            c[s] = crystals.filter((x) => x.status === s).length;
        }
        return c;
    }, [crystals]);

    const handleCrystallize = async (id: string) => {
        await crystalVault.crystallize(id);
        await refresh();
    };

    const handleRefute = async (id: string) => {
        if (
            !(await confirm({
                title: t('lenses_crystal.refute_confirm_title'),
                message: t('lenses_crystal.refute_confirm_message'),
                variant: 'danger',
            }))
        )
            return;
        await crystalVault.refute(id, 'manually refuted by user');
        await refresh();
    };

    const handleSupersede = async (statement: string) => {
        if (!superseding) return;
        await crystalVault.supersede(superseding.crystalId, { statement }, 'manual supersede');
        setSuperseding(null);
        await refresh();
    };

    const handlePropose = async (input: {
        content: {
            statement: string;
            elaboration?: string;
            evidence?: string[];
            assumptions?: string[];
            negationForm?: string;
        };
        originKind: 'debate' | 'observation' | 'synthesis' | 'human' | 'imported';
        originId: string;
        applicableDomain?:
            'arch' | 'prompt' | 'routing' | 'gov' | 'llm' | 'security' | 'economics' | 'general';
    }) => {
        await crystalVault.propose(input);
        await refresh();
    };

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem 1.25rem 0.6rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Gem size={18} color="#10b981" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('lenses_crystal.title')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {crystals.length} {t('lenses_crystal.total')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => void refresh()}
                        title={t('lenses_crystal.refresh')}
                        style={{
                            padding: '0.45rem 0.8rem',
                            borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <RefreshCw size={13} />
                    </button>
                    <button
                        onClick={() => setShowPropose(true)}
                        style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--success)',
                            color: '#022c22',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                        }}
                    >
                        <Plus size={13} /> {t('lenses_crystal.propose')}
                    </button>
                </div>
            </div>

            {/* Status filter + search */}
            <div
                style={{
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                {STATUS_FILTERS.map((s) => {
                    const active = statusFilter === s;
                    const color =
                        s === 'crystal'
                            ? '#10b981'
                            : s === 'refuted'
                              ? '#ef4444'
                              : s === 'superseded'
                                ? '#64748b'
                                : '#8b5cf6';
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: active ? `${color}20` : 'transparent',
                                color: active ? color : 'var(--slate-500)',
                            }}
                        >
                            {s === 'all'
                                ? t('lenses_crystal.filter_all')
                                : t(`lenses_crystal.status_${s}`)}
                            <span style={{ opacity: 0.7 }}> ({counts[s]})</span>
                        </button>
                    );
                })}
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        padding: '4px 8px',
                    }}
                >
                    <Search size={12} color="#64748b" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('lenses_crystal.search')}
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--slate-200)',
                            fontSize: '0.75rem',
                            minWidth: 180,
                        }}
                    />
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                        <Gem size={40} opacity={0.25} style={{ marginBottom: '0.75rem' }} />
                        <div style={{ fontSize: '0.9rem' }}>{t('lenses_crystal.empty')}</div>
                    </div>
                ) : (
                    filtered.map((c) => (
                        <CrystalCard
                            key={`${c.crystalId}-${c.version}`}
                            crystal={c}
                            onCrystallize={handleCrystallize}
                            onSupersede={setSuperseding}
                            onRefute={handleRefute}
                        />
                    ))
                )}
            </div>

            {showPropose && (
                <CrystalProposeModal
                    onClose={() => setShowPropose(false)}
                    onPropose={handlePropose}
                />
            )}

            {superseding && (
                <SupersedeModal
                    crystal={superseding}
                    onClose={() => setSuperseding(null)}
                    onConfirm={handleSupersede}
                />
            )}

            <ConfirmDialog />
        </div>
    );
};

const SupersedeModal: React.FC<{
    crystal: Crystal;
    onClose: () => void;
    onConfirm: (statement: string) => void;
}> = ({ crystal, onClose, onConfirm }) => {
    const { t } = useTranslation();
    const [statement, setStatement] = useState('');
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 460,
                    maxWidth: '90vw',
                    background: 'var(--slate-800)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1.25rem',
                }}
            >
                <div
                    style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--slate-50)',
                        marginBottom: '0.75rem',
                    }}
                >
                    {t('lenses_crystal.supersede')}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginBottom: '0.5rem' }}>
                    {crystal.content.statement}
                </div>
                <textarea
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    rows={3}
                    placeholder={t('lenses_crystal.supersede_hint')}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        padding: '0.5rem 0.6rem',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        marginBottom: '0.75rem',
                    }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => statement.trim() && onConfirm(statement.trim())}
                        disabled={!statement.trim()}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--warning)',
                            color: 'var(--slate-800)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            opacity: statement.trim() ? 1 : 0.5,
                        }}
                    >
                        {t('lenses_crystal.save')}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                        }}
                    >
                        {t('lenses_crystal.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrystalVaultPanel;
