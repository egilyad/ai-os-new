import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePolling } from './Common/usePolling';
import { Terminal, AlertTriangle, Info, Zap, Activity, Search, Download } from 'lucide-react';
import { adminService } from '../kernel/instances';
import { eventBus, EVENTS } from '../kernel/instances';
import type { AdminAuditEntry } from '../kernel/instances';

const SEVERITY_ICONS = {
    error: <AlertTriangle size={14} color="#ef4444" />,
    warning: <Zap size={14} color="#f59e0b" />,
    info: <Info size={14} color="#3b82f6" />,
};

const AuditLogView: React.FC = () => {
    const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [period, setPeriod] = useState<string>('all');

    const refresh = useCallback(() => setEntries(adminService.getAuditLog(200) ?? []), []);

    useEffect(() => {
        refresh();
        const unsub = eventBus.on(EVENTS.NOTIFICATION, refresh);
        return () => unsub();
    }, [refresh]);
    usePolling(refresh, 5000);

    const handleExport = useCallback(() => {
        const json = JSON.stringify(entries, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [entries]);

    const filtered = useMemo(() => {
        let result = entries;
        if (severityFilter !== 'all') result = result.filter((e) => e.severity === severityFilter);
        const now = Date.now();
        const DAY = 86_400_000;
        let fromMs = 0;
        let toMs = Number.MAX_SAFE_INTEGER;
        if (period === '24h') fromMs = now - DAY;
        else if (period === '7d') fromMs = now - 7 * DAY;
        else if (period === '30d') fromMs = now - 30 * DAY;
        else if (period === 'custom') {
            if (fromDate) fromMs = new Date(fromDate + 'T00:00:00').getTime() || 0;
            if (toDate) toMs = new Date(toDate + 'T23:59:59').getTime() || Number.MAX_SAFE_INTEGER;
        }
        if (fromMs > 0 || toMs < Number.MAX_SAFE_INTEGER) {
            result = result.filter((e) => e.timestamp >= fromMs && e.timestamp <= toMs);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (e) =>
                    e.action.toLowerCase().includes(q) ||
                    e.target.toLowerCase().includes(q) ||
                    e.details.toLowerCase().includes(q) ||
                    e.actor.toLowerCase().includes(q),
            );
        }
        return result.reverse();
    }, [entries, severityFilter, searchQuery, period, fromDate, toDate]);

    const handleExportCsv = useCallback(() => {
        const cols = ['timestamp', 'severity', 'action', 'actor', 'target', 'details'];
        const escape = (v: unknown): string => {
            const s = String(v ?? '');
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const rows = filtered.map((e) =>
            cols.map((c) => escape((e as unknown as Record<string, unknown>)[c])).join(','),
        );
        const csv = [cols.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filtered]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Terminal size={20} color="#3b82f6" />
                    <h2
                        style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-50)' }}
                    >
                        Request Audit Log
                    </h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                        ({entries.length} entries)
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={12}
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter entries..."
                            style={{
                                padding: '0.4rem 0.75rem 0.4rem 2rem',
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: 'white',
                                fontSize: '0.8rem',
                                width: 180,
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 8,
                            padding: '0.15rem',
                        }}
                    >
                        {['all', 'info', 'warning', 'error'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSeverityFilter(s)}
                                style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: 6,
                                    border: 'none',
                                    background:
                                        severityFilter === s
                                            ? 'rgba(59,130,246,0.2)'
                                            : 'transparent',
                                    color: severityFilter === s ? '#60a5fa' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        title="Time range"
                        style={{
                            padding: '0.35rem 0.5rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#a1a1aa',
                            fontSize: '0.65rem',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <option value="all">All time</option>
                        <option value="24h">24h</option>
                        <option value="7d">7d</option>
                        <option value="30d">30d</option>
                    </select>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => {
                            setFromDate(e.target.value);
                            setPeriod('custom');
                        }}
                        title="From date"
                        style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#a1a1aa',
                            fontSize: '0.65rem',
                            outline: 'none',
                        }}
                    />
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => {
                            setToDate(e.target.value);
                            setPeriod('custom');
                        }}
                        title="To date"
                        style={{
                            padding: '0.3rem 0.5rem',
                            borderRadius: 8,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#a1a1aa',
                            fontSize: '0.65rem',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleExport}
                        title="Export as JSON"
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.65rem',
                        }}
                    >
                        <Download size={12} />
                        Export
                    </button>
                    <button
                        onClick={handleExportCsv}
                        title="Export as CSV"
                        style={{
                            padding: '0.4rem 0.6rem',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.65rem',
                        }}
                    >
                        <Download size={12} />
                        CSV
                    </button>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                }}
            >
                {filtered.length > 0 ? (
                    filtered.map((e) => (
                        <div
                            key={e.id}
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: 8,
                                background:
                                    e.severity === 'error'
                                        ? 'rgba(239,68,68,0.05)'
                                        : 'rgba(0,0,0,0.15)',
                                border: `1px solid ${e.severity === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)'}`,
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ flexShrink: 0 }}>{SEVERITY_ICONS[e.severity]}</span>
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-500)',
                                    fontFamily: 'monospace',
                                    flexShrink: 0,
                                    width: 108,
                                }}
                            >
                                {new Date(e.timestamp).toLocaleString(undefined, {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            <span
                                style={{
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: 4,
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--slate-500)',
                                    textTransform: 'uppercase',
                                    flexShrink: 0,
                                }}
                            >
                                {e.action}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-400)',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {e.actor}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', flexShrink: 0 }}>
                                →
                            </span>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-200)',
                                    fontWeight: 600,
                                    flexShrink: 0,
                                }}
                            >
                                {e.target}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    flex: 1,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {e.details}
                            </span>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                        <Activity size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <div>No audit entries</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogView;
