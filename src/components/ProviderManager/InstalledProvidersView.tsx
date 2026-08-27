import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Package,
    Loader2,
    Activity,
    Power,
    PowerOff,
    Sun,
    Moon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import type { ApiKey } from '../../types/metrics';
import { activeToggleStyle } from '../Common/status-vocabulary';
import { settingsService, probeService } from '../../kernel/instances';
import type { ProbeResult } from '../../kernel/contracts/probe';
import { flexColGap4, gap2, textSecondaryItalic } from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';
import ProviderTableRow from './ProviderTableRow';
import ProviderCard from './ProviderCard';
import { COLUMNS, SORT_FNS, type SortColumn, type SortDir } from './provider-utils';

interface InstalledProvidersViewProps {
    keys: ApiKey[];
    onSelect: (key: ApiKey, tab: 'overview' | 'sandbox') => void;
    onCheckHealth: (keyId: string) => void;
    onToggleStatus: (keyId: string) => void;
    onRemoveKey: (keyId: string) => void;
    onEnableAll: () => void;
    onDisableAll: () => void;
    onReorder?: (keyId: string, targetIndex: number) => void;
    checkingIds: Set<string>;
}

const InstalledProvidersView: React.FC<InstalledProvidersViewProps> = React.memo(
    ({
        keys,
        onSelect,
        onCheckHealth,
        onToggleStatus,
        onRemoveKey,
        onEnableAll,
        onDisableAll,
        checkingIds,
        onReorder,
    }) => {
        const { t } = useTranslation();
        const [searchQuery, setSearchQuery] = useState('');
        const [debouncedSearch, setDebouncedSearch] = useState('');
        const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
        const [sortColumn, setSortColumn] = useState<SortColumn>('label');
        const [sortDir, setSortDir] = useState<SortDir>('asc');
        const [statusFilter, setStatusFilter] = useState<string>('all');
        const [groupFilter, setGroupFilter] = useState<string>('all');
        const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
        const [dragIndex, setDragIndex] = useState<number | null>(null);
        const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
        const [isLight, setIsLight] = useState(() => {
            try {
                return settingsService.getSettings().theme === 'light';
            } catch {
                return false;
            }
        });
        const [batchProbeResults, setBatchProbeResults] = useState<Map<string, ProbeResult> | null>(
            null,
        );
        const [batchProbeLoading, setBatchProbeLoading] = useState(false);
        const [expandedBatchProbe, setExpandedBatchProbe] = useState<string | null>(null);

        useEffect(() => {
            const unsub = settingsService.subscribe((s) => setIsLight(s.theme === 'light'));
            return () => {
                unsub();
            };
        }, []);

        const toggleTheme = () => {
            settingsService.updateSettings({ theme: isLight ? 'dark' : 'light' });
        };

        const handleSort = (col: SortColumn) => {
            if (sortColumn === col) {
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
            } else {
                setSortColumn(col);
                setSortDir('asc');
            }
        };

        const handleDragStart = (idx: number) => {
            setDragIndex(idx);
        };

        const handleDragOver = (e: React.DragEvent, idx: number) => {
            e.preventDefault();
            setDragOverIndex(idx);
        };

        const handleDrop = (idx: number) => {
            if (dragIndex === null || dragIndex === idx || !onReorder) return;
            const keyId = sortedKeys[dragIndex]!.id;
            onReorder(keyId, idx);
            setDragIndex(null);
            setDragOverIndex(null);
        };

        const handleDragEnd = () => {
            setDragIndex(null);
            setDragOverIndex(null);
        };

        useEffect(() => {
            const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
            return () => clearTimeout(timer);
        }, [searchQuery]);

        const uniqueGroups = useMemo(() => {
            const gs = new Set(keys.map((k) => k.group).filter(Boolean));
            return Array.from(gs).sort();
        }, [keys]);

        const filteredKeys = useMemo(
            () =>
                keys.filter(
                    (k) =>
                        (statusFilter === 'all' || k.status === statusFilter) &&
                        (groupFilter === 'all' || k.group === groupFilter) &&
                        (k.label.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            k.provider.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            (k.group || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            (k.account || k.accountId || '')
                                .toLowerCase()
                                .includes(debouncedSearch.toLowerCase()) ||
                            (k.notes || []).some((n) =>
                                n.text.toLowerCase().includes(debouncedSearch.toLowerCase()),
                            ) ||
                            (k.tags || []).some((t) =>
                                t.toLowerCase().includes(debouncedSearch.toLowerCase()),
                            )),
                ),
            [keys, debouncedSearch, statusFilter, groupFilter],
        );

        const sortedKeys = useMemo(() => {
            if (!sortColumn) return filteredKeys;
            return [...filteredKeys].sort(SORT_FNS[sortColumn](sortDir));
        }, [filteredKeys, sortColumn, sortDir]);

        const SortIcon = sortDir === 'asc' ? ArrowUp : ArrowDown;

        return (
            <div style={flexColGap4}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '1rem',
                    }}
                >
                    <div
                        className="provider-inline-flex"
                        style={{ gap: '1rem', justifyContent: 'space-between' }}
                    >
                        <div className="provider-inline-flex" style={{ gap: '1rem' }}>
                            <div className="provider-search-wrapper">
                                <Search className="provider-search-icon" size={18} />
                                <input
                                    type="text"
                                    placeholder={t('provider.search_placeholder')}
                                    aria-label={t('provider.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="provider-search-input"
                                />
                            </div>
                            <div className="provider-view-toggle">
                                <button
                                    onClick={() => setViewMode('table')}
                                    aria-pressed={viewMode === 'table'}
                                    className={
                                        viewMode === 'table'
                                            ? 'provider-view-toggle--active'
                                            : 'provider-view-toggle--inactive'
                                    }
                                >
                                    {t('provider.table_view')}
                                </button>
                                <button
                                    onClick={() => setViewMode('cards')}
                                    aria-pressed={viewMode === 'cards'}
                                    className={
                                        viewMode === 'cards'
                                            ? 'provider-view-toggle--active'
                                            : 'provider-view-toggle--inactive'
                                    }
                                >
                                    {t('provider.card_view')}
                                </button>
                            </div>
                        </div>
                        <div className="provider-inline-flex" style={gap2}>
                            <button
                                onClick={async () => {
                                    setBatchProbeLoading(true);
                                    setBatchProbeResults(null);
                                    try {
                                        const results = await probeService.probeAll();
                                        const map = new Map<string, ProbeResult>();
                                        for (const r of results) map.set(r.keyId, r);
                                        setBatchProbeResults(map);
                                    } finally {
                                        setBatchProbeLoading(false);
                                    }
                                }}
                                className="btn-secondary"
                                disabled={batchProbeLoading}
                                style={{ color: 'var(--accent)' }}
                            >
                                {batchProbeLoading ? (
                                    <Loader2 size={14} className="provider-spin" />
                                ) : (
                                    <Activity size={14} />
                                )}
                                {t('provider.quick_test_all')}
                            </button>
                            <button onClick={onEnableAll} className="btn-secondary">
                                <Power size={16} /> {t('provider.enable_all')}
                            </button>
                            <button onClick={onDisableAll} className="btn-secondary">
                                <PowerOff size={16} /> {t('provider.disable_all')}
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="btn-secondary"
                                title={
                                    isLight
                                        ? t('common.switch_to_dark')
                                        : t('common.switch_to_light')
                                }
                                aria-label={t('common.toggle_theme')}
                            >
                                {isLight ? <Moon size={16} /> : <Sun size={16} />}
                            </button>
                        </div>
                    </div>
                    <div
                        className="provider-inline-flex"
                        style={{ gap: '0.5rem', flexWrap: 'wrap' }}
                    >
                        {[
                            'all',
                            'active',
                            'inactive',
                            'error',
                            'checking',
                            'quota_exhausted',
                            'pending',
                            'invalid',
                        ].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    ...activeToggleStyle(statusFilter === status),
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {status === 'all'
                                    ? t('provider.filter_all')
                                    : t(`provider.status.${status}`)}
                            </button>
                        ))}
                        <select
                            value={groupFilter}
                            onChange={(e) => setGroupFilter(e.target.value)}
                            style={{
                                marginLeft: 'auto',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 6,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--slate-200)',
                                fontSize: '0.75rem',
                            }}
                            aria-label="Filter by group"
                        >
                            <option value="all">{t('provider.all_groups')}</option>
                            {uniqueGroups.map((g) => (
                                <option key={g} value={g}>
                                    {g}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Batch Quick Test results */}
                {batchProbeResults && batchProbeResults.size > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 12,
                            background: 'rgba(59,130,246,0.03)',
                            border: '1px solid rgba(59,130,246,0.1)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--accent)',
                                marginBottom: '0.25rem',
                            }}
                        >
                            {t('provider.quick_test_results')}
                            <span style={{ marginLeft: 8, color: 'var(--slate-500)', fontWeight: 400 }}>
                                {t('provider.batch_ready_count', {
                                    ready: Array.from(batchProbeResults.values()).filter(
                                        (r) => r.status === 'ready',
                                    ).length,
                                    total: batchProbeResults.size,
                                })}
                            </span>
                        </div>
                        {Array.from(batchProbeResults.entries()).map(([id, r]) => {
                            const key = keys.find((k) => k.id === id);
                            const statusColors: Record<string, string> = {
                                ready: '#10b981',
                                degraded: '#f59e0b',
                                limited: '#f97316',
                                broken: '#ef4444',
                                unknown: '#64748b',
                            };
                            const c = statusColors[r.status] || '#64748b';
                            const isExpanded = expandedBatchProbe === id;
                            const preview = r.responseContent
                                ? r.responseContent.slice(0, 50) +
                                  (r.responseContent.length > 50 ? '\u2026' : '')
                                : undefined;
                            return (
                                <div key={id}>
                                    <div
                                        onClick={() =>
                                            setExpandedBatchProbe(isExpanded ? null : id)
                                        }
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 10px',
                                            borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                                            background: 'rgba(0,0,0,0.2)',
                                            cursor: 'pointer',
                                            fontSize: '0.78rem',
                                            border: isExpanded
                                                ? '1px solid rgba(59,130,246,0.12)'
                                                : '1px solid transparent',
                                            borderBottom: isExpanded
                                                ? 'none'
                                                : '1px solid transparent',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                background: c,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                color: 'var(--slate-200)',
                                                fontWeight: 600,
                                                minWidth: 80,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {key?.label || r.provider || id}
                                        </span>
                                        <span
                                            style={{
                                                color: c,
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                fontSize: '0.65rem',
                                                minWidth: 40,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {r.status}
                                        </span>
                                        {r.latency > 0 && (
                                            <span
                                                style={{
                                                    color: 'var(--slate-600)',
                                                    fontSize: '0.7rem',
                                                    minWidth: 35,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {r.latency}ms
                                            </span>
                                        )}
                                        {preview ? (
                                            <span
                                                style={{
                                                    color: 'var(--slate-400)',
                                                    fontSize: '0.72rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                {preview}
                                            </span>
                                        ) : r.error ? (
                                            <span
                                                style={{
                                                    color: 'var(--error)',
                                                    fontSize: '0.7rem',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                {r.error}
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    color: 'var(--slate-500)',
                                                    fontSize: '0.7rem',
                                                    fontStyle: 'italic',
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                {t('provider.no_response')}
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                color: 'var(--slate-600)',
                                                fontSize: '0.6rem',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {isExpanded ? '\u25b2' : '\u25bc'}
                                        </span>
                                    </div>
                                    {isExpanded && (
                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '0 0 8px 8px',
                                                background: 'rgba(0,0,0,0.15)',
                                                border: '1px solid rgba(59,130,246,0.12)',
                                                borderTop: 'none',
                                                fontSize: '0.78rem',
                                                color: 'var(--slate-300)',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                maxHeight: 150,
                                                overflowY: 'auto',
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {r.responseContent || (
                                                <span style={textSecondaryItalic}>
                                                    {t('provider.no_response')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {sortedKeys.length > 0 ? (
                    viewMode === 'table' ? (
                        <div className="provider-table-wrapper">
                            <table className="provider-table">
                                <thead>
                                    <tr>
                                        {COLUMNS.map((col) => (
                                            <th
                                                key={col.key + '-' + col.label}
                                                onClick={() =>
                                                    col.key !== 'drag'
                                                        ? handleSort(col.key as SortColumn)
                                                        : undefined
                                                }
                                                className={
                                                    col.key !== 'drag' ? 'provider-sort-header' : ''
                                                }
                                                aria-sort={
                                                    col.key !== 'drag' && sortColumn === col.key
                                                        ? sortDir === 'asc'
                                                            ? 'ascending'
                                                            : 'descending'
                                                        : 'none'
                                                }
                                                style={
                                                    col.key === 'drag'
                                                        ? { width: 32, minWidth: 32 }
                                                        : undefined
                                                }
                                            >
                                                {col.label && (
                                                    <div
                                                        className="provider-inline-flex"
                                                        style={{ gap: '0.3rem' }}
                                                    >
                                                        {col.labelKey ? t(col.labelKey) : col.label}
                                                        {sortColumn === col.key ? (
                                                            <SortIcon size={12} />
                                                        ) : (
                                                            <ArrowUpDown
                                                                size={12}
                                                                className="provider-sort-icon-inactive"
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody onDragEnd={handleDragEnd}>
                                    {sortedKeys.map((k, idx) => (
                                        <ProviderTableRow
                                            key={k.id}
                                            apiKey={k}
                                            onSelect={onSelect}
                                            onCheckHealth={onCheckHealth}
                                            onToggleStatus={onToggleStatus}
                                            onRemoveKey={onRemoveKey}
                                            isChecking={checkingIds.has(k.id)}
                                            searchQuery={searchQuery}
                                            isExpanded={expandedRowId === k.id}
                                            onToggleExpand={() =>
                                                setExpandedRowId(
                                                    expandedRowId === k.id ? null : k.id,
                                                )
                                            }
                                            rowIndex={idx}
                                            isDragging={dragIndex === idx}
                                            isDragOver={dragOverIndex === idx}
                                            onDragStart={() => handleDragStart(idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDrop={() => handleDrop(idx)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="provider-card-grid">
                            {sortedKeys.map((k) => (
                                <ProviderCard
                                    key={k.id}
                                    apiKey={k}
                                    onSelect={onSelect}
                                    onCheckHealth={onCheckHealth}
                                    onToggleStatus={onToggleStatus}
                                    onRemoveKey={onRemoveKey}
                                    isChecking={checkingIds.has(k.id)}
                                    searchQuery={searchQuery}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="glass-panel provider-empty-state">
                        <Package size={48} />
                        <h3>{t('provider.no_providers_found')}</h3>
                        <p>
                            {searchQuery
                                ? t('provider.try_different_search')
                                : t('provider.add_provider_to_start')}
                        </p>
                    </div>
                )}
            </div>
        );
    },
);

export default InstalledProvidersView;
