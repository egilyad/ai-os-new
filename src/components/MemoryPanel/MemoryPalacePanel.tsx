/**
 * Cognitive-aux / research panel (Experimental).
 * Memory palace visualization — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { PalaceState } from '../../kernel/services/memory/memory-palace';

const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const MemoryPalacePanel: React.FC = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<PalaceState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const m = await import('../../kernel/instances');
                const mod = m as {
                    memoryOrchestrator: { getPalaceState: () => Promise<PalaceState> };
                };
                const orch: { getPalaceState: () => Promise<PalaceState> } | undefined =
                    mod.memoryOrchestrator;
                if (orch) setState(await orch.getPalaceState());
                else setError(t('memory_palace.service_unavailable'));
            } catch {
                setError(t('memory_palace.load_error'));
            } finally {
                setLoading(false);
            }
        })();
    }, [t]);

    if (loading) {
        return (
            <div style={{ padding: 24, maxWidth: 900 }}>
                <div style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>{t('common.loading')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: 24, maxWidth: 900 }}>
                <div style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error}</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 900 }}>
            <h2
                style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-200)' }}
            >
                {t('memory_palace.title')}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                {t('memory_palace.subtitle')}
            </p>

            {state && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ ...card, flex: 1, borderLeft: '3px solid #3b82f6' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {t('memory_palace.total_entries')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {state.totalEntries.toLocaleString()}
                        </div>
                    </div>
                    <div style={{ ...card, flex: 1, borderLeft: '3px solid #10b981' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {t('memory_palace.memory_usage')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {(state.totalMemoryUsage / 1024).toFixed(1)} KB
                        </div>
                    </div>
                    <div style={{ ...card, flex: 1, borderLeft: '3px solid #a855f7' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {t('memory_palace.rooms')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {state.rooms.length}/7
                        </div>
                    </div>
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 12,
                }}
            >
                {state?.rooms.map((room) => (
                    <div key={room.id} style={{ ...card, borderTop: `3px solid ${room.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.2rem' }}>{room.icon}</span>
                            <div style={{ fontWeight: 600, color: 'var(--slate-200)', fontSize: '0.95rem' }}>
                                {room.name}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', lineHeight: 1.4 }}>
                            {room.description}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: room.color, fontWeight: 600 }}>
                            {room.entryCount} {t('memory_palace.entries')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemoryPalacePanel;
