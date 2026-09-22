import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface ApprovalComment {
    author: string | null;
    text: string;
    createdAt: number;
}

interface Approval {
    id: string;
    kind: string;
    status: string;
    payload: Record<string, unknown>;
    requesterAgentId: string | null;
    comments: ApprovalComment[];
    executedAgentId: string | null;
    decidedBy: string | null;
}

interface Company {
    id: string;
    name: string;
}

const URL_KEY = 'companyGateway.url';
const SECRET_KEY = 'companyGateway.secret';

async function api<T>(base: string, secret: string, p: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;
    const r = await fetch(base + p, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
    const body = (await r.json().catch(() => ({}))) as unknown;
    if (!r.ok) {
        const msg = (body as { error?: string }).error || `HTTP ${r.status}`;
        throw new Error(msg);
    }
    return body as T;
}

const ApprovalsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [url, setUrl] = useState(() => {
        try {
            return localStorage.getItem(URL_KEY) || 'http://localhost:3001';
        } catch {
            return 'http://localhost:3001';
        }
    });
    const [secret, setSecret] = useState(() => {
        try {
            return localStorage.getItem(SECRET_KEY) || '';
        } catch {
            return '';
        }
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [decider, setDecider] = useState('board');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const base = url.replace(/\/$/, '');

    const loadCompanies = useCallback(async () => {
        setError(null);
        try {
            const data = await api<{ companies?: Company[] }>(base, secret, '/api/companies');
            const list = Array.isArray(data.companies) ? data.companies : [];
            setCompanies(list);
            if (list.length > 0 && !list.some((c) => c.id === companyId)) {
                const first = list[0];
                if (first) setCompanyId(first.id);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setCompanies([]);
        }
    }, [base, secret, companyId]);

    const loadApprovals = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        try {
            const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
            const data = await api<{ approvals?: Approval[] }>(
                base,
                secret,
                `/api/companies/${companyId}/approvals${q}`,
            );
            setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [base, secret, companyId, statusFilter]);

    useEffect(() => {
        try {
            localStorage.setItem(URL_KEY, url);
            localStorage.setItem(SECRET_KEY, secret);
        } catch {
            /* private mode */
        }
    }, [url, secret]);

    useEffect(() => {
        void loadCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void loadApprovals();
    }, [loadApprovals]);

    const selected = approvals.find((a) => a.id === selectedId) || null;
    const isPending = selected?.status === 'pending';

    function patchSelected(next: Approval) {
        setApprovals((prev) => prev.map((a) => (a.id === next.id ? next : a)));
    }

    async function sendComment() {
        if (!selected || !comment.trim()) return;
        setError(null);
        try {
            const data = await api<{ approval?: Approval }>(base, secret, `/api/approvals/${selected.id}/comments`, {
                method: 'POST',
                body: JSON.stringify({ author: decider, text: comment }),
            });
            if (data.approval) patchSelected(data.approval);
            setComment('');
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    async function decide(decision: 'approved' | 'rejected') {
        if (!selected) return;
        setError(null);
        setNotice(null);
        try {
            const data = await api<{ approval?: Approval }>(base, secret, `/api/approvals/${selected.id}/decide`, {
                method: 'POST',
                body: JSON.stringify({ decision, by: decider }),
            });
            if (data.approval) patchSelected(data.approval);
            setNotice(decision === 'approved' ? t('approvals.approved') : t('approvals.rejected'));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <ShieldCheck size={20} />
                <h2 style={{ margin: 0 }}>{t('approvals.title')}</h2>
                <button onClick={() => void loadApprovals()} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />} {t('approvals.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('approvals.url')} style={{ flex: '2 1 200px' }} />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('approvals.secret')}
                    type="password"
                    style={{ flex: '1 1 160px' }}
                />
                <button onClick={() => void loadCompanies()}>{t('approvals.connect')}</button>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                    <option value="">{t('approvals.pick_company')}</option>
                    {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('approvals.all')}</option>
                    <option value="pending">{t('approvals.pending')}</option>
                    <option value="approved">{t('approvals.approved')}</option>
                    <option value="rejected">{t('approvals.rejected')}</option>
                </select>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} /> <span>{error}</span>
                </div>
            )}
            {notice && <div style={{ color: '#059669', marginBottom: '1rem' }}>{notice}</div>}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <ul style={{ flex: '1 1 300px', listStyle: 'none', padding: 0, margin: 0 }}>
                    {approvals.map((a) => (
                        <li key={a.id} style={{ marginBottom: 6 }}>
                            <button
                                onClick={() => setSelectedId(a.id)}
                                style={{ width: '100%', textAlign: 'left', fontWeight: a.id === selectedId ? 700 : 400 }}
                            >
                                [{a.status}] {a.kind}
                            </button>
                        </li>
                    ))}
                    {approvals.length === 0 && <li>{t('approvals.empty')}</li>}
                </ul>
                {selected && (
                    <div style={{ flex: '2 1 400px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {selected.kind} · {selected.status}
                        </h3>
                        <pre style={{ background: '#f8fafc', padding: 8, overflowX: 'auto' }}>
                            {JSON.stringify(selected.payload, null, 2)}
                        </pre>
                        {selected.executedAgentId && (
                            <div style={{ marginBottom: 8 }}>→ {selected.executedAgentId}</div>
                        )}
                        <div style={{ marginBottom: 8 }}>
                            <strong>{t('approvals.comments')}:</strong>
                            <ul>
                                {(selected.comments || []).map((c, i) => (
                                    <li key={`${c.createdAt}-${i}`}>
                                        {c.author ? `${c.author}: ` : ''}
                                        {c.text}
                                    </li>
                                ))}
                                {(selected.comments || []).length === 0 && <li>—</li>}
                            </ul>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <input
                                value={decider}
                                onChange={(e) => setDecider(e.target.value)}
                                placeholder={t('approvals.by')}
                                style={{ width: 120 }}
                            />
                            <input
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('approvals.comment_ph')}
                                style={{ flex: '1 1 160px' }}
                            />
                            <button onClick={() => void sendComment()} disabled={!comment.trim()}>
                                {t('approvals.send')}
                            </button>
                            <button onClick={() => void decide('approved')} disabled={!isPending}>
                                {t('approvals.approve')}
                            </button>
                            <button onClick={() => void decide('rejected')} disabled={!isPending}>
                                {t('approvals.reject')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApprovalsPanel;
