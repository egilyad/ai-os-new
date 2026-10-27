import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_SECTIONS } from '../../route-registry';
import { useTranslation } from '../../i18n/useTranslation';

const CommandPalette: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [idx, setIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const items = useMemo(
        () =>
            NAV_SECTIONS.flatMap((s) =>
                s.items.map((item) => ({
                    id: item.id,
                    label: t(item.labelKey),
                    section: t(s.labelKey),
                })),
            ),
        [t],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items.slice(0, 12);
        return items
            .filter((it) => it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q))
            .slice(0, 12);
    }, [items, query]);

    useEffect(() => {
        setIdx(0);
    }, [query, open]);

    if (!open) return null;

    const handleSelect = (id: string) => {
        navigate(`/${id}`);
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
            if (target) handleSelect(target.id);
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
                    placeholder="Поиск по панелям… (Ctrl+K)"
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
                                onClick={() => handleSelect(it.id)}
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
                                    {it.section} · /{it.id}
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
