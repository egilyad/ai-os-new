import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_SECTIONS } from '../../route-registry';
import { useTranslation } from '../../i18n/useTranslation';
import { agentService, sessionManager } from '../../kernel/instances';
import { crystalVault } from '../../kernel/instances/services-extras';

interface PaletteItem {
    id: string;
    label: string;
    section: string;
    target: string;
}

const CommandPalette: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [idx, setIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dynamic, setDynamic] = useState<PaletteItem[]>([]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((p) => {
                    if (!p) setQuery('');
                    return !p;
                });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (open) {
            const id = window.setTimeout(() => inputRef.current?.focus(), 10);
            return () => window.clearTimeout(id);
        }
        return undefined;
    }, [open]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const load = async () => {
            const out: PaletteItem[] = [];
            try {
                const agents = agentService.getAgents?.() ?? [];
                agents.slice(0, 8).forEach((a) => {
                    out.push({
                        id: `ag:${a.id}`,
                        label: a.name || String(a.id),
                        section: 'Агент',
                        target: 'agents',
                    });
                });
            } catch {
                /* ignore */
            }
            try {
                const sessions = sessionManager.getDebateHistory?.() ?? [];
                sessions.slice(0, 8).forEach((s) => {
                    out.push({
                        id: `sess:${s.id}`,
                        label: String(s.topic || '').slice(0, 50),
                        section: 'Дебат-сессия',
                        target: 'debate-history',
                    });
                });
            } catch {
                /* ignore */
            }
            try {
                const crystals = ((await crystalVault.list?.()) ?? []) as unknown as Array<
                    Record<string, unknown>
                >;
                crystals.slice(0, 8).forEach((c) => {
                    out.push({
                        id: `cr:${String(c.id)}`,
                        label: String(c.claim ?? c.text ?? c.title ?? '').slice(0, 50),
                        section: 'Кристалл',
                        target: 'crystal-vault',
                    });
                });
            } catch {
                /* ignore */
            }
            if (!cancelled) setDynamic(out);
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [open]);

    const panels = useMemo<PaletteItem[]>(
        () =>
            NAV_SECTIONS.flatMap((s) =>
                s.items.map((item) => ({
                    id: item.id,
                    label: t(item.labelKey),
                    section: t(s.labelKey),
                    target: item.id,
                })),
            ),
        [t],
    );

    const all = useMemo(() => [...panels, ...dynamic], [panels, dynamic]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const list = q
            ? all.filter(
                  (it) => it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q),
              )
            : all;
        return list.slice(0, 14);
    }, [all, query]);

    useEffect(() => {
        setIdx(0);
    }, [query, open]);

    if (!open) return null;

    const handleSelect = (item: PaletteItem) => {
        navigate(`/${item.target}`);
        setOpen(false);
        setQuery('');
    };

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            const target = filtered[idx];
            if (target) handleSelect(target);
        } else if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '12vh',
            }}
            onClick={() => setOpen(false)}
        >
            <div
                style={{
                    width: 560,
                    maxWidth: '92vw',
                    background: 'var(--surface, #111827)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 14,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Поиск: панели, агенты, сессии, кристаллы… (Ctrl+K)"
                    style={{
                        width: '100%',
                        padding: '0.9rem 1rem',
                        fontSize: 15,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--slate-100)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                />
                <div style={{ maxHeight: 340, overflowY: 'auto', padding: '0.4rem' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '1rem', color: 'var(--slate-500)', fontSize: 13 }}>
                            Ничего не найдено
                        </div>
                    ) : (
                        filtered.map((it, i) => (
                            <div
                                key={it.id}
                                onClick={() => handleSelect(it)}
                                onMouseEnter={() => setIdx(i)}
                                style={{
                                    padding: '0.5rem 0.7rem',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    background: i === idx ? 'rgba(59,130,246,0.15)' : 'transparent',
                                    color: 'var(--slate-200)',
                                }}
                            >
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                    {it.section} · /{it.target}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
