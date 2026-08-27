import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Search,
    Trash2,
    Download,
    Filter,
    MessageSquare,
    X,
    RefreshCw,
    AlertCircle,
    Hash,
    User,
    Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/useTranslation';
import {
    getMessageIndexService,
    type IndexedMessage,
} from '../kernel/services/message-index-service';
import { errorContainer, dismissBtnRed, textMutedXs, textWhiteXs } from '../styles/common';
import { Button } from './Common';
import { useConfirm } from '../hooks/useConfirm';

const messageIndex = getMessageIndexService();

function highlight(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark
                style={{ background: 'rgba(245,158,11,0.3)', color: '#fcd34d', padding: '0 1px' }}
            >
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

export const MessageSearchPanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [query, setQuery] = useState('');
    const [useRegex, setUseRegex] = useState(false);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [roleFilter, setRoleFilter] = useState<'' | 'user' | 'assistant'>('');
    const [providerFilter, setProviderFilter] = useState('');
    const [modelFilter, setModelFilter] = useState('');
    const [sessionFilter, setSessionFilter] = useState('');
    const [minTokens, setMinTokens] = useState<number>(0);
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [results, setResults] = useState<IndexedMessage[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, force] = useState(0);
    const isMountedRef = useRef(true);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const providers = useMemo(() => messageIndex.uniqueProviders(), []);
    const models = useMemo(() => messageIndex.uniqueModels(), []);
    const sessions = useMemo(() => messageIndex.uniqueSessions(), []);

    const runSearch = useCallback(() => {
        try {
            const fromTs = fromDate ? new Date(fromDate).getTime() : undefined;
            const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : undefined;
            const out = messageIndex.search({
                query,
                caseSensitive,
                useRegex,
                filters: {
                    role: roleFilter || undefined,
                    provider: providerFilter || undefined,
                    model: modelFilter || undefined,
                    sessionId: sessionFilter || undefined,
                    fromTs,
                    toTs,
                    minTokens: minTokens > 0 ? minTokens : undefined,
                },
                limit: 200,
            });
            if (isMountedRef.current) setResults(out);
        } catch (err) {
            if (isMountedRef.current) setError(String(err));
        }
    }, [
        query,
        caseSensitive,
        useRegex,
        roleFilter,
        providerFilter,
        modelFilter,
        sessionFilter,
        fromDate,
        toDate,
        minTokens,
    ]);

    useEffect(() => {
        isMountedRef.current = true;
        const unsub = messageIndex.subscribe(() => {
            if (isMountedRef.current) {
                runSearch();
                force((x) => x + 1);
            }
        });
        return () => {
            isMountedRef.current = false;
            unsub();
        };
    }, [runSearch]);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(runSearch, 200);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [runSearch]);

    const handleClearAll = useCallback(async () => {
        if (
            !(await confirm({
                title: 'Clear All Messages',
                message: t('message_search.confirm_clear'),
                variant: 'danger',
            }))
        )
            return;
        messageIndex.clear();
        setResults([]);
    }, [t, confirm]);

    const handleExport = useCallback(() => {
        try {
            const json = JSON.stringify(results, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `message-search-${new Date().toISOString().slice(0, 19)}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
            }, 100);
        } catch (err) {
            setError(String(err));
        }
    }, [results]);

    const total = messageIndex.count();
    const userCount = useMemo(() => results.filter((r) => r.role === 'user').length, [results]);
    const assistantCount = useMemo(
        () => results.filter((r) => r.role === 'assistant').length,
        [results],
    );

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1rem',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <Search size={26} color="#06b6d4" /> {t('message_search.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('message_search.subtitle', { total })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                        <Filter size={12} /> {t('message_search.filters')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExport}
                        disabled={results.length === 0}
                    >
                        <Download size={12} /> {t('message_search.export')}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={total === 0}
                    >
                        <Trash2 size={12} /> {t('message_search.clear')}
                    </Button>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={errorContainer}
                >
                    {error}
                    <button onClick={() => setError(null)} style={dismissBtnRed}>
                        <X size={18} />
                    </button>
                </motion.div>
            )}

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 240 }}>
                    <Search
                        size={14}
                        style={{ position: 'absolute', left: 8, top: 8, color: 'var(--slate-400)' }}
                    />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('message_search.search_placeholder')}
                        style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem 0.4rem 28px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                        }}
                    />
                </div>
                <label style={checkLabel}>
                    <input
                        type="checkbox"
                        checked={useRegex}
                        onChange={(e) => setUseRegex(e.target.checked)}
                    />
                    <span style={{ marginLeft: 4 }}>regex</span>
                </label>
                <label style={checkLabel}>
                    <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                    />
                    <span style={{ marginLeft: 4 }}>Aa</span>
                </label>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '0.4rem',
                                padding: '0.5rem',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(0,0,0,0.2)',
                            }}
                        >
                            <FilterSelect
                                label={t('message_search.f_role')}
                                value={roleFilter}
                                onChange={(v) => setRoleFilter(v as '' | 'user' | 'assistant')}
                                options={[
                                    { v: '', l: t('message_search.any_role') },
                                    { v: 'user', l: t('message_search.user') },
                                    { v: 'assistant', l: t('message_search.assistant') },
                                ]}
                            />
                            <FilterSelect
                                label={t('message_search.f_provider')}
                                value={providerFilter}
                                onChange={(v) => setProviderFilter(v)}
                                options={[
                                    { v: '', l: t('message_search.any_provider') },
                                    ...providers.map((p) => ({ v: p, l: p })),
                                ]}
                            />
                            <FilterSelect
                                label={t('message_search.f_model')}
                                value={modelFilter}
                                onChange={(v) => setModelFilter(v)}
                                options={[
                                    { v: '', l: t('message_search.any_model') },
                                    ...models.map((p) => ({ v: p, l: p })),
                                ]}
                            />
                            <FilterSelect
                                label={t('message_search.f_session')}
                                value={sessionFilter}
                                onChange={(v) => setSessionFilter(v)}
                                options={[
                                    { v: '', l: t('message_search.any_session') },
                                    ...sessions.slice(0, 30).map((s) => ({
                                        v: s.id,
                                        l: `${s.id.slice(0, 12)}… (${s.count})`,
                                    })),
                                ]}
                            />
                            <FilterInput
                                label={t('message_search.f_from')}
                                type="date"
                                value={fromDate}
                                onChange={setFromDate}
                            />
                            <FilterInput
                                label={t('message_search.f_to')}
                                type="date"
                                value={toDate}
                                onChange={setToDate}
                            />
                            <FilterInput
                                label={t('message_search.f_min_tokens')}
                                type="number"
                                value={minTokens.toString()}
                                onChange={(v) => setMinTokens(parseInt(v) || 0)}
                            />
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setRoleFilter('');
                                        setProviderFilter('');
                                        setModelFilter('');
                                        setSessionFilter('');
                                        setFromDate('');
                                        setToDate('');
                                        setMinTokens(0);
                                    }}
                                >
                                    <RefreshCw size={12} /> {t('message_search.reset_filters')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {results.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.4rem',
                    }}
                >
                    <StatBox
                        icon={<MessageSquare size={14} color="#06b6d4" />}
                        label={t('message_search.results')}
                        value={results.length}
                        color="#06b6d4"
                    />
                    <StatBox
                        icon={<User size={14} color="#3b82f6" />}
                        label={t('message_search.user_msgs')}
                        value={userCount}
                        color="#3b82f6"
                    />
                    <StatBox
                        icon={<Bot size={14} color="#10b981" />}
                        label={t('message_search.assistant_msgs')}
                        value={assistantCount}
                        color="#10b981"
                    />
                </div>
            )}

            <div
                style={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                }}
            >
                <AnimatePresence>
                    {results.map((r) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.05)',
                                background:
                                    r.role === 'user'
                                        ? 'rgba(59,130,246,0.05)'
                                        : 'rgba(16,185,129,0.05)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 6,
                                    alignItems: 'center',
                                    marginBottom: 4,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: 4,
                                        background:
                                            r.role === 'user'
                                                ? 'rgba(59,130,246,0.15)'
                                                : 'rgba(16,185,129,0.15)',
                                        color: r.role === 'user' ? '#93c5fd' : '#6ee7b7',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {r.role}
                                </span>
                                {r.provider && <span style={chipColor}>{r.provider}</span>}
                                {r.model && <span style={chipMuted}>{r.model}</span>}
                                {r.tokens !== undefined && (
                                    <span style={chipMuted}>{r.tokens} tok</span>
                                )}
                                {r.latencyMs !== undefined && (
                                    <span style={chipMuted}>{r.latencyMs}ms</span>
                                )}
                                <span style={textMutedXs}>
                                    {new Date(r.timestamp).toLocaleString()}
                                </span>
                                <span style={{ ...textMutedXs, marginLeft: 'auto' }}>
                                    <Hash
                                        size={10}
                                        style={{ display: 'inline', verticalAlign: 'middle' }}
                                    />{' '}
                                    {r.sessionId.slice(0, 16)}
                                </span>
                            </div>
                            <div
                                style={{
                                    ...textWhiteXs,
                                    fontSize: '0.78rem',
                                    lineHeight: 1.4,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {highlight(r.content, query)}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {total === 0 && (
                    <div
                        style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}
                    >
                        <MessageSquare size={48} color="#475569" />
                        <p style={{ marginTop: '1rem' }}>{t('message_search.empty')}</p>
                        <p style={textMutedXs}>{t('message_search.empty_hint')}</p>
                    </div>
                )}
                {total > 0 && results.length === 0 && (
                    <div
                        style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)' }}
                    >
                        <AlertCircle size={32} color="#475569" />
                        <p style={{ marginTop: '0.5rem' }}>{t('message_search.no_match')}</p>
                    </div>
                )}
            </div>
            <ConfirmDialog />
        </div>
    );
};

const StatBox: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}> = ({ icon, label, value, color }) => (
    <div
        style={{
            padding: '0.4rem 0.6rem',
            borderRadius: 8,
            border: `1px solid ${color}20`,
            background: `linear-gradient(145deg, ${color}05, rgba(0,0,0,0.2))`,
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            {icon}
            <span style={{ ...textMutedXs, fontSize: '0.65rem' }}>{label}</span>
        </div>
        <div style={{ ...textWhiteXs, fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
    </div>
);

const FilterSelect: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{ v: string; l: string }>;
}> = ({ label, value, onChange, options }) => (
    <div>
        <div style={{ ...textMutedXs, marginBottom: 2 }}>{label}</div>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: '100%',
                padding: '0.3rem 0.4rem',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--slate-200)',
                fontSize: '0.75rem',
            }}
        >
            {options.map((o) => (
                <option key={o.v} value={o.v}>
                    {o.l}
                </option>
            ))}
        </select>
    </div>
);

const FilterInput: React.FC<{
    label: string;
    type: string;
    value: string;
    onChange: (v: string) => void;
}> = ({ label, type, value, onChange }) => (
    <div>
        <div style={{ ...textMutedXs, marginBottom: 2 }}>{label}</div>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: '100%',
                padding: '0.3rem 0.4rem',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--slate-200)',
                fontSize: '0.75rem',
            }}
        />
    </div>
);

const checkLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: 'var(--slate-400)',
    cursor: 'pointer',
    userSelect: 'none',
};

const chipColor: React.CSSProperties = {
    padding: '0.05rem 0.4rem',
    borderRadius: 4,
    background: 'var(--purple-tint)',
    color: '#c4b5fd',
    fontSize: '0.65rem',
};

const chipMuted: React.CSSProperties = {
    padding: '0.05rem 0.4rem',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--slate-400)',
    fontSize: '0.65rem',
};

export default MessageSearchPanel;
