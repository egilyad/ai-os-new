import React, { useMemo, useState } from 'react';
import { Search, Wrench, Eye, Brain, Database } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import {
    CATALOG_CAPABILITIES,
    CATALOG_CONTEXT_WINDOWS,
    CATALOG_PRICING,
} from '../../llm/catalog/models-catalog';
import { MODELS_CATALOG } from '../../llm/catalog/models-catalog-detail';

type Capability = 'toolCall' | 'vision' | 'reasoning';
type SortKey = 'price' | 'context' | 'name';

const CAPABILITIES: Capability[] = ['toolCall', 'vision', 'reasoning'];
const PAGE_SIZE = 60;

const formatContext = (value: number): string => {
    if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(value);
};

const formatPrice = (value: number | undefined): string =>
    value === undefined ? '—' : `$${value.toFixed(value < 1 ? 3 : 2)}`;

const ModelCatalogView: React.FC = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [provider, setProvider] = useState('');
    const [caps, setCaps] = useState<Capability[]>([]);
    const [sort, setSort] = useState<SortKey>('price');
    const [limit, setLimit] = useState(PAGE_SIZE);

    const providers = useMemo(
        () => [...new Set(MODELS_CATALOG.map((m) => m.provider))].sort(),
        [],
    );

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const rows = MODELS_CATALOG.filter((entry) => {
            if (entry.deprecated) return false;
            if (provider && entry.provider !== provider) return false;
            if (needle) {
                const haystack = `${entry.name} ${entry.model} ${entry.id}`.toLowerCase();
                if (!haystack.includes(needle)) return false;
            }
            if (caps.length) {
                const capabilities = CATALOG_CAPABILITIES[entry.model.toLowerCase()];
                if (!capabilities) return false;
                if (!caps.every((c) => capabilities[c])) return false;
            }
            return true;
        });

        return rows.sort((a, b) => {
            if (sort === 'name') return a.name.localeCompare(b.name);
            if (sort === 'context') {
                return (
                    (CATALOG_CONTEXT_WINDOWS[b.model.toLowerCase()] ?? 0) -
                    (CATALOG_CONTEXT_WINDOWS[a.model.toLowerCase()] ?? 0)
                );
            }
            const priceA = CATALOG_PRICING[a.model.toLowerCase()]?.input ?? Infinity;
            const priceB = CATALOG_PRICING[b.model.toLowerCase()]?.input ?? Infinity;
            if (priceA !== priceB) return priceA - priceB;
            return a.name.localeCompare(b.name);
        });
    }, [query, provider, caps, sort]);

    const visible = filtered.slice(0, limit);

    const toggleCap = (cap: Capability): void => {
        setCaps((prev) =>
            prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
        );
        setLimit(PAGE_SIZE);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="provider-search-wrapper">
                <Search className="provider-search-icon" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setLimit(PAGE_SIZE);
                    }}
                    placeholder={t('providers.catalog.search_placeholder')}
                    aria-label={t('providers.catalog.search_placeholder')}
                    className="provider-search-input"
                />
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <select
                    value={provider}
                    onChange={(e) => {
                        setProvider(e.target.value);
                        setLimit(PAGE_SIZE);
                    }}
                    aria-label={t('providers.catalog.provider')}
                    style={{
                        padding: '0.35rem 0.6rem',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                    }}
                >
                    <option value="">{t('providers.catalog.all_providers')}</option>
                    {providers.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>

                {CAPABILITIES.map((cap) => {
                    const active = caps.includes(cap);
                    const Icon = cap === 'toolCall' ? Wrench : cap === 'vision' ? Eye : Brain;
                    return (
                        <button
                            key={cap}
                            onClick={() => toggleCap(cap)}
                            aria-pressed={active}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '0.35rem 0.7rem',
                                borderRadius: 100,
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: active ? '#a78bfa' : 'var(--text-muted)',
                                background: active ? 'rgba(167,139,250,0.12)' : 'transparent',
                                border: `1px solid ${active ? 'rgba(167,139,250,0.35)' : 'var(--border)'}`,
                            }}
                        >
                            <Icon size={13} aria-hidden="true" />
                            {t(`providers.catalog.cap_${cap}`)}
                        </button>
                    );
                })}

                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label={t('providers.catalog.sort')}
                    style={{
                        marginLeft: 'auto',
                        padding: '0.35rem 0.6rem',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                    }}
                >
                    <option value="price">{t('providers.catalog.sort_price')}</option>
                    <option value="context">{t('providers.catalog.sort_context')}</option>
                    <option value="name">{t('providers.catalog.sort_name')}</option>
                </select>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {t('providers.catalog.found').replace('{0}', String(filtered.length))}
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto',
                    gap: '0.5rem',
                    fontSize: '0.72rem',
                }}
            >
                {visible.map((entry) => {
                    const key = entry.model.toLowerCase();
                    const capabilities = CATALOG_CAPABILITIES[key];
                    const pricing = CATALOG_PRICING[key];
                    const context = CATALOG_CONTEXT_WINDOWS[key] ?? entry.context;
                    return (
                        <div
                            key={entry.id}
                            style={{
                                display: 'contents',
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: 'var(--text-main)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                    title={entry.id}
                                >
                                    {entry.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {entry.id}
                                </div>
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                                <Database size={11} aria-hidden="true" /> {formatContext(context)}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                                {formatPrice(pricing?.input)} / {formatPrice(pricing?.output)}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {capabilities?.toolCall && (
                                    <span title={t('providers.catalog.cap_toolCall')}>
                                        <Wrench size={12} color="#a78bfa" aria-hidden="true" />
                                    </span>
                                )}
                                {capabilities?.vision && (
                                    <span title={t('providers.catalog.cap_vision')}>
                                        <Eye size={12} color="#34d399" aria-hidden="true" />
                                    </span>
                                )}
                                {capabilities?.reasoning && (
                                    <span title={t('providers.catalog.cap_reasoning')}>
                                        <Brain size={12} color="#f59e0b" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {visible.length < filtered.length && (
                <button
                    onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
                    style={{
                        alignSelf: 'center',
                        padding: '0.45rem 1rem',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                    }}
                >
                    {t('providers.catalog.show_more').replace(
                        '{0}',
                        String(filtered.length - visible.length),
                    )}
                </button>
            )}
        </div>
    );
};

export default ModelCatalogView;
