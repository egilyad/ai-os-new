import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface Company {
    id: string;
    name: string;
}

interface Agent {
    id: string;
    name: string;
}

interface Budget {
    budget: number | null;
    spent: number;
    remaining: number | null;
    over: boolean;
    month: string;
}

interface CostEvent {
    id: string;
    agentId: string | null;
    taskId: string | null;
    model: string | null;
    cents: number;
    createdAt: number;
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

const CostsPanel: React.FC = () => {
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
    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentId, setAgentId] = useState('');
    const [budget, setBudget] = useState<Budget | null>(null);
    const [costs, setCosts] = useState<CostEvent[]>([]);
    const [cents, setCents] = useState('');
    const [model, setModel] = useState('');
    const [newBudget, setNewBudget] = useState('');
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

    const loadMoney = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        try {
            const bq = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
            const cq = agentId ? `?agentId=${encodeURIComponent(agentId)}&limit=100` : '?limit=100';
            const [b, c, a] = await Promise.all([
                api<{ budget?: Budget }>(base, secret, `/api/companies/${companyId}/budget${bq}`),
                api<{ costs?: CostEvent[] }>(base, secret, `/api/companies/${companyId}/costs${cq}`),
                api<{ agents?: Agent[] }>(base, secret, `/api/companies/${companyId}/agents`),
            ]);
            setBudget(b.budget || null);
            setCosts(Array.isArray(c.costs) ? c.costs : []);
            setAgents(Array.isArray(a.agents) ? a.agents : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [base, secret, companyId, agentId]);

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
        void loadMoney();
    }, [loadMoney]);

    async function recordCost() {
        const n = Number(cents);
        if (!companyId || !Number.isFinite(n) || n < 0) return;
        setError(null);
        setNotice(null);
        try {
            await api(base, secret, `/api/companies/${companyId}/costs`, {
                method: 'POST',
                body: JSON.stringify({ agentId: agentId || null, model: model || null, cents: n }),
            });
            setCents('');
            setNotice(t('costs.recorded'));
            await loadMoney();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    async function saveBudget() {
        if (!companyId) return;
        setError(null);
        try {
            const v = newBudget.trim() === '' ? null : Number(newBudget);
            if (v !== null && (!Number.isFinite(v) || v < 0)) {
                setError(t('costs.bad_amount'));
                return;
            }
            await api(base, secret, `/api/companies/${companyId}/budget`, {
                method: 'PUT',
                body: JSON.stringify({ monthlyBudgetCents: v }),
            });
            setNewBudget('');
            setNotice(t('costs.budget_saved'));
            await loadMoney();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <DollarSign size={20} />
                <h2 style={{ margin: 0 }}>{t('costs.title')}</h2>
                <button onClick={() => void loadMoney()} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />} {t('costs.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('costs.url')} style={{ flex: '2 1 200px' }} />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('costs.secret')}
                    type="password"
                    style={{ flex: '1 1 160px' }}
                />
                <button onClick={() => void loadCompanies()}>{t('costs.connect')}</button>
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                    <option value="">{t('costs.pick_company')}</option>
                    {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={agentId} onChange={(e) => setAgentId(e.target.value)}>
                    <option value="">{t('costs.whole_company')}</option>
                    {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
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

            {budget && (
                <div
                    style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '1rem',
                        marginBottom: '1rem',
                        background: budget.over ? '#fef2f2' : undefined,
                    }}
                >
                    <strong>
                        {budget.month}: {budget.spent}¢ /{' '}
                        {budget.budget === null ? t('costs.unlimited') : `${budget.budget}¢`}
                    </strong>
                    {budget.over && <span style={{ color: '#dc2626' }}> · {t('costs.over')}</span>}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={cents} onChange={(e) => setCents(e.target.value)} placeholder={t('costs.cents_ph')} style={{ width: 120 }} />
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={t('costs.model_ph')} style={{ flex: '1 1 140px' }} />
                <button onClick={() => void recordCost()} disabled={!companyId}>
                    {t('costs.record')}
                </button>
                <input
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder={t('costs.budget_ph')}
                    style={{ width: 140 }}
                />
                <button onClick={() => void saveBudget()} disabled={!companyId}>
                    {t('costs.set_budget')}
                </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {costs
                    .slice()
                    .reverse()
                    .map((c) => (
                        <li key={c.id} style={{ marginBottom: 4 }}>
                            {c.cents}¢{c.model ? ` · ${c.model}` : ''}
                            {c.agentId ? ` · ${c.agentId}` : ''} ·{' '}
                            {new Date(c.createdAt).toLocaleString()}
                        </li>
                    ))}
                {costs.length === 0 && <li>{t('costs.empty')}</li>}
            </ul>
        </div>
    );
};

export default CostsPanel;
