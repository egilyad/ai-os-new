import React, { useState } from 'react';
import { Search, FlaskConical } from 'lucide-react';
import { RIVALS_CATALOG } from '../data/rivals-catalog';

// Static catalog of all rivals* parity services (menu cleanup).
// No runtime deps — pure data render.
const RivalsCatalogPanel: React.FC = () => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState<Record<string, boolean>>({ rivals: true });
    const q = query.trim().toLowerCase();

    const total = RIVALS_CATALOG.reduce((n, g) => n + g.services.length, 0);

    return (
        <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <FlaskConical size={26} color="#a855f7" aria-hidden="true" />
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                        Rivals Projects
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {RIVALS_CATALOG.length} projects · {total} services — parity imports, one line each
                    </p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-500)' }} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search services..."
                        aria-label="Search rivals services"
                        style={{ padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--slate-200)', fontSize: '0.85rem', outline: 'none', width: 240 }}
                    />
                </div>
            </div>

            {RIVALS_CATALOG.map((g) => {
                const items = q
                    ? g.services.filter(
                          (s) =>
                              s.name.toLowerCase().includes(q) ||
                              s.description.toLowerCase().includes(q),
                      )
                    : g.services;
                if (q && items.length === 0) return null;
                const isOpen = q ? true : (open[g.id] ?? false);
                return (
                    <div key={g.id} className="glass-panel" style={{ marginBottom: '0.75rem', overflow: 'hidden' }}>
                        <button
                            onClick={() => setOpen((p) => ({ ...p, [g.id]: !(p[g.id] ?? false) }))}
                            aria-expanded={isOpen}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.8rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate-100)', textAlign: 'left' }}
                        >
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', flex: 1 }}>
                                {g.title}{' '}
                                <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    · {items.length} services
                                </span>
                            </span>
                        </button>
                        {isOpen && (
                            <div style={{ padding: '0 1rem 0.5rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    Origin: {g.origin}
                                </div>
                                {items.map((s) => (
                                    <div
                                        key={s.name}
                                        style={{ display: 'flex', gap: 10, padding: '0.4rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem' }}
                                    >
                                        <code style={{ minWidth: 220, color: '#93c5fd', fontSize: '0.75rem' }}>{s.name}</code>
                                        <span style={{ color: 'var(--slate-300)' }}>{s.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RivalsCatalogPanel;
