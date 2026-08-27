import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
    Activity,
    Terminal,
    AlertTriangle,
    CheckCircle,
    Trash2,
    Zap,
    Search,
    Clock,
    Filter,
} from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { eventBus } from '../../kernel/instances';
import { storageAdapter } from '../../kernel/instances';
import {
    buttonGroupPill,
    flex1Min0,
    flexAlignCenterGap2,
    posRelative,
    textSecondaryXs,
} from '../../styles/common';
import { Button } from '../Common';
import { safeJsonParse } from '../../kernel/utils/safe-json';

let eventIdCounter = 0;

type TimelineEvent = {
    id: number;
    time: string;
    timestamp: number;
    event: string;
    summary: string;
    severity: 'info' | 'success' | 'warning' | 'error';
};

type GroupMode = 'none' | 'time' | 'event';

const SEVERITY_ICONS = {
    error: <AlertTriangle size={14} color="#ef4444" />,
    warning: <Zap size={14} color="#f59e0b" />,
    success: <CheckCircle size={14} color="#10b981" />,
    info: <Activity size={14} color="#3b82f6" />,
};

const SEVERITY_COLORS = {
    error: { dot: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    warning: { dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    success: { dot: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    info: { dot: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
};

const STORAGE_KEY = 'events-timeline';
const MAX_EVENTS = 500;

const loadEvents = (): TimelineEvent[] => {
    try {
        const raw = storageAdapter.getItem(STORAGE_KEY);
        const events = raw ? (safeJsonParse(raw) as TimelineEvent[]) : [];
        // G-03: eventIdCounter is module-level and resets to 0 on reload, but events
        // are persisted to localStorage. Without advancing the counter past the max
        // loaded id, new events collide with persisted ids (e.g. keys `4` duplicated)
        // — React "Encountered two children with the same key" console spam.
        const maxId = events.reduce((m, e) => Math.max(m, e.id), 0);
        if (maxId >= eventIdCounter) eventIdCounter = maxId + 1;
        return events;
    } catch {
        return [];
    }
};

const saveEvents = (events: TimelineEvent[]) => {
    try {
        storageAdapter.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
    } catch {
        /* quota exceeded */
    }
};

const getTimeGroup = (ts: number, now: number): string => {
    const diff = now - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 7200000) return '1 hour ago';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 172800000) return 'Yesterday';
    return `${Math.floor(diff / 86400000)} days ago`;
};

const EventsTimeline: React.FC = () => {
    const now = useNow();
    const [events, setEvents] = useState<TimelineEvent[]>(() => loadEvents());
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [groupMode, setGroupMode] = useState<GroupMode>('none');
    const [isPaused, setIsPaused] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestEventsRef = useRef<TimelineEvent[]>(events);
    const timelineIsMountedRef = useRef(true);

    const debouncedSave = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            if (timelineIsMountedRef.current) saveEvents(latestEventsRef.current);
        }, 300);
    }, []);

    useEffect(() => {
        timelineIsMountedRef.current = true;
        const unsub = eventBus.subscribeAll(({ event, data }) => {
            if (isPaused) return;
            const d =
                typeof data === 'object' && data ? (data as Record<string, unknown>) : undefined;
            const severity: TimelineEvent['severity'] =
                event.includes('error') || d?.type === 'error'
                    ? 'error'
                    : event.includes('violation') || d?.type === 'warning'
                      ? 'warning'
                      : event.includes('end') || d?.type === 'success'
                        ? 'success'
                        : 'info';

            eventIdCounter += 1;
            const now = Date.now();
            const newEvent: TimelineEvent = {
                id: eventIdCounter,
                time: new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                timestamp: now,
                event,
                summary: summarizeEvent(
                    data as Record<string, unknown> | string | null | undefined,
                ),
                severity,
            };

            setEvents((prev) => {
                const next = [newEvent, ...prev].slice(0, MAX_EVENTS);
                latestEventsRef.current = next;
                debouncedSave();
                return next;
            });
        });
        return () => {
            timelineIsMountedRef.current = false;
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
            unsub();
        };
    }, [isPaused, debouncedSave]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            setShowScrollToBottom(el.scrollTop > 100);
        };
        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    const filteredEvents = useMemo(() => {
        let list = events;
        if (severityFilter !== 'all') list = list.filter((e) => e.severity === severityFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (e) => e.event.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q),
            );
        }
        return list;
    }, [events, severityFilter, searchQuery]);

    const groupedEvents = useMemo(() => {
        if (groupMode === 'none') return null;
        const groups: Record<string, TimelineEvent[]> = {};
        for (const e of filteredEvents) {
            const key = groupMode === 'time' ? getTimeGroup(e.timestamp, now) : e.event;
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        }
        return groups;
    }, [filteredEvents, groupMode, now]);

    const clearEvents = () => {
        setEvents([]);
        eventIdCounter = 0;
        saveEvents([]);
    };

    const scrollToLatest = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    };

    if (events.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    height: '100%',
                    padding: 16,
                }}
            >
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        No events yet
                    </p>
                    <p style={{ fontSize: '0.85rem' }}>
                        System events will appear here as they occur.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}
            >
                <div style={flexAlignCenterGap2}>
                    <Terminal size={20} color="#a855f7" />
                    <h2
                        style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-50)' }}
                    >
                        Events Timeline
                    </h2>
                    <span style={textSecondaryXs}>({filteredEvents.length} events)</span>
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={posRelative}>
                        <Search
                            size={14}
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--slate-500)',
                                pointerEvents: 'none',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '0.4rem 0.8rem 0.4rem 2rem',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'var(--slate-50)',
                                fontSize: '0.75rem',
                                width: 160,
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div style={buttonGroupPill}>
                        {['all', 'info', 'success', 'warning', 'error'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSeverityFilter(s)}
                                style={{
                                    padding: '0.3rem 0.7rem',
                                    borderRadius: 8,
                                    border: 'none',
                                    background:
                                        severityFilter === s
                                            ? 'rgba(59,130,246,0.2)'
                                            : 'transparent',
                                    color: severityFilter === s ? '#60a5fa' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div style={buttonGroupPill}>
                        {(['none', 'time', 'event'] as GroupMode[]).map((g) => (
                            <button
                                key={g}
                                onClick={() => setGroupMode(g)}
                                style={{
                                    padding: '0.3rem 0.7rem',
                                    borderRadius: 8,
                                    border: 'none',
                                    background:
                                        groupMode === g ? 'rgba(139,92,246,0.2)' : 'transparent',
                                    color: groupMode === g ? '#a855f7' : '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                }}
                            >
                                <Filter size={11} />
                                {g === 'none' ? 'Flat' : g === 'time' ? 'By Time' : 'By Event'}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => setIsPaused(!isPaused)}
                        style={{
                            border: `1px solid ${isPaused ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            background: isPaused ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.3)',
                            color: isPaused ? '#f59e0b' : '#94a3b8',
                        }}
                    >
                        {isPaused ? <Zap size={12} /> : <Activity size={12} />}{' '}
                        {isPaused ? 'PAUSED' : 'LIVE'}
                    </Button>
                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={clearEvents}
                        style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: 'var(--slate-400)',
                        }}
                    >
                        <Trash2 size={12} /> Clear
                    </Button>
                </div>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: 'var(--slate-950)',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    position: 'relative',
                }}
            >
                {filteredEvents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {(groupedEvents
                            ? Object.entries(groupedEvents)
                            : [['', filteredEvents] as [string, TimelineEvent[]]]
                        ).map(([groupName, groupEvents]) => (
                            <div
                                key={groupName || 'flat'}
                                style={{ marginBottom: groupName ? '0.75rem' : 0 }}
                            >
                                {groupName && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: '0.5rem',
                                            padding: '0 0.5rem',
                                        }}
                                    >
                                        <Clock size={12} color="#64748b" />
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                color: 'var(--slate-500)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            {groupName}
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-600)' }}>
                                            ({groupEvents.length})
                                        </span>
                                        <div
                                            style={{
                                                flex: 1,
                                                height: 1,
                                                background: 'rgba(255,255,255,0.04)',
                                            }}
                                        />
                                    </div>
                                )}
                                {groupEvents.map((evt, i) => {
                                    const colors = SEVERITY_COLORS[evt.severity];
                                    const isLast = i === groupEvents.length - 1;
                                    return (
                                        <div
                                            key={evt.id}
                                            style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                padding: '0.75rem 1rem',
                                                borderRadius: 10,
                                                background: colors.bg,
                                                border: `1px solid ${colors.border}`,
                                                position: 'relative',
                                                marginBottom: isLast ? 0 : '0.5rem',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${colors.bg.replace('0.1)', '0.15)')}`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = colors.bg;
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    flexShrink: 0,
                                                    width: 20,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 10,
                                                        height: 10,
                                                        borderRadius: '50%',
                                                        background: colors.dot,
                                                        boxShadow: `0 0 8px ${colors.dot}`,
                                                    }}
                                                />
                                                {!isLast && (
                                                    <div
                                                        style={{
                                                            width: 2,
                                                            flex: 1,
                                                            minHeight: 20,
                                                            background: `linear-gradient(to bottom, ${colors.dot}40, transparent)`,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div style={flex1Min0}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        marginBottom: '0.15rem',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            color: 'var(--slate-600)',
                                                            fontFamily: 'monospace',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        [{evt.time}]
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            color: 'var(--slate-200)',
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {evt.event}
                                                    </span>
                                                    <span
                                                        style={{
                                                            marginLeft: 'auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {SEVERITY_ICONS[evt.severity]}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--slate-400)',
                                                        lineHeight: 1.5,
                                                        wordBreak: 'break-word',
                                                        marginLeft: '0.5rem',
                                                    }}
                                                >
                                                    {evt.summary}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: 'var(--slate-600)',
                            gap: '1rem',
                        }}
                    >
                        <Activity size={32} style={{ opacity: 0.3 }} />
                        <span>No events recorded yet</span>
                        <span style={{ fontSize: '0.75rem' }}>
                            System events will appear here in real-time
                        </span>
                    </div>
                )}

                {showScrollToBottom && (
                    <button
                        onClick={scrollToLatest}
                        style={{
                            position: 'sticky',
                            bottom: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '0.4rem 1rem',
                            borderRadius: 8,
                            background: 'rgba(59,130,246,0.2)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                        }}
                    >
                        Jump to Latest
                    </button>
                )}
            </div>
        </div>
    );
};

const summarizeEvent = (data: Record<string, unknown> | string | null | undefined): string => {
    if (!data) return 'No payload';
    if (typeof data === 'string') return data;
    if (data.message) return String(data.message);
    if (data.provider)
        return `${String(data.provider)}${data.model ? ` / ${String(data.model)}` : ''}`;
    if (data.requestId) return `Req ID: ${String(data.requestId)}`;
    try {
        return JSON.stringify(data).slice(0, 120);
    } catch {
        return 'Complex payload';
    }
};

export default EventsTimeline;
