import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Share2, Loader2, AlertTriangle, Download, Upload } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { downloadFile } from '../utils/chat-export';

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

const PortabilityPanel: React.FC = () => {
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
    const [collision, setCollision] = useState('rename');
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

    async function doExport() {
        if (!companyId) return;
        setError(null);
        setNotice(null);
        setLoading(true);
        try {
            const data = await api<{ manifest?: unknown }>(base, secret, `/api/companies/${companyId}/export`);
            const name = companies.find((c) => c.id === companyId)?.name || companyId;
            downloadFile(JSON.stringify(data.manifest, null, 2), `${name}-company.json`, 'application/json;charset=utf-8');
            setNotice(t('portability.exported'));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    async function doImport(file: File | undefined) {
        if (!file) return;
        setError(null);
        setNotice(null);
        setLoading(true);
        try {
            const text = await file.text();
            const manifest = JSON.parse(text) as unknown;
            const data = await api<{ skipped?: boolean; company?: Company }>(base, secret, '/api/companies/import', {
                method: 'POST',
                body: JSON.stringify({ manifest, collision }),
            });
            if (data.skipped) setNotice(t('portability.skipped'));
            else {
                setNotice(`${t('portability.imported')}: ${data.company?.name || ''}`);
                await loadCompanies();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Share2 size={20} />
                <h2 style={{ margin: 0 }}>{t('portability.title')}</h2>
                <button onClick={() => void loadCompanies()} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <Loader2 size={14} /> : <RefreshCw size={14} />} {t('portability.refresh')}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('portability.url')} style={{ flex: '2 1 200px' }} />
                <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={t('portability.secret')}
                    type="password"
                    style={{ flex: '1 1 160px' }}
                />
                <button onClick={() => void loadCompanies()}>{t('portability.connect')}</button>
            </div>

            {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} /> <span>{error}</span>
                </div>
            )}
            {notice && <div style={{ color: '#059669', marginBottom: '1rem' }}>{notice}</div>}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                    <h3 style={{ marginTop: 0 }}>
                        <Download size={14} /> {t('portability.export_h')}
                    </h3>
                    <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={{ width: '100%', marginBottom: 8 }}>
                        <option value="">{t('portability.pick_company')}</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => void doExport()} disabled={loading || !companyId}>
                        {t('portability.export_btn')}
                    </button>
                    <div style={{ color: '#64748b', marginTop: 8 }}>{t('portability.export_note')}</div>
                </div>
                <div style={{ flex: '1 1 300px', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                    <h3 style={{ marginTop: 0 }}>
                        <Upload size={14} /> {t('portability.import_h')}
                    </h3>
                    <select value={collision} onChange={(e) => setCollision(e.target.value)} style={{ width: '100%', marginBottom: 8 }}>
                        <option value="rename">{t('portability.rename')}</option>
                        <option value="skip">{t('portability.skip')}</option>
                        <option value="overwrite">{t('portability.overwrite')}</option>
                    </select>
                    <input
                        type="file"
                        accept="application/json,.json"
                        onChange={(e) => void doImport(e.target.files?.[0])}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default PortabilityPanel;
