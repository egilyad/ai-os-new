import React from 'react';
import { TEAM_DOMAIN_ICONS } from '../../../kernel/contracts/role-team';
import type { TeamDomain } from '../../../kernel/contracts/role-team';
import { TEAM_DOMAINS, DOMAIN_DESCRIPTIONS, card } from './wizard-constants';
import type { TeamState } from './wizard-constants';

interface DomainPickerProps extends TeamState {
    selectedDomain: TeamDomain | null;
    onSelectDomain: (domain: TeamDomain) => void;
}

const DomainPicker: React.FC<DomainPickerProps> = ({ selectedDomain, onSelectDomain, setTeam }) => (
    <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 12 }}>
            Choose your team's domain to filter relevant templates. You can also start from scratch.
        </div>
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 8,
            }}
        >
            {TEAM_DOMAINS.map((domain) => (
                <div
                    key={domain}
                    onClick={() => {
                        onSelectDomain(domain);
                        setTeam((prev) => ({
                            ...prev,
                            metadata: { ...prev.metadata!, domain },
                        }));
                    }}
                    style={{
                        ...card,
                        border:
                            selectedDomain === domain
                                ? '2px solid #3b82f6'
                                : '1px solid rgba(255,255,255,0.08)',
                        transform: selectedDomain === domain ? 'scale(1.02)' : 'scale(1)',
                        textAlign: 'center',
                        padding: 16,
                    }}
                    onMouseEnter={(e) => {
                        if (selectedDomain !== domain)
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        if (selectedDomain !== domain)
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: 6 }}>
                        {TEAM_DOMAIN_ICONS[domain]}
                    </div>
                    <div
                        style={{
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            textTransform: 'capitalize',
                        }}
                    >
                        {domain}
                    </div>
                    <div
                        style={{
                            fontSize: '0.65rem',
                            color: 'var(--slate-500)',
                            marginTop: 4,
                            lineHeight: 1.3,
                        }}
                    >
                        {DOMAIN_DESCRIPTIONS[domain]}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default DomainPicker;
