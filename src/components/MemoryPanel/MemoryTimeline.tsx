import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Tag, Star, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { MemoryEntry } from '../../types/memory';

interface MemoryTimelineProps {
    entries: MemoryEntry[];
    onDelete: (id: string) => void;
}

interface DayGroup {
    label: string;
    date: number;
    entries: MemoryEntry[];
}

function groupByDate(entries: MemoryEntry[], now: number): DayGroup[] {
    const msPerDay = 86_400_000;
    const today = new Date(now);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    const groups: Record<string, DayGroup> = {};

    for (const entry of entries) {
        const ts = entry.metadata.timestamp;
        const daysDiff = Math.floor((todayStart - ts) / msPerDay);
        let label: string;
        if (daysDiff < 0) label = 'Today';
        else if (daysDiff === 0) label = 'Today';
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

const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ entries, onDelete }) => {
    const { t } = useTranslation();
    const now = Date.now();
    const groups = useMemo(() => groupByDate(entries, now), [entries, now]);

    if (entries.length === 0) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: '6rem 0',
                    color: 'var(--slate-500)',
                }}
            >
                <Clock size={56} style={{ opacity: 0.2, margin: '0 auto 1.5rem' }} />
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {t('memory.empty_collection')}
                </p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div
                style={{
                    position: 'absolute',
                    left: 14,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background:
                        'linear-gradient(to bottom, rgba(168,85,247,0.4), rgba(59,130,246,0.1))',
                    borderRadius: 1,
                }}
                aria-hidden="true"
            />
            {groups.map((group) => (
                <div key={group.label} style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 12,
                            marginLeft: -32,
                        }}
                    >
                        <div
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: '#a855f7',
                                border: '2px solid rgba(168,85,247,0.3)',
                                flexShrink: 0,
                                zIndex: 1,
                            }}
                        />
                        <span
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#a855f7',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                            }}
                        >
                            {group.label}
                        </span>
                        <span
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--slate-500)',
                            }}
                        >
                            {group.entries.length}{' '}
                            {group.entries.length === 1 ? 'entry' : 'entries'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {group.entries.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    position: 'relative',
                                    marginLeft: 8,
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 12,
                                    cursor: 'default',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 8,
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 700,
                                                    color: 'var(--success)',
                                                    background: 'rgba(16,185,129,0.12)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: 4,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}
                                            >
                                                {entry.metadata.type || 'context'}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    color: 'var(--slate-500)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                <Tag size={10} />{' '}
                                                {entry.metadata.source || 'system'}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.65rem',
                                                    color: 'var(--slate-500)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                <Clock size={10} />{' '}
                                                {new Date(
                                                    entry.metadata.timestamp,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            {(entry.metadata.importance ?? 0) > 0 && (
                                                <span
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        color:
                                                            (entry.metadata.importance ?? 0) >= 0.8
                                                                ? '#ef4444'
                                                                : (entry.metadata.importance ??
                                                                        0) >= 0.5
                                                                  ? '#f59e0b'
                                                                  : '#94a3b8',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                    }}
                                                >
                                                    <Star size={10} fill="currentColor" />{' '}
                                                    {entry.metadata.importance}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--slate-200)',
                                                lineHeight: 1.5,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {entry.content}
                                        </div>
                                    </div>
                                    <button
                                        className="btn-secondary"
                                        style={{
                                            padding: '0.3rem',
                                            borderRadius: 6,
                                            color: 'var(--error)',
                                            flexShrink: 0,
                                            opacity: 0.5,
                                            transition: 'opacity 0.15s',
                                        }}
                                        title={t('memory.delete_vector')}
                                        aria-label={t('common.aria.delete')}
                                        onClick={() => onDelete(entry.id)}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.opacity = '1';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.opacity = '0.5';
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MemoryTimeline;
