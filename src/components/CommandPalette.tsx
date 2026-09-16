import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    ArrowRight,
    Clock,
    X,
    Plus,
    MessageSquare,
    Workflow,
    Users,
    Bookmark,
    Hash,
} from 'lucide-react';
import { NAV_SECTIONS } from '../route-registry';
import type { TranslationKey } from '../i18n/translations';
import { safeJsonParse } from '../kernel/utils/safe-json';
import { ssrSafeStorage } from '../kernel/utils/ssr-storage';
import { agentService } from '../kernel/instances/services-core';
import { forumService } from '../kernel/instances/services-extras';

// ─── Fuzzy match helper ───────────────────────────────────────────────────────
function fuzzyScore(pattern: string, text: string): number {
    if (!pattern) return 0;
    const p = pattern.toLowerCase();
    const t = text.toLowerCase();
    let pi = 0;
    let score = 0;
    let lastIdx = -1;
    for (let i = 0; i < t.length && pi < p.length; i++) {
        if (t[i] === p[pi]) {
            score += t[i] === p[0] ? 10 : 1; // bonus for starting char
            if (lastIdx + 1 === i) score += 3; // bonus for consecutive
            lastIdx = i;
            pi++;
        }
    }
    if (pi < p.length) return -1; // didn't match all
    return score + text.length * 0.1; // prefer shorter strings
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaletteItem {
    id: string;
    label: string;
    path: string;
    section: string;
    color: string;
    icon: React.ReactNode;
    recent?: boolean;
    /** Optional command to run on select (in addition to navigation). */
    action?: () => void;
}

const RECENT_KEY = 'mavis:palette:recent';
const MAX_RECENT = 8;

function getRecent(): string[] {
    try {
        return (safeJsonParse(ssrSafeStorage.getItem(RECENT_KEY) || '[]') as string[]) ?? [];
    } catch {
        return [];
    }
}

function saveRecent(path: string) {
    try {
        const prev = getRecent().filter((p) => p !== path);
        ssrSafeStorage.setItem(RECENT_KEY, JSON.stringify([path, ...prev].slice(0, MAX_RECENT)));
    } catch {
        /* storage unavailable */
    }
}

// ─── Build flat list from NAV_SECTIONS + common actions ───────────────────────
function buildItems(t: (key: TranslationKey) => string): PaletteItem[] {
    const items: PaletteItem[] = [];

    // Common actions — jump to a creation/entry surface quickly.
    const actions: Array<{
        id: string;
        labelKey: string;
        path: string;
        icon: React.ReactNode;
        color: string;
    }> = [
        {
            id: 'action-new-scenario',
            labelKey: 'palette.action.newScenario',
            path: 'director',
            icon: <Plus size={16} />,
            color: 'var(--success)',
        },
        {
            id: 'action-new-debate',
            labelKey: 'palette.action.newDebate',
            path: 'debate',
            icon: <MessageSquare size={16} />,
            color: 'var(--warning)',
        },
        {
            id: 'action-new-workflow',
            labelKey: 'palette.action.newWorkflow',
            path: 'builder',
            icon: <Workflow size={16} />,
            color: 'var(--info)',
        },
        {
            id: 'action-open-forum',
            labelKey: 'palette.action.openForum',
            path: 'forum',
            icon: <Users size={16} />,
            color: '#a855f7',
        },
        {
            id: 'action-open-room',
            labelKey: 'palette.action.openRoom',
            path: 'room',
            icon: <Hash size={16} />,
            color: '#22d3ee',
        },
    ];
    for (const a of actions) {
        items.push({
            id: a.id,
            label: t(a.labelKey as TranslationKey),
            path: a.path,
            section: t('palette.section.actions'),
            color: a.color,
            icon: a.icon,
        });
    }

    for (const section of NAV_SECTIONS) {
        for (const item of section.items) {
            items.push({
                id: item.id,
                label: t(item.labelKey),
                path: item.id,
                section: t(section.labelKey),
                color: item.color,
                icon: item.icon,
            });
        }
    }
    return items;
}

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
    <div
        style={{
            padding: '0.5rem 1rem 0.25rem',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--slate-500)',
        }}
    >
        {label}
    </div>
);

// ─── CommandPalette ────────────────────────────────────────────────────────────
interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
    t: (key: TranslationKey) => string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, t }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const staticItems = useMemo(() => buildItems(t), [t]);
    const agentItems = useMemo<PaletteItem[]>(() => {
        try {
            return agentService.getAgents().map((a) => ({
                id: `agent-${a.id}`,
                label: a.name,
                path: `agents?agent=${encodeURIComponent(a.id)}`,
                section: t('palette.section.agents'),
                color: 'var(--success)',
                icon: <Users size={16} />,
            }));
        } catch {
            return [];
        }
    }, [t]);
    const [topicItems, setTopicItems] = useState<PaletteItem[]>([]);
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        forumService
            .listTopics({ pageSize: 30 })
            .then((page) => {
                if (cancelled) return;
                setTopicItems(
                    page.items.map((tp) => ({
                        id: `topic-${tp.id}`,
                        label: (tp as { title?: string; id: string }).title ?? tp.id,
                        path: `forum?topic=${encodeURIComponent(tp.id)}`,
                        section: t('palette.section.topics'),
                        color: '#a855f7',
                        icon: <Bookmark size={16} />,
                    })),
                );
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [open, t]);
    const allItems = useMemo(
        () => [...staticItems, ...agentItems, ...topicItems],
        [staticItems, agentItems, topicItems],
    );
    const recentPaths = useMemo(() => getRecent(), []);
    const recentItems = useMemo(
        () =>
            recentPaths
                .map((p) => allItems.find((i) => i.path === p))
                .filter(Boolean) as PaletteItem[],
        [recentPaths, allItems],
    );

    const filtered = useMemo(
        () =>
            query.trim()
                ? allItems
                      .map((item) => ({ item, score: fuzzyScore(query, item.label) }))
                      .filter(({ score }) => score >= 0)
                      .sort((a, b) => b.score - a.score)
                      .map(({ item }) => item)
                : recentItems.length > 0
                  ? recentItems
                  : allItems.slice(0, 8),
        [query, allItems, recentItems],
    );

    // Re-derive items when language changes (t() is stable per session)
    useEffect(() => {
        if (open) setQuery(''); // eslint-disable-line react-hooks/set-state-in-effect
    }, [open]);

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    useEffect(() => {
        setSelected(0); // eslint-disable-line react-hooks/set-state-in-effect
    }, [query]);

    const handleSelect = useCallback(
        (item: PaletteItem) => {
            saveRecent(item.path);
            item.action?.();
            if (item.path) navigate(`/${item.path}`);
            onClose();
            setQuery('');
        },
        [navigate, onClose],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelected((s) => Math.min(s + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelected((s) => Math.max(s - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selected]) handleSelect(filtered[selected]);
        } else if (e.key === 'Escape') {
            onClose();
            setQuery('');
        }
    };

    // Scroll selected into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const el = list.querySelector(`[data-idx="${selected}"]`) as HTMLElement;
        if (el) el.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    if (!open) return null;

    // Group items by section when there's no query
    const grouped =
        !query.trim() && recentItems.length > 0
            ? [{ section: t('palette.recent'), items: recentItems, isRecent: true }]
            : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '15vh',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: 560,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 12,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        overflow: 'hidden',
                        margin: '0 1rem',
                    }}
                >
                    {/* Search input */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.875rem 1rem',
                            borderBottom: '1px solid var(--border-color)',
                        }}
                    >
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('palette.placeholder')}
                            style={{
                                flex: 1,
                                background: 'none',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '1rem',
                            }}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: 0,
                                    display: 'flex',
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                        <kbd
                            style={{
                                padding: '0.15rem 0.4rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                fontFamily: 'monospace',
                            }}
                        >
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {grouped ? (
                            <div>
                                <SectionHeader label={t('palette.recent')} />
                                {grouped[0]!.items.map((item, idx) => (
                                    <PaletteRow
                                        key={item.id}
                                        item={item}
                                        idx={idx}
                                        selected={selected === idx}
                                        onSelect={handleSelect}
                                        t={t}
                                        isRecent
                                    />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {t('palette.no_results')}
                            </div>
                        ) : (
                            filtered.map((item, idx) => (
                                <PaletteRow
                                    key={item.id}
                                    item={item}
                                    idx={idx}
                                    selected={selected === idx}
                                    onSelect={handleSelect}
                                    t={t}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            padding: '0.5rem 1rem',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <span>
                            <kbd style={kbdStyle}>↑↓</kbd> {t('palette.nav')}
                        </span>
                        <span>
                            <kbd style={kbdStyle}>↵</kbd> {t('palette.select')}
                        </span>
                        <span>
                            <kbd style={kbdStyle}>ESC</kbd> {t('palette.close')}
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const kbdStyle: React.CSSProperties = {
    padding: '0.1rem 0.3rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 3,
    fontFamily: 'monospace',
    fontSize: '0.65rem',
};

// ─── Palette Row ──────────────────────────────────────────────────────────────
interface PaletteRowProps {
    item: PaletteItem;
    idx: number;
    selected: boolean;
    onSelect: (item: PaletteItem) => void;
    t: (key: TranslationKey) => string;
    isRecent?: boolean;
}

const PaletteRow: React.FC<PaletteRowProps> = ({ item, idx, selected, onSelect, isRecent }) => (
    <div
        data-idx={idx}
        onClick={() => onSelect(item)}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            cursor: 'pointer',
            background: selected ? 'rgba(59,130,246,0.15)' : 'transparent',
            borderLeft: selected ? '2px solid #3b82f6' : '2px solid transparent',
            transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => {
            if (!selected)
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
        }}
        onMouseLeave={(e) => {
            if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
    >
        <div
            style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: `${item.color}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: item.color,
            }}
        >
            {item.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div
                style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {item.label}
            </div>
            <div
                style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                }}
            >
                {item.section}
            </div>
        </div>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: selected ? '#60a5fa' : 'var(--text-muted)',
                flexShrink: 0,
            }}
        >
            {isRecent ? <Clock size={13} /> : <ArrowRight size={14} />}
        </div>
    </div>
);

// ─── useCommandPalette hook ───────────────────────────────────────────────────
export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((v) => !v);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
