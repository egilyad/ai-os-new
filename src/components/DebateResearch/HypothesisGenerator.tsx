/**
 * Cognitive-aux / research panel (Experimental).
 * Hypothesis generation playground — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lightbulb, Plus, X, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { hypothesisService } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { useConfirm } from '../../hooks/useConfirm';
import FilterBar from './FilterBar';
import HypothesisCard from './HypothesisCard';
import NewHypothesisModal from './NewHypothesisModal';
import type { ResearchHypothesis } from '../../kernel/types/research-types';
import type { HypothesisCategory, HypothesisStatus } from '../../kernel/types/research-types';
import type { FilterTab } from './hypothesis-constants';

const HypothesisGenerator: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [hypotheses, setHypotheses] = useState<ResearchHypothesis[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [sourceFile, setSourceFile] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [filterTab, setFilterTab] = useState<FilterTab>('all');
    const [statusFilter, setStatusFilter] = useState<HypothesisStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        category: HypothesisCategory;
        sourceFile: string;
    }>({
        title: '',
        description: '',
        category: 'arch',
        sourceFile: '',
    });

    useEffect(() => {
        const source = searchParams.get('source');
        if (source) {
            setSourceFile(source);
            const title = searchParams.get('title') || '';
            setFormData((p) => ({ ...p, sourceFile: source, title }));
            setShowForm(true);
            window.history.replaceState({}, '', '/hypothesis-gen');
        }
    }, [searchParams]);

    const refresh = useCallback(() => {
        setHypotheses(hypothesisService.getAll());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleCreate = async () => {
        if (!formData.description.trim()) return;
        await hypothesisService.propose({
            title: formData.title.trim() || undefined,
            description: formData.description.trim(),
            category: formData.category,
            sourceFile: formData.sourceFile.trim() || undefined,
        });
        setFormData({ title: '', description: '', category: 'arch', sourceFile: '' });
        setShowForm(false);
        refresh();
    };

    const handleDelete = async (id: string) => {
        if (
            !(await confirm({
                title: 'Delete Hypothesis',
                message: 'Are you sure you want to delete this hypothesis?',
                variant: 'danger',
            }))
        )
            return;
        await hypothesisService.remove(id);
        refresh();
    };

    const handleStatusChange = async (id: string, newStatus: HypothesisStatus) => {
        await hypothesisService.setStatus(id, newStatus);
        refresh();
    };

    const handleAddEvidence = async (id: string, text: string) => {
        const h = hypotheses.find((x) => x.id === id);
        if (!h) return;
        await hypothesisService.update(id, {
            evidenceRefs: [...h.evidenceRefs, text],
        });
        refresh();
    };

    const handleRemoveEvidence = async (id: string, idx: number) => {
        const h = hypotheses.find((x) => x.id === id);
        if (!h) return;
        await hypothesisService.update(id, {
            evidenceRefs: h.evidenceRefs.filter((_, i) => i !== idx),
        });
        refresh();
    };

    const startDebate = (hypothesis: ResearchHypothesis) => {
        const thesis = encodeURIComponent(
            `${hypothesis.title}: ${hypothesis.description.slice(0, 200)}`,
        );
        navigate(`/debate?thesis=${thesis}&hypothesisId=${encodeURIComponent(hypothesis.id)}`);
    };

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filtered = useMemo(() => {
        let list = hypotheses;
        if (filterTab !== 'all') list = list.filter((h) => h.category === filterTab);
        if (statusFilter !== 'all') list = list.filter((h) => h.status === statusFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (h) => h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q),
            );
        }
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
    }, [hypotheses, filterTab, statusFilter, searchQuery]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: hypotheses.length };
        for (const cat of ['arch', 'prompt', 'routing', 'gov'] as HypothesisCategory[]) {
            counts[cat] = hypotheses.filter((h) => h.category === cat).length;
        }
        return counts;
    }, [hypotheses]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: hypotheses.length };
        for (const st of [
            'proposed',
            'active',
            'debating',
            'accepted',
            'rejected',
        ] as HypothesisStatus[]) {
            counts[st] = hypotheses.filter((h) => h.status === st).length;
        }
        return counts;
    }, [hypotheses]);

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
                    <Lightbulb size={18} color="#f59e0b" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('hypothesis_generator.title')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {hypotheses.length} total
                    </span>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: 7,
                        border: 'none',
                        background: 'var(--warning)',
                        color: 'var(--slate-800)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                    }}
                >
                    <Plus size={13} /> {t('hypothesis_generator.new')}
                </button>
            </div>

            {/* Filter tabs */}
            <FilterBar
                filterTab={filterTab}
                onFilterTabChange={setFilterTab}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryCounts={categoryCounts}
                statusCounts={statusCounts}
            />

            {/* Search */}
            <div
                style={{ padding: '0.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
            >
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search hypotheses..."
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--slate-200)',
                            fontSize: '0.78rem',
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <X size={11} />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                        <Lightbulb size={40} opacity={0.25} style={{ marginBottom: '0.75rem' }} />
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            {t('hypothesis_generator.empty')}
                        </div>
                    </div>
                ) : (
                    filtered.map((h) => (
                        <HypothesisCard
                            key={h.id}
                            hypothesis={h}
                            isExpanded={expanded.has(h.id)}
                            onToggleExpand={() => toggleExpand(h.id)}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            onStartDebate={startDebate}
                            onAddEvidence={handleAddEvidence}
                            onRemoveEvidence={handleRemoveEvidence}
                        />
                    ))
                )}
            </div>

            {/* New Hypothesis Modal */}
            {showForm && (
                <NewHypothesisModal
                    sourceFile={sourceFile}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onClose={() => setShowForm(false)}
                    onCreate={() => void handleCreate()}
                />
            )}

            <ConfirmDialog />
        </div>
    );
};

export default HypothesisGenerator;
