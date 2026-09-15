import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { approvalWorkflowService } from '../../kernel/instances/services-extras';
import type {
    ApprovalPresetConfig,
    ApprovalRequest,
    ApprovalComment,
    ApprovalRequestStatus,
    ApprovalCategory,
} from '../../kernel/types/safety-types';
import { CATEGORY_LABELS, DEFAULT_PRESETS, RISK_LEVELS } from '../../kernel/types/safety-types';

type Tab = 'requests' | 'presets';

const STATUS_COLORS: Record<ApprovalRequestStatus, string> = {
    pending: 'var(--warning)',
    approved: 'var(--success)',
    rejected: 'var(--error)',
    expired: 'var(--slate-500)',
    auto_approved: 'var(--info)',
};

const RISK_COLORS: Record<string, string> = {
    low: 'var(--success)',
    medium: 'var(--warning)',
    high: '#f97316',
    critical: 'var(--error)',
};

export function ApprovalPanel() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('requests');
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [presets, setPresets] = useState<ApprovalPresetConfig[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
    const [comments, setComments] = useState<ApprovalComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [statusFilter, setStatusFilter] = useState<ApprovalRequestStatus | 'all'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [reqs, pres] = await Promise.all([
                approvalWorkflowService.listRequests(),
                approvalWorkflowService.listPresets(),
            ]);
            setRequests(reqs);
            setPresets(pres);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const loadComments = useCallback(async (requestId: string) => {
        const c = await approvalWorkflowService.getComments(requestId);
        setComments(c);
    }, []);

    useEffect(() => {
        if (selectedRequest) loadComments(selectedRequest.id);
    }, [selectedRequest, loadComments]);

    const handleApprove = async (id: string) => {
        await approvalWorkflowService.approveRequest(id, 'human');
        await load();
        if (selectedRequest?.id === id) setSelectedRequest(null);
    };

    const handleReject = async (id: string) => {
        await approvalWorkflowService.rejectRequest(id, 'human', 'Rejected by human');
        await load();
        if (selectedRequest?.id === id) setSelectedRequest(null);
    };

    const handleBulkApprove = async () => {
        const ids = Array.from(selectedIds);
        await approvalWorkflowService.bulkApprove(ids, 'human');
        setSelectedIds(new Set());
        await load();
    };

    const handleBulkReject = async () => {
        const ids = Array.from(selectedIds);
        await approvalWorkflowService.bulkReject(ids, 'human', 'Bulk rejected');
        setSelectedIds(new Set());
        await load();
    };

    const handleAddComment = async () => {
        if (!selectedRequest || !newComment.trim()) return;
        await approvalWorkflowService.addComment(selectedRequest.id, 'human', 'user', newComment.trim());
        setNewComment('');
        await loadComments(selectedRequest.id);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(r => r.id)));
        }
    };

    const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    if (loading) return <div style={{ padding: 16, color: 'var(--slate-400)' }}>{t('approval.loading')}</div>;
    if (error) return <div style={{ padding: 16, color: 'var(--error)' }}>{error}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--slate-100)' }}>{t('approval.title')}</h2>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                        {pendingCount} {t('approval.pending_count')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab('requests')}>
                        {t('approval.tab_requests')}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab('presets')}>
                        {t('approval.tab_presets')}
                    </button>
                </div>
            </header>

            {tab === 'requests' && (
                <>
                    {/* Filters + Bulk */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as ApprovalRequestStatus | 'all')}
                            className="btn btn-ghost btn-sm"
                        >
                            <option value="all">{t('approval.filter_all')}</option>
                            {(['pending', 'approved', 'rejected', 'expired', 'auto_approved'] as const).map(s => (
                                <option key={s} value={s}>{t(`approval.status.${s}`)}</option>
                            ))}
                        </select>
                        {selectedIds.size > 0 && (
                            <>
                                <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                                    {selectedIds.size} {t('approval.selected')}
                                </span>
                                <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }} onClick={handleBulkApprove}>
                                    {t('approval.bulk_approve')}
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={handleBulkReject}>
                                    {t('approval.bulk_reject')}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Request List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filtered.length === 0 && (
                            <div style={{ color: 'var(--slate-500)', padding: 16, textAlign: 'center' }}>
                                {t('approval.empty')}
                            </div>
                        )}
                        {filtered.map(req => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem',
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer', flexWrap: 'wrap',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(req.id)}
                                    onChange={e => { e.stopPropagation(); toggleSelect(req.id); }}
                                    onClick={e => e.stopPropagation()}
                                />
                                <span style={{ flex: 1, color: 'var(--slate-100)', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {req.toolName}
                                </span>
                                <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                                    {t(`approval.category.${req.category}`)}
                                </span>
                                <span style={{ color: RISK_COLORS[req.riskLevel] ?? 'var(--slate-400)', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {req.riskLevel}
                                </span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                                    color: '#fff', background: STATUS_COLORS[req.status],
                                }}>
                                    {t(`approval.status.${req.status}`)}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {tab === 'presets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {presets.map(p => (
                        <div
                            key={p.id}
                            style={{
                                padding: '0.75rem', background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--slate-100)', fontWeight: 600 }}>{p.name}</span>
                                {p.isDefault && (
                                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', background: 'var(--info)', color: '#fff' }}>
                                        {t('approval.default')}
                                    </span>
                                )}
                            </div>
                            <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem', marginTop: 4 }}>{p.description}</div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                                {Object.entries(p.categoryDefaults).map(([cat, action]) => (
                                    <span key={cat} style={{
                                        padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem',
                                        background: action === 'auto_approve' ? 'var(--success)' : action === 'deny' ? 'var(--error)' : 'var(--warning)',
                                        color: '#fff',
                                    }}>
                                        {t(`approval.category.${cat}`)}: {t(`approval.action.${action}`)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                    onClick={() => setSelectedRequest(null)}
                >
                    <div
                        style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)', padding: 16, maxWidth: 500, width: '100%',
                            display: 'flex', flexDirection: 'column', gap: 12,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, color: 'var(--slate-100)' }}>{selectedRequest.toolName}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRequest(null)}>×</button>
                        </div>
                        <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>{selectedRequest.description}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem' }}>
                            <span>{t('approval.agent')}: {selectedRequest.agentId}</span>
                            <span>{t('approval.category_label')}: {t(`approval.category.${selectedRequest.category}`)}</span>
                            <span style={{ color: RISK_COLORS[selectedRequest.riskLevel] }}>{selectedRequest.riskLevel}</span>
                        </div>
                        {selectedRequest.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }} onClick={() => handleApprove(selectedRequest.id)}>
                                    {t('approval.approve')}
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleReject(selectedRequest.id)}>
                                    {t('approval.reject')}
                                </button>
                            </div>
                        )}
                        {/* Comments */}
                        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 8 }}>
                            <h4 style={{ margin: '0 0 8px', color: 'var(--slate-200)', fontSize: '0.8rem' }}>{t('approval.comments')}</h4>
                            {comments.map(c => (
                                <div key={c.id} style={{ padding: '4px 0', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                                    <strong>{c.authorId}</strong>: {c.content}
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder={t('approval.comment_placeholder')}
                                    style={{
                                        flex: 1, padding: '4px 8px', background: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                                        color: 'var(--slate-100)', fontSize: '0.8rem',
                                    }}
                                />
                                <button className="btn btn-ghost btn-sm" onClick={handleAddComment}>{t('approval.comment_add')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApprovalPanel;
