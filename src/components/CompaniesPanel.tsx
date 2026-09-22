import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Server, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { useFrontierStore } from '../stores/frontierStore';

interface GatewayAgent {
    id: string;
    name: string;
    title?: string;
    managerId: string | null;
    monthlyBudgetCents: number | null;
    status: string;
}

interface GatewayCompany {
    id: string;
    name: string;
    mission: string;
    status: string;
    heartbeats: number;
    monthlyBudgetCents: number | null;
    agents?: GatewayAgent[];
}

const URL_KEY = 'companyGateway.url';
const SECRET_KEY = 'companyGateway.secret';
const DEFAULT_URL = 'http://localhost:3001';

function loadCfg(): { url: string; secret: string } {
    try {
        return {
            url: localStorage.getItem(URL_KEY) || DEFAULT_URL,
            secret: localStorage.getItem(SECRET_KEY) || '',
        };
    } catch {
        return { url: DEFAULT_URL, secret: '' };
    }
}

async function fetchJson(url: string, secret: string): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<unknown>;
}

const CompaniesPanel: React.FC = () => {
    const { t } = useTranslation();
    const localOrgs = useFrontierStore((s) => s.orgs);
    const refreshLocal = useFrontierStore((s) => s.refresh);
    const [url, setUrl] = useState(() => loadCfg().url);
    const [secret, setSecret] = useState(() => loadCfg().secret);
    const [companies, setCompanies] = useState<GatewayCompany[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = (await fetchJson(
                `${url.replace(/\/$/, '')}/api/companies`,
                secret,
            )) as { companies?: GatewayCompany[] };
            const list = Array.isArray(data.companies) ? data.companies : [];
            setCompanies(list);
            setUsingFallback(false);
            if (list.length > 0 && !list.some((c) => c.id === selectedId)) {
                const first = list[0];
                if (first) setSelectedId(first.id);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setUsingFallback(true);
            setCompanies([]);
            try {
                await refreshLocal();
            } catch {
                /* local fallback best-effort */
            }
        } finally {
            setLoading(false);
        }
    }, [url, secret, selectedId, refreshLocal]);

    useEffect(() => {
        try {
            localStorage.setItem(URL_KEY, url);
            localStorage.setItem(SECRET_KEY, secret);
        } catch {
            /* private mode */
        }
    }, [url, secret]);

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selected = companies.find((c) => c.id === selectedId) || null;
    const agents = selected?.agents || [];

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Server size={20} />
                <h2 style={{ margin: 0 }}>{t('companies.title')}</h2>
                <button
                    onClick={() => void load()}
                    disabled={loading}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />}
                    {t('companies.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('companies.url')}
                    style={{ flex: '2 1 240px' }}
                />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('companies.secret')}
                    type="password"
                    style={{ flex: '2 1 200px' }}
                />
                <button onClick={() => void load()}>{t('companies.connect')}</button>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#f59e0b', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} />
                    <span>
                        {t('companies.no_gateway')}: {error}. {t('companies.local_fallback')}
                    </span>
                </div>
            )}

            {usingFallback ? (
                <ul>
                    {localOrgs.map((o) => (
                        <li key={o.id}>
                            {o.name} — {o.mission.slice(0, 120)}
                        </li>
                    ))}
                    {localOrgs.length === 0 && <li>{t('companies.empty')}</li>}
                </ul>
            ) : loading && companies.length === 0 ? (
                <div>{t('companies.loading')}</div>
            ) : companies.length === 0 ? (
                <div>{t('companies.empty')}</div>
            ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <ul style={{ flex: '1 1 300px', listStyle: 'none', padding: 0, margin: 0 }}>
                        {companies.map((c) => (
                            <li key={c.id} style={{ marginBottom: 6 }}>
                                <button
                                    onClick={() => setSelectedId(c.id)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        fontWeight: c.id === selectedId ? 700 : 400,
                                    }}
                                >
                                    {c.name} · hb:{c.heartbeats} · {(c.agents || []).length} {t('companies.agents')}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {selected && (
                        <div style={{ flex: '2 1 400px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                            <h3 style={{ marginTop: 0 }}>{selected.name}</h3>
                            <div style={{ color: '#64748b', marginBottom: 8 }}>{selected.mission}</div>
                            <div style={{ marginBottom: 8 }}>
                                {t('companies.heartbeats')}: {selected.heartbeats} · {t('companies.budget')}:{' '}
                                {selected.monthlyBudgetCents === null || selected.monthlyBudgetCents === undefined
                                    ? t('companies.unlimited')
                                    : `${selected.monthlyBudgetCents}¢`}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <Users size={14} />
                                <strong>
                                    {agents.length} {t('companies.agents')}
                                </strong>
                            </div>
                            <ul>
                                {agents.map((a) => (
                                    <li key={a.id}>
                                        {a.name}
                                        {a.title ? ` (${a.title})` : ''} — {a.status}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CompaniesPanel;
