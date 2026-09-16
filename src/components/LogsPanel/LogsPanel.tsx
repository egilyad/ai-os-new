import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePolling } from '../Common/usePolling';
import { Terminal, Search, Filter, Trash2, Download } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { rootLogger } from '../../kernel/instances';
import type { LogEntry, LogLevel } from '../../kernel/contracts/logger';
import { useTranslation } from '../../i18n/useTranslation';

const ROW_HEIGHT = 36;

const LEVEL_CONFIG: Record<LogLevel, { color: string; bg: string }> = {
    debug: { color: 'var(--slate-500)', bg: 'rgba(100,116,139,0.15)' },
    info: { color: 'var(--accent)', bg: 'rgba(59,130,246,0.15)' },
    warn: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.15)' },
    error: { color: 'var(--error)', bg: 'rgba(239,68,68,0.15)' },
};

function formatTime(ts: number): string {
    return new Date(ts).toISOString().slice(11, 23);
}

export const LogsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [entries, setEntries] = useState<ReadonlyArray<LogEntry>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [autoScroll, setAutoScroll] = useState(true);
    const parentRef = useRef<HTMLDivElement>(null);

    usePolling(() => {
        const buf = rootLogger.getBuffer();
        const bufLen = buf.length;
        setEntries(bufLen > 0 ? buf.slice() : []);
    }, 1000);

    const services = useMemo(() => {
        const s = new Set<string>();
        for (const e of entries) {
            if (e.service) s.add(e.service);
        }
        return Array.from(s).sort();
    }, [entries]);

    const filtered = useMemo(() => {
        let result = entries.slice();
        if (levelFilter !== 'all') {
            result = result.filter((e) => e.level === levelFilter);
        }
        if (serviceFilter !== 'all') {
            result = result.filter((e) => e.service === serviceFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (e) =>
                    e.message.toLowerCase().includes(q) ||
                    (e.traceId && e.traceId.toLowerCase().includes(q)) ||
                    e.service.toLowerCase().includes(q),
            );
        }
        return result.reverse();
    }, [entries, levelFilter, serviceFilter, searchQuery]);

    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    useEffect(() => {
        if (autoScroll && filtered.length > 0) {
            virtualizer.scrollToOffset(filtered.length - 1);
        }
    }, [entries, autoScroll, virtualizer, filtered.length]);

    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'text'>('text');

    const handleExport = useCallback(() => {
        const content = rootLogger.exportLogs(exportFormat, {
            ...(levelFilter !== 'all'
                ? { level: levelFilter as 'debug' | 'info' | 'warn' | 'error' }
                : {}),
            ...(serviceFilter !== 'all' ? { service: serviceFilter } : {}),
        });
        if (!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [exportFormat, levelFilter, serviceFilter]);

    const handleClear = useCallback(() => {
        rootLogger.clear();
        setEntries([]);
        virtualizer.scrollToOffset(0);
    }, [virtualizer]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                gap: '1.5rem',
                overflowY: 'auto',
            }}
        >
            <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <Terminal size={28} color="#94a3b8" /> {t('logs.title')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                        {t('logs.subtitle', { count: entries.length })}
                    </p>
                </div>
            </div>

            <div
                className="glass-panel"
                style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    borderRadius: 12,
                }}
            >
                <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder={t('logs.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem 0.5rem 2rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'var(--slate-50)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Filter size={14} color="#64748b" />
                    <div style={{ display: 'flex', gap: 3 }}>
                        {(['all', 'error', 'warn', 'info'] as const).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => setLevelFilter(preset === 'all' ? 'all' : preset)}
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    borderRadius: 6,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background:
                                        levelFilter === preset ||
                                        (preset === 'warn' && levelFilter === 'warn') ||
                                        (preset === 'info' && levelFilter === 'info') ||
                                        (preset === 'error' && levelFilter === 'error') ||
                                        (preset === 'all' && levelFilter === 'all')
                                            ? LEVEL_CONFIG[preset === 'all' ? 'info' : preset].bg
                                            : 'rgba(255,255,255,0.03)',
                                    color:
                                        levelFilter === preset ||
                                        (preset === 'warn' && levelFilter === 'warn') ||
                                        (preset === 'info' && levelFilter === 'info') ||
                                        (preset === 'error' && levelFilter === 'error') ||
                                        (preset === 'all' && levelFilter === 'all')
                                            ? LEVEL_CONFIG[preset === 'all' ? 'info' : preset].color
                                            : '#64748b',
                                }}
                                aria-label={t('logs.filter_' + preset)}
                            >
                                {preset === 'all' ? t('logs.filter_all') : preset.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'var(--slate-50)',
                            outline: 'none',
                            cursor: 'pointer',
                            marginLeft: 4,
                        }}
                    >
                        <option value="all">{t('logs.filter_all_levels')}</option>
                        <option value="debug">{t('logs.filter_debug')}</option>
                        <option value="info">{t('logs.filter_info')}</option>
                        <option value="warn">{t('logs.filter_warn')}</option>
                        <option value="error">{t('logs.filter_error')}</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={14} color="#64748b" />
                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: 8,
                            fontSize: '0.8rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'var(--slate-50)',
                            outline: 'none',
                            cursor: 'pointer',
                            maxWidth: 160,
                        }}
                    >
                        <option value="all">{t('logs.filter_all_services')}</option>
                        {services.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'text')}
                        style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: 'var(--slate-50)',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="text">TXT</option>
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                    </select>
                    <button
                        onClick={handleExport}
                        title="Export logs"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.4rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(59,130,246,0.2)',
                            background: 'var(--accent-tint)',
                            color: '#93c5fd',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        <Download size={14} /> Export
                    </button>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.75rem',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => setAutoScroll(e.target.checked)}
                        />
                        {t('logs.auto_scroll')}
                    </label>
                    <button
                        onClick={handleClear}
                        title={t('logs.clear_title')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.4rem 0.75rem',
                            borderRadius: 8,
                            border: '1px solid rgba(239,68,68,0.2)',
                            background: 'var(--error-tint)',
                            color: '#fca5a5',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        <Trash2 size={14} /> {t('logs.clear')}
                    </button>
                </div>
            </div>

            <div
                className="glass-panel"
                ref={parentRef}
                style={{
                    flex: 1,
                    borderRadius: 12,
                    overflowY: 'auto',
                    padding: 0,
                    minHeight: 0,
                    contain: 'strict',
                }}
            >
                {filtered.length === 0 ? (
                    <div
                        style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--slate-700)',
                            flexDirection: 'column',
                            gap: '1rem',
                        }}
                    >
                        <Terminal size={48} />
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('logs.empty')}</p>
                    </div>
                ) : (
                    <div style={{ fontSize: '0.8rem', position: 'relative' }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '90px 70px 120px 100px 1fr',
                                padding: '0.6rem 0.75rem',
                                color: 'var(--slate-400)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                fontSize: '0.65rem',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                background: 'rgba(0,0,0,0.2)',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                            }}
                        >
                            <div>{t('logs.col_timestamp')}</div>
                            <div>{t('logs.col_level')}</div>
                            <div>{t('logs.col_service')}</div>
                            <div>{t('logs.col_trace_id')}</div>
                            <div>{t('logs.col_message')}</div>
                        </div>
                        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                            {virtualizer.getVirtualItems().map((vi) => {
                                const entry = filtered[vi.index];
                                if (!entry) return null;
                                const lc = LEVEL_CONFIG[entry.level] ?? LEVEL_CONFIG.info;
                                return (
                                    <div
                                        key={`${entry.timestamp}-${vi.index}`}
                                        data-index={vi.index}
                                        ref={virtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            transform: `translateY(${vi.start}px)`,
                                            display: 'grid',
                                            gridTemplateColumns: '90px 70px 120px 100px 1fr',
                                            padding: '0.5rem 0.75rem',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            background:
                                                entry.level === 'error'
                                                    ? 'rgba(239,68,68,0.03)'
                                                    : undefined,
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: 'var(--slate-500)',
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {formatTime(entry.timestamp)}
                                        </div>
                                        <div>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: 4,
                                                    background: lc.bg,
                                                    color: lc.color,
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                }}
                                            >
                                                {entry.level}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                color: 'var(--slate-300)',
                                                whiteSpace: 'nowrap',
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            {entry.service}
                                        </div>
                                        <div
                                            style={{
                                                color: 'var(--slate-500)',
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                            }}
                                        >
                                            {entry.traceId ? entry.traceId.slice(0, 12) : '-'}
                                        </div>
                                        <div
                                            style={{
                                                color: 'var(--slate-200)',
                                                wordBreak: 'break-word',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            {entry.message}
                                            {entry.action && (
                                                <span
                                                    style={{
                                                        color: 'var(--slate-500)',
                                                        marginLeft: 8,
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    ({entry.action})
                                                </span>
                                            )}
                                            {entry.latency !== undefined && (
                                                <span
                                                    style={{
                                                        color: 'var(--slate-500)',
                                                        marginLeft: 8,
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    {entry.latency}ms
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsPanel;
