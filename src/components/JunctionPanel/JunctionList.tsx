import React, { useState } from 'react';
import type { Junction } from '../../kernel/types/junction-types';
import JunctionCard from './JunctionCard';
import JunctionGraph from './JunctionGraph';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
    junctions: Junction[];
    onChallenge: (junctionId: string, argument: string) => void;
}

const STATUS_FILTERS = ['all', 'pending', 'validated', 'rejected'] as const;

/**
 * JunctionList — junction candidates grouped by lifecycle status with an
 * inline graph preview for the selected junction.
 */
const JunctionList: React.FC<Props> = ({ junctions, onChallenge }) => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const filtered = junctions.filter((j) => (filter === 'all' ? true : j.status === filter));
    const selected = junctions.find((j) => j.id === selectedId) ?? null;

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {/* Status filters */}
                <div style={{ display: 'flex', gap: 5, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: filter === s ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
                                color: filter === s ? '#fff' : '#94a3b8',
                            }}
                        >
                            {t(`junction.filter.${s}`)}
                            <span style={{ opacity: 0.7, marginLeft: 4 }}>
                                {
                                    junctions.filter((j) => (s === 'all' ? true : j.status === s))
                                        .length
                                }
                            </span>
                        </button>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div
                        style={{
                            color: 'var(--slate-500)',
                            fontSize: '0.78rem',
                            textAlign: 'center',
                            padding: '2rem 0',
                        }}
                    >
                        {t('junction.empty')}
                    </div>
                )}

                {filtered.map((j) => (
                    <div
                        key={j.id}
                        onClick={() => setSelectedId(selectedId === j.id ? null : j.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <JunctionCard junction={j} />
                        {j.status === 'pending' && (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 6,
                                    margin: '-0.2rem 0 0.7rem 1rem',
                                }}
                            >
                                <input
                                    value={drafts[j.id] ?? ''}
                                    onChange={(e) =>
                                        setDrafts((d) => ({ ...d, [j.id]: e.target.value }))
                                    }
                                    placeholder={t('junction.counterargument_placeholder')}
                                    style={{
                                        flex: 1,
                                        padding: '0.35rem 0.6rem',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.72rem',
                                    }}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const arg = (drafts[j.id] ?? '').trim();
                                        if (!arg) return;
                                        onChallenge(j.id, arg);
                                        setDrafts((d) => ({ ...d, [j.id]: '' }));
                                    }}
                                    style={{
                                        padding: '0.35rem 0.8rem',
                                        borderRadius: 6,
                                        border: 'none',
                                        background: 'var(--success)',
                                        color: '#022c22',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                    }}
                                >
                                    {t('junction.verify')}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Graph preview */}
            <div
                style={{
                    width: 340,
                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                    padding: '0.75rem 1rem',
                    overflowY: 'auto',
                }}
            >
                <div
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'var(--slate-500)',
                        marginBottom: '0.5rem',
                    }}
                >
                    {t('junction.bridge')}
                </div>
                {selected ? (
                    <>
                        <JunctionGraph junction={selected} />
                        <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                            {selected.rationale}
                        </div>
                    </>
                ) : (
                    <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                        {t('junction.bridge_hint')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JunctionList;
