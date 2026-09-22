import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Webhook, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface AdapterInfo {
    typeKey: string;
    enabled: boolean;
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

function parseJson(text: string): { ok: boolean; value?: unknown; error?: string } {
    if (!text.trim()) return { ok: true, value: {} };
    try {
        return { ok: true, value: JSON.parse(text) as unknown };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
}

const AdaptersPanel: React.FC = () => {
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
    const [adapters, setAdapters] = useState<AdapterInfo[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [companyId, setCompanyId] = useState('');
    const [adapter, setAdapter] = useState('echo');
    const [configText, setConfigText] = useState('{}');
    const [inputText, setInputText] = useState('');
    const [output, setOutput] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const base = url.replace(/\/$/, '');

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [a, c] = await Promise.all([
                api<{ adapters?: AdapterInfo[] }>(base, secret, '/api/adapters'),
                api<{ companies?: Company[] }>(base, secret, '/api/companies'),
            ]);
            setAdapters(Array.isArray(a.adapters) ? a.adapters : []);
            const list = Array.isArray(c.companies) ? c.companies : [];
            setCompanies(list);
            if (list.length > 0 && !list.some((x) => x.id === companyId)) {
                const first = list[0];
                if (first) setCompanyId(first.id);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [base, secret, companyId]);

    useEffect(() => {
        try {
            localStorage.setItem(URL_KEY, url);
            localStorage.setItem(SECRET_KEY, secret);
        } catch {
            /* private mode */
        }
    }, [url, secret]);

    useEffect(() => {
        void loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function runAdapter() {
        if (!companyId) return;
        setError(null);
        setNotice(null);
        setOutput(null);
        const cfg = parseJson(configText);
        if (!cfg.ok) {
            setError(`${t('adapters.bad_json')}: ${cfg.error}`);
            return;
        }
        setLoading(true);
        try {
            const run = await api<{ run?: { id: string } }>(base, secret, `/api/companies/${companyId}/runs`, {
                method: 'POST',
                body: JSON.stringify({ trigger: 'manual', ref: 'ui' }),
            });
            if (!run.run) throw new Error('no run');
            const res = await api<{ stdout?: string }>(base, secret, `/api/runs/${run.run.id}/execute`, {
                method: 'POST',
                body: JSON.stringify({ adapter, config: cfg.value, input: { text: inputText } }),
            });
            setOutput(res.stdout || '');
            setNotice(t('adapters.done'));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Webhook size={20} />
                <h2 style={{ margin: 0 }}>{t('adapters.title')}</h2>
                <button onClick={() => void loadAll()} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />} {t('adapters.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('adapters.url')} style={{ flex: '2 1 200px' }} />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('adapters.secret')}
                    type="password"
                    style={{ flex: '1 1 160px' }}
                />
                <button onClick={() => void loadAll()}>{t('adapters.connect')}</button>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} /> <span>{error}</span>
                </div>
            )}
            {notice && <div style={{ color: '#059669', marginBottom: '1rem' }}>{notice}</div>}

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                {adapters.map((a) => (
                    <li key={a.typeKey}>
                        {a.typeKey} — {a.enabled ? t('adapters.on') : t('adapters.off')}
                    </li>
                ))}
                {adapters.length === 0 && <li>{t('adapters.empty')}</li>}
            </ul>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 8, flexWrap: 'wrap' }}>
                    <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                        <option value="">{t('adapters.pick_company')}</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <select value={adapter} onChange={(e) => setAdapter(e.target.value)}>
                        {adapters.map((a) => (
                            <option key={a.typeKey} value={a.typeKey} disabled={!a.enabled}>
                                {a.typeKey}
                                {a.enabled ? '' : ` (${t('adapters.off')})`}
                            </option>
                        ))}
                        {adapters.length === 0 && <option value="echo">echo</option>}
                    </select>
                    <button onClick={() => void runAdapter()} disabled={loading || !companyId}>
                        {t('adapters.execute')}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <textarea
                        value={configText}
                        onChange={(e) => setConfigText(e.target.value)}
                        placeholder={t('adapters.config_ph')}
                        rows={3}
                        style={{ flex: '1 1 220px', fontFamily: 'monospace' }}
                    />
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t('adapters.input_ph')}
                        rows={3}
                        style={{ flex: '1 1 220px', fontFamily: 'monospace' }}
                    />
                </div>
                {output !== null && (
                    <pre style={{ background: '#f8fafc', padding: 8, overflowX: 'auto', marginTop: 8 }}>{output}</pre>
                )}
            </div>
        </div>
    );
};

export default AdaptersPanel;
