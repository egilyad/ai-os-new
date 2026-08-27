import React from 'react';
import type { GroupTemplate } from '../../kernel/contracts/unified-role';
import { card, chip, CATEGORY_COLORS } from './consortia-constants';

interface TemplatesTabProps {
    templates: GroupTemplate[];
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ templates }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 10,
        }}
    >
        {templates.map((tpl) => (
            <div
                key={tpl.id}
                style={{
                    ...card,
                    borderTop: `3px solid ${CATEGORY_COLORS[tpl.category] || '#64748b'}`,
                }}
            >
                <div style={{ fontWeight: 600, color: 'var(--slate-200)', fontSize: '0.9rem' }}>
                    {tpl.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: 6 }}>
                    {tpl.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: 8 }}>
                    {tpl.roles.length} roles · {tpl.minSize}–{tpl.maxSize} people
                </div>
                {tpl.tags.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 4,
                            flexWrap: 'wrap',
                            marginTop: 6,
                        }}
                    >
                        {tpl.tags.map((tag: string) => (
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

export default TemplatesTab;
