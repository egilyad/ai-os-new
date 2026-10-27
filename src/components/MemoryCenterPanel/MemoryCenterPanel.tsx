import React, { useEffect, useMemo, useState } from 'react';
import { Database, Search, BrainCircuit, HeartPulse, Layers } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import {
    listMemorySources,
    computeMemoryCounts,
} from '../../kernel/services/memory-center/memory-registry';
import type {
    MemorySourceDescriptor,
    MemorySourceCount,
    MemoryCategory,
} from '../../kernel/types/memory-center-types';

type Tab = 'overview' | 'storage' | 'explorer' | 'health';

const CATEGORY_LABEL: Record<MemoryCategory, string> = {
    chat: '🗣️ Чаты',
    debate: '⚔️ Дебаты',
    agent: '🤖 Агенты',
    knowledge: '🧠 Знания',
    research: '🔬 Исследования',
    config: '⚙️ Конфигурация',
    execution: '📋 Выполнение',
    fleet: '🛰️ Флот',
    user: '👤 Пользователь',
};

const STATUS_COLOR: Record<string, string> = {
    verified: '#22c55e',
    partial: '#f59e0b',
    unknown: '#64748b',
    unavailable: '#ef4444',
};

const MemoryCenterPanel: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('overview');
    const [counts, setCounts] = useState<MemorySourceCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | 'all'>('all');
    const [query, setQuery] = useState('');

    const sources = useMemo(() => listMemorySources(), []);

    useEffect(() => {
        let alive = true;
        computeMemoryCounts().then((c) => {
            if (alive) {
                setCounts(c);
                setLoading(false);
            }
        });
        return () => {
            alive = false;
        };
    }, []);

    const countMap = useMemo(() => {
        const m = new Map<string, number | null>();
        for (const c of counts) m.set(c.sourceId, c.count);
        return m;
    }, [counts]);

    const filtered = useMemo(() => {
        let list = sources;
        if (categoryFilter !== 'all') list = list.filter((s) => s.category === categoryFilter);
        const q = query.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.owner.toLowerCase().includes(q) ||
                    s.description.toLowerCase().includes(q),
            );
        }
        return list;
    }, [sources, categoryFilter, query]);

    const categories = useMemo(() => {
        const set = new Set<MemoryCategory>(sources.map((s) => s.category));
        return Array.from(set);
    }, [sources]);

    const verifiedCount = sources.filter((s) => s.status === 'verified').length;
    const partialCount = sources.filter((s) => s.status === 'partial').length;
    const unknownCount = sources.filter((s) => s.status === 'unknown').length;
    const totalRows = counts.reduce((acc, c) => acc + (c.count ?? 0), 0);

    return (
        <div style={{ padding: '1rem 1.25rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <BrainCircuit size={18} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    Memory Center — карта памяти системы
                </h2>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                Read-only обзор всех механизмов хранения. Данные остаются у владельцев — здесь только
                карта, подсчёты и переходы к оригиналам.
            </p>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                    onClick={() => setTab('overview')}
                    style={tabBtn(tab === 'overview')}
                >
                    <Layers size={14} /> Обзор
                </button>
                <button onClick={() => setTab('storage')} style={tabBtn(tab === 'storage')}>
                    <Database size={14} /> Карта хранилищ
                </button>
                <button onClick={() => setTab('explorer')} style={tabBtn(tab === 'explorer')}>
                    <Search size={14} /> Explorer
                </button>
                <button onClick={() => setTab('health')} style={tabBtn(tab === 'health')}>
                    <HeartPulse size={14} /> Health & Gaps
                </button>
            </div>

            {tab === 'overview' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: '1rem' }}>
                        <Stat label="Источников" value={sources.length} />
                        <Stat label="Проверено" value={verifiedCount} />
                        <Stat label="Частично" value={partialCount} />
                        <Stat label="Неизвестно" value={unknownCount} />
                        <Stat label="Всего записей" value={loading ? '…' : totalRows.toLocaleString()} />
                    </div>
                    {categories.map((cat) => {
                        const items = sources.filter((s) => s.category === cat);
                        const catRows = counts
                            .filter((c) => items.some((i) => i.id === c.sourceId))
                            .reduce((acc, c) => acc + (c.count ?? 0), 0);
                        return (
                            <div key={cat} style={{ marginBottom: '0.9rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-300)', marginBottom: 6 }}>
                                    {CATEGORY_LABEL[cat]} · {items.length} источников ·{' '}
                                    {catRows.toLocaleString()} записей
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {items.map((s) => (
                                        <SourceRow key={s.id} source={s} count={countMap.get(s.id) ?? null} loading={loading} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === 'storage' && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--slate-400)', textAlign: 'left' }}>
                                <th style={th}>Источник</th>
                                <th style={th}>Хранилище</th>
                                <th style={th}>Таблица</th>
                                <th style={th}>Владелец</th>
                                <th style={th}>Статус</th>
                                <th style={th}>Записей</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={td}>{s.name}</td>
                                    <td style={td}>{s.storageType}</td>
                                    <td style={td}><code>{s.table ?? '—'}</code></td>
                                    <td style={td}>{s.owner}</td>
                                    <td style={td}>
                                        <span style={{ color: STATUS_COLOR[s.status] }}>{s.status}</span>
                                    </td>
                                    <td style={td}>
                                        {loading ? '…' : countMap.get(s.id) ?? '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'explorer' && (
                <div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as MemoryCategory | 'all')}
                            style={selectStyle}
                        >
                            <option value="all">Все категории</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                            ))}
                        </select>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Поиск по названию / владельцу"
                            style={{ ...selectStyle, flex: 1, minWidth: 220 }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {filtered.map((s) => (
                            <SourceRow key={s.id} source={s} count={countMap.get(s.id) ?? null} loading={loading} />
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ color: 'var(--slate-500)', padding: 16, textAlign: 'center' }}>
                                Ничего не найдено
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'health' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sources.filter((s) => s.status !== 'verified').map((s) => (
                        <div key={s.id} style={card}>
                            <span style={{ color: STATUS_COLOR[s.status], fontWeight: 700 }}>{s.status}</span>
                            {' '}<b>{s.name}</b> — {s.description}
                        </div>
                    ))}
                    <div style={card}>
                        <b>Возможные дубликаты:</b> `auditLog` ↔ `auditLogs` (аудит ядра vs AGEMS);{' '}
                        `eventLog` ↔ `traces`/`cognitiveTraces` (журналы событий).
                    </div>
                    <div style={card}>
                        <b>Вне единой карты:</b> localStorage/SSR адаптеры (
                        `local-storage-adapter.ts`, `ssr-storage.ts`) не отражены в Dexie-карте.
                    </div>
                    <div style={card}>
                        <b>Семантический поиск</b> доступен только для `memories` (MemoryEngine) и
                        Wiki-Brain; остальные таблицы — точечные запросы.
                    </div>
                </div>
            )}
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div style={{ padding: '0.8rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{value}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>{label}</div>
    </div>
);

const SourceRow: React.FC<{ source: MemorySourceDescriptor; count: number | null; loading: boolean }> = ({
    source,
    count,
    loading,
}) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.8rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.16)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{source.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                {source.owner} · {source.table ?? source.storageType}
            </div>
        </div>
        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 6, background: `${STATUS_COLOR[source.status]}22`, color: STATUS_COLOR[source.status], fontWeight: 600 }}>
            {source.status}
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>
            {loading ? '…' : count ?? '—'}
        </span>
        {source.openRoute && (
            <a href={`#/${source.openRoute}`} style={{ fontSize: '0.7rem', color: 'var(--accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Открыть →
            </a>
        )}
    </div>
);

const card: React.CSSProperties = {
    padding: '0.7rem 0.9rem',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.16)',
    fontSize: '0.8rem',
    color: 'var(--slate-300)',
};

const tabBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '0.45rem 0.85rem',
    borderRadius: 9,
    border: active ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
    color: active ? 'var(--slate-100)' : 'var(--slate-400)',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
});

const th: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '6px 10px', verticalAlign: 'top' };
const selectStyle: React.CSSProperties = {
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
};

export default MemoryCenterPanel;
