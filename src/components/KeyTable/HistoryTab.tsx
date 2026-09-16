import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Activity,
    AlertTriangle,
    RotateCw,
    Plus,
    Zap,
    Ban,
    CheckCircle2,
    MessageSquare,
    CalendarDays,
    TrendingUp,
    TrendingDown,
    Minus,
} from 'lucide-react';
import type { ApiKey, KeyHistoryEntry } from '../../types/metrics';

interface HistoryTabProps {
    apiKey: ApiKey;
}

const ACTION_META: Record<
    KeyHistoryEntry['action'],
    { icon: React.ReactNode; color: string; label: string }
> = {
    added: { icon: <Plus size={14} />, color: 'var(--accent)', label: 'Added' },
    probed: { icon: <Activity size={14} />, color: 'var(--success)', label: 'Probe' },
    quota_exceeded: {
        icon: <AlertTriangle size={14} />,
        color: 'var(--warning)',
        label: 'Quota Exceeded',
    },
    error: { icon: <Ban size={14} />, color: 'var(--error)', label: 'Error' },
    rotated: { icon: <RotateCw size={14} />, color: 'var(--purple)', label: 'Rotated' },
    status_changed: { icon: <Zap size={14} />, color: '#f97316', label: 'Status Changed' },
    latency_burst: { icon: <Clock size={14} />, color: '#ec4899', label: 'Latency Burst' },
    reputation_changed: {
        icon: <CheckCircle2 size={14} />,
        color: '#06b6d4',
        label: 'Reputation Changed',
    },
    note_added: { icon: <MessageSquare size={14} />, color: 'var(--slate-500)', label: 'Note Added' },
};

interface DayGroup {
    label: string;
    date: number;
    entries: KeyHistoryEntry[];
}

function groupByDate(entries: KeyHistoryEntry[], now: number): DayGroup[] {
    const msPerDay = 86_400_000;
    const today = new Date(now);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const groups: Record<string, DayGroup> = {};

    for (const entry of entries) {
        const ts = entry.timestamp;
        const daysDiff = Math.floor((todayStart - ts) / msPerDay);
        let label: string;
        if (daysDiff === 0) label = 'Today';
        else if (daysDiff === 1) label = 'Yesterday';
        else if (daysDiff <= 7) label = `${daysDiff} days ago`;
        else if (daysDiff <= 30) label = 'This Month';
        else label = 'Older';

        if (!groups[label]) {
            groups[label] = { label, date: ts, entries: [] };
        }
        groups[label]!.entries.push(entry);
    }

    const order = ['Today', 'Yesterday', 'days ago', 'This Month', 'Older'];
    return Object.values(groups).sort((a, b) => {
        const ia = order.findIndex((o) => a.label.includes(o));
        const ib = order.findIndex((o) => b.label.includes(o));
        if (ia !== ib) return ia - ib;
        return b.date - a.date;
    });
}

function computeKeyAge(createdAt?: number): string {
    if (!createdAt) return 'Unknown';
    const days = Math.floor((Date.now() - createdAt) / 86_400_000);
    if (days < 1) return 'Less than a day';
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} (${days} days)`;
}

function computeTrend(history: KeyHistoryEntry[]): {
    icon: React.ReactNode;
    text: string;
    color: string;
} {
    const recent = history.slice(-10);
    const errors = recent.filter(
        (e) => e.action === 'error' || e.action === 'quota_exceeded',
    ).length;
    const total = recent.length;
    if (total === 0)
        return { icon: <Minus size={14} />, text: 'No recent activity', color: 'var(--slate-500)' };
    const errorRate = errors / total;
    if (errorRate > 0.3)
        return { icon: <TrendingDown size={14} />, text: 'Degrading', color: 'var(--error)' };
    if (errorRate > 0.1) return { icon: <Minus size={14} />, text: 'Unstable', color: 'var(--warning)' };
    return { icon: <TrendingUp size={14} />, text: 'Stable', color: 'var(--success)' };
}

const HistoryTab: React.FC<HistoryTabProps> = ({ apiKey }) => {
    const history = useMemo(() => apiKey.history || [], [apiKey.history]);
    const now = Date.now();

    const groups = useMemo(() => groupByDate([...history].reverse(), now), [history, now]);
    const keyAge = useMemo(() => computeKeyAge(apiKey.createdAt), [apiKey.createdAt]);
    const trend = useMemo(() => computeTrend(history), [history]);

    if (history.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '2rem',
                    color: 'var(--slate-500)',
                }}
            >
                <Clock size={32} opacity={0.3} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>No history yet</span>
                <span style={{ fontSize: '0.75rem' }}>
                    Events will appear as the key is used and probed.
                </span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                }}
            >
                <div
                    style={{
                        padding: '0.75rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <CalendarDays size={12} /> Key Age
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                        {keyAge}
                    </span>
                </div>
                <div
                    style={{
                        padding: '0.75rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Total Events
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                        {history.length}
                    </span>
                </div>
                <div
                    style={{
                        padding: '0.75rem',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.6rem',
                            color: 'var(--slate-500)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}
                    >
                        Recent Trend
                    </div>
                    <span
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: trend.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        {trend.icon} {trend.text}
                    </span>
                </div>
            </div>

            <div style={{ position: 'relative', paddingLeft: 28 }}>
                <div
                    style={{
                        position: 'absolute',
                        left: 12,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background:
                            'linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(168,85,247,0.1))',
                        borderRadius: 1,
                    }}
                    aria-hidden="true"
                />
                {groups.map((group) => (
                    <div key={group.label} style={{ marginBottom: 20 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 10,
                                marginLeft: -28,
                            }}
                        >
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    border: '2px solid rgba(59,130,246,0.3)',
                                    flexShrink: 0,
                                    zIndex: 1,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                }}
                            >
                                {group.label}
                            </span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                {group.entries.length} event{group.entries.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {group.entries.map((entry) => {
                                const meta = ACTION_META[entry.action];
                                const time = new Date(entry.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                });
                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            padding: '0.6rem 0.75rem',
                                            borderRadius: 8,
                                            background: 'rgba(255,255,255,0.02)',
                                            borderLeft: `3px solid ${meta?.color || '#64748b'}`,
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.6rem',
                                            fontSize: '0.78rem',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: meta?.color || '#64748b',
                                                flexShrink: 0,
                                                marginTop: 2,
                                            }}
                                        >
                                            {meta?.icon || <Clock size={14} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 700,
                                                        color: meta?.color || '#e2e8f0',
                                                        fontSize: '0.72rem',
                                                    }}
                                                >
                                                    {meta?.label || entry.action}
                                                </span>
                                                <span
                                                    style={{
                                                        color: 'var(--slate-600)',
                                                        fontSize: '0.62rem',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {time}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    color: 'var(--slate-400)',
                                                    fontSize: '0.7rem',
                                                    marginTop: '0.1rem',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {entry.detail}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryTab;
