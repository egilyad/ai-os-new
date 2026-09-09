import React from 'react';
import type { UnifiedRoleEntry } from '../../kernel/contracts/unified-role';
import { card, chip, CATEGORY_COLORS } from './consortia-constants';

interface RolesTabProps {
    roles: UnifiedRoleEntry[];
}

const RolesTab: React.FC<RolesTabProps> = ({ roles }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
        }}
    >
        {roles.map((r) => (
            <div
                key={r.id}
                style={{
                    ...card,
                    borderTop: `3px solid ${CATEGORY_COLORS[r.category] || '#64748b'}`,
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
                        {r.name}
                    </div>
                    <span style={chip(CATEGORY_COLORS[r.category] || '#64748b')}>{r.category}</span>
                </div>
                <div
                    style={{
                        fontSize: '0.78rem',
                        color: 'var(--slate-400)',
                        marginTop: 6,
                        lineHeight: 1.4,
                    }}
                >
                    {r.description}
                </div>
                {r.metadata.tags.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 4,
                            flexWrap: 'wrap',
                            marginTop: 8,
                        }}
                    >
                        {r.metadata.tags.slice(0, 4).map((tag: string) => (
                            <span key={tag} style={{ ...chip('#64748b'), fontSize: '0.65rem' }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        ))}
    </div>
);

export default RolesTab;
