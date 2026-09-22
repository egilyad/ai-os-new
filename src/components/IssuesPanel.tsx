import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ListChecks, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface Agent {
    id: string;
    name: string;
}

interface Company {
    id: string;
    name: string;
}

interface Issue {
    id: string;
    title: string;
    parentIssueId: string | null;
    status: string;
    assigneeAgentId: string | null;
    version: number;
    needsVerification?: boolean;
    lastGate?: { verdict: string; confidence: number } | null;
}

interface TreeNode {
    id: string;
    title: string;
}

const URL_KEY = 'companyGateway.url';
const SECRET_KEY = 'companyGateway.secret';

const TRANSITIONS: Record<string, string[]> = {
    backlog: ['todo', 'cancelled'],
    todo: ['in_progress', 'blocked', 'cancelled'],
    in_progress: ['in_review', 'blocked', 'cancelled'],
    in_review: ['done', 'in_progress', 'blocked'],
    blocked: ['todo', 'cancelled'],
    done: [],
    cancelled: [],
};

const GATE_STATUSES = ['in_review', 'done'];

async function api<T>(base: string, secret: string, p: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;
    const r = await fetch(base + p, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
    const body = (await r.json().catch(() => ({}))) as unknown;
    if (!r.ok) {
        const msg = (body as { error?: string }).error || `HTTP ${r.status}`;
        const err = new Error(msg) as Error & { status?: number; body?: unknown };
        err.status = r.status;
        err.body = body;
        throw err;
    }
    return body as T;
}

const IssuesPanel: React.FC = () => {
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
    const [statusFilter, setStatusFilter] = useState('');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [agentId, setAgentId] = useState('');
    const [target, setTarget] = useState('');
    const [confidence, setConfidence] = useState('0.8');
    const [citations, setCitations] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const base = url.replace(/\/$/, '');

    const loadCompanies = useCallback(async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    }, [base, secret, companyId]);

    const loadIssues = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        try {
            const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
            const [iss, ags] = await Promise.all([
                api<{ issues?: Issue[] }>(base, secret, `/api/companies/${companyId}/issues${q}`),
                api<{ agents?: Agent[] }>(base, secret, `/api/companies/${companyId}/agents`),
            ]);
            setIssues(Array.isArray(iss.issues) ? iss.issues : []);
            setAgents(Array.isArray(ags.agents) ? ags.agents : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [base, secret, companyId, statusFilter]);

    const loadTree = useCallback(
        async (iid: string) => {
            try {
                const data = await api<{ tree?: TreeNode[] }>(
                    base,
                    secret,
                    `/api/companies/${companyId}/issues/${iid}/tree`,
                );
                setTree(Array.isArray(data.tree) ? data.tree : []);
            } catch {
                setTree([]);
            }
        },
        [base, secret, companyId],
    );

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
        void loadIssues();
    }, [loadIssues]);

    useEffect(() => {
        if (selectedId) void loadTree(selectedId);
        else setTree([]);
    }, [selectedId, loadTree]);

    const selected = issues.find((i) => i.id === selectedId) || null;
    const targets = selected ? TRANSITIONS[selected.status] || [] : [];
    const needsGate = GATE_STATUSES.includes(target);

    async function doCheckout() {
        if (!selected || !agentId) return;
        setError(null);
        setNotice(null);
        try {
            const data = await api<{ issue?: Issue }>(base, secret, `/api/companies/${companyId}/issues/${selected.id}/checkout`, {
                method: 'POST',
                body: JSON.stringify({ agentId }),
            });
            setNotice(t('issues.checked_out'));
            if (data.issue) {
                setIssues((prev) => prev.map((i) => (i.id === data.issue!.id ? data.issue! : i)));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    async function doTransition() {
        if (!selected || !target) return;
        setError(null);
        setNotice(null);
        try {
            const cites = citations
                .split('\n')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            const body: Record<string, unknown> = { status: target };
            if (agentId) body.agentId = agentId;
            if (needsGate) {
                body.gate = { confidence: Number(confidence), citations: cites };
            }
            const data = await api<{ issue?: Issue; gate?: { verdict: string } }>(
                base,
                secret,
                `/api/companies/${companyId}/issues/${selected.id}/status`,
                { method: 'POST', body: JSON.stringify(body) },
            );
            setNotice(`${t('issues.moved_to')} ${target} · ${data.gate?.verdict || 'ok'}`);
            if (data.issue) {
                setIssues((prev) => prev.map((i) => (i.id === data.issue!.id ? data.issue! : i)));
            }
            setTarget('');
        } catch (e) {
            const st = (e as { status?: number }).status;
            const extra =
                st === 422
                    ? ` → ${( ((e as { body?: { chain?: Array<{ name: string }> } }).body?.chain || []).map((a) => a.name).join('>'))}`
                    : '';
            setError((e instanceof Error ? e.message : String(e)) + extra);
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <ListChecks size={20} />
                <h2 style={{ margin: 0 }}>{t('issues.title')}</h2>
                <button onClick={() => void loadIssues()} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />} {t('issues.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('issues.url')} style={{ flex: '2 1 200px' }} />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('issues.secret')}
                    type="password"
                    style={{ flex: '1 1 160px' }}
                />
                <button onClick={() => void loadCompanies()}>{t('issues.connect')}</button>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                    <option value="">{t('issues.pick_company')}</option>
                    {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('issues.all_statuses')}</option>
                    {Object.keys(TRANSITIONS).map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
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
                    {issues.map((i) => (
                        <li key={i.id} style={{ marginBottom: 6 }}>
                            <button
                                onClick={() => setSelectedId(i.id)}
                                style={{ width: '100%', textAlign: 'left', fontWeight: i.id === selectedId ? 700 : 400 }}
                            >
                                [{i.status}] {i.title}
                                {i.needsVerification ? ' · verify!' : ''}
                            </button>
                        </li>
                    ))}
                    {issues.length === 0 && <li>{t('issues.empty')}</li>}
                </ul>
                {selected && (
                    <div style={{ flex: '2 1 400px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>{selected.title}</h3>
                        <div style={{ color: '#64748b', marginBottom: 8 }}>
                            {selected.status} · v{selected.version}
                            {selected.assigneeAgentId ? ` · ${selected.assigneeAgentId}` : ''}
                        </div>
                        {tree.length > 0 && (
                            <div style={{ marginBottom: 8 }}>{tree.map((n) => n.title).join(' > ')}</div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 8, flexWrap: 'wrap' }}>
                            <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                                <option value="">{t('issues.pick_agent')}</option>
                                {agents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <button onClick={() => void doCheckout()} disabled={!agentId}>
                                {t('issues.checkout')}
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <select value={target} onChange={(e) => setTarget(e.target.value)}>
                                <option value="">{t('issues.pick_status')}</option>
                                {targets.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                            {needsGate && (
                                <>
                                    <input
                                        value={confidence}
                                        onChange={(e) => setConfidence(e.target.value)}
                                        placeholder="0.8"
                                        style={{ width: 70 }}
                                    />
                                    <input
                                        value={citations}
                                        onChange={(e) => setCitations(e.target.value)}
                                        placeholder={t('issues.citations')}
                                        style={{ flex: '1 1 160px' }}
                                    />
                                </>
                            )}
                            <button onClick={() => void doTransition()} disabled={!target}>
                                {t('issues.move')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssuesPanel;
