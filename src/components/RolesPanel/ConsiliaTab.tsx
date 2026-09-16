import React from 'react';
import type { Consilium } from '../../kernel/contracts/unified-role';
import { card, chip, CONSULIA_COLORS } from './consortia-constants';

interface ConsiliaTabProps {
    consilia: Consilium[];
}

const ConsiliaTab: React.FC<ConsiliaTabProps> = ({ consilia }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 10,
        }}
    >
        {consilia.map((c) => (
            <div
                key={c.id}
                style={{
                    ...card,
                    borderLeft: `3px solid ${CONSULIA_COLORS[c.type] || '#64748b'}`,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            fontSize: '0.9rem',
                        }}
                    >
                        {c.name}
                    </div>
                    <span style={chip(CONSULIA_COLORS[c.type] || '#64748b')}>{c.type}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: 6 }}>
                    {c.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: 8 }}>
                    {c.roles.length} roles · {c.minParticipants}–{c.maxParticipants} participants
                </div>
            </div>
        ))}
    </div>
);

export default ConsiliaTab;
