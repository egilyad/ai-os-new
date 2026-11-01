import React, { useState } from 'react';
import { useProvenance } from '../../hooks/useProvenance';
import type { ProvenanceRef } from '../../kernel/contracts/provenance-link';

/**
 * ProvenancePath — визуализация когнитивной цепочки происхождения.
 *
 * Показывает достижимые сущности (debate→memory→crystal→synthesis) от
 * выбранной стартовой ссылки.
 */
const KIND_LABEL: Record<string, string> = {
    debate: 'Фбаты',
    memory: 'Память',
    crystal: 'Кристалл',
    synthesis: 'Синтез',
    knowledge: 'Знание',
    agent: 'Агент',
};

const ProvenancePath: React.FC<{ start?: ProvenanceRef }> = ({ start }) => {
    const { trail, trace, links } = useProvenance();
    const [kind, setKind] = useState(start?.kind ?? 'debate');
    const [id, setId] = useState(start?.id ?? '');
    const [depth, setDepth] = useState(5);

    const runTrace = () => {
        if (!id.trim()) return;
        trace({ kind, id: id.trim() }, depth);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px' }}
                >
                    {Object.keys(KIND_LABEL).map((k) => (
                        <option key={k} value={k}>{KIND_LABEL[k]}</option>
                    ))}
                </select>
                <input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="id"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px' }}
                />
                <input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    min={1}
                    max={10}
                    style={{ width: 60, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px' }}
                />
                <button onClick={runTrace} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '4px 14px', color: '#fff', cursor: 'pointer' }}>
                    Trace
                </button>
            </div>

            {trail.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {trail.map((r, i) => (
                        <div key={`${r.kind}:${r.id}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ width: 14, color: 'var(--text-muted)' }}>{i + 1}</span>
                            <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>
                                {KIND_LABEL[r.kind] ?? r.kind}
                            </span>
                            <span style={{ color: 'var(--slate-400)', fontFamily: 'monospace' }}>{r.id}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)' }}>
                    No trail yet. Total links: {links.length}
                </div>
            )}
        </div>
    );
};

export default ProvenancePath;
