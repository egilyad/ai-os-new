import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface RunEvent {
    t: number;
    step: string;
    detail: string;
}

interface Run {
    id: string;
    agentId: string | null;
    trigger: string;
    ref: string | null;
    wakeupId: string | null;
    status: string;
    events: RunEvent[];
    createdAt: number;
    finishedAt: number | null;
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

const RunsPanel: React.FC = () => {
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
    const [runs, setRuns] = useState<Run[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const loadRuns = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        try {
            const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}&limit=50` : '?limit=50';
            const data = await api<{ runs?: Run[] }>(base, secret, `/api/companies/${companyId}/runs${q}`);
            const list = Array.isArray(data.runs) ? data.runs.slice().reverse() : [];
            setRuns(list);
            if (list.length > 0 && !list.some((x) => x.id === selectedId)) {
                const first = list[0];
                if (first) setSelectedId(first.id);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [base, secret, companyId, statusFilter, selectedId]);

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
        void loadRuns();
    }, [loadRuns]);

    const selected = runs.find((x) => x.id === selectedId) || null;

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Activity size={20} />
                <h2 style={{ margin: 0 }}>{t('runs.title')}</h2>
                <button onClick={() => void loadRuns()} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />} {t('runs.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('runs.url')} style={{ flex: '2 1 200px' }} />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('runs.secret')}
                    type="password"
                    style={{ flex: '1 1 160px' }}
                />
                <button onClick={() => void loadCompanies()}>{t('runs.connect')}</button>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                    <option value="">{t('runs.pick_company')}</option>
                    {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('runs.all')}</option>
                    <option value="running">running</option>
                    <option value="done">done</option>
                    <option value="error">error</option>
                </select>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} /> <span>{error}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <ul style={{ flex: '1 1 300px', listStyle: 'none', padding: 0, margin: 0 }}>
                    {runs.map((x) => (
                        <li key={x.id} style={{ marginBottom: 6 }}>
                            <button
                                onClick={() => setSelectedId(x.id)}
                                style={{ width: '100%', textAlign: 'left', fontWeight: x.id === selectedId ? 700 : 400 }}
                            >
                                [{x.status}] {x.trigger}
                                {x.agentId ? ` · ${x.agentId.slice(0, 14)}` : ''}
                            </button>
                        </li>
                    ))}
                    {runs.length === 0 && <li>{t('runs.empty')}</li>}
                </ul>
                {selected && (
                    <div style={{ flex: '2 1 400px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {selected.trigger} · {selected.status}
                        </h3>
                        <div style={{ color: '#64748b', marginBottom: 8 }}>
                            {new Date(selected.createdAt).toLocaleString()}
                            {selected.ref ? ` · ${selected.ref}` : ''}
                        </div>
                        <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
                            {(selected.events || []).map((e, i) => (
                                <li key={`${e.t}-${i}`} style={{ marginBottom: 4 }}>
                                    <strong>{e.step}</strong> — {e.detail}
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RunsPanel;
