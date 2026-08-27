import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { TeamDomain, TeamTemplate } from '../../../kernel/contracts/role-team';
import { TEAM_STRATEGY_LABELS } from '../../../kernel/contracts/role-team';
import { card, chip } from './wizard-constants';

interface TemplatePickerProps {
    templates: TeamTemplate[];
    selectedDomain: TeamDomain | null;
    onSelectTemplate: (tpl: TeamTemplate) => void;
    onSkipTemplate: () => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({
    templates,
    selectedDomain,
    onSelectTemplate,
    onSkipTemplate,
}) => {
    const filtered = useMemo(() => {
        if (!selectedDomain || selectedDomain === 'custom') return templates;
        return templates.filter((t) => t.domain === selectedDomain);
    }, [templates, selectedDomain]);

    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 12 }}>
                {selectedDomain && selectedDomain !== 'custom'
                    ? `Templates in ${selectedDomain} domain (${filtered.length}):`
                    : 'All templates — pick one to start:'}
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 8,
                }}
            >
                {filtered.slice(0, 20).map((tpl) => (
                    <div
                        key={tpl.id}
                        onClick={() => onSelectTemplate(tpl)}
                        style={{
                            ...card,
                            borderLeft: `3px solid ${tpl.color}`,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                    >
                        <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{tpl.icon}</div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-200)', fontSize: '0.85rem' }}>
                            {tpl.name}
                        </div>
                        <div
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                marginTop: 2,
                                lineHeight: 1.3,
                            }}
                        >
                            {tpl.description.slice(0, 70)}
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                            <span
                                style={{
                                    ...chip(tpl.color),
                                    fontSize: '0.6rem',
                                }}
                            >
                                {tpl.domain}
                            </span>
                            <span style={{ ...chip('#64748b'), fontSize: '0.6rem' }}>
                                {TEAM_STRATEGY_LABELS[tpl.defaultStrategy]}
                            </span>
                        </div>
                    </div>
                ))}
                <div
                    onClick={onSkipTemplate}
                    style={{
                        ...card,
                        border: '2px dashed rgba(255,255,255,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        minHeight: 120,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                >
                    <Plus size={24} color="#64748b" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                        Custom Team (no template)
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TemplatePicker;
