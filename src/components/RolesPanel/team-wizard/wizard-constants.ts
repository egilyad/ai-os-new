import type { RoleTeam, TeamDomain } from '../../../kernel/contracts/role-team';

export const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transition: 'all 0.15s',
};

export const chip = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: '0.7rem',
    fontWeight: 600,
    background: `${color}20`,
    color,
    border: `1px solid ${color}40`,
});

export const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
};

export const TEAM_DOMAINS: TeamDomain[] = [
    'medical',
    'scientific',
    'technical',
    'legal',
    'business',
    'creative',
    'educational',
    'crisis',
    'ethical',
    'financial',
    'investigation',
    'editorial',
    'research',
    'custom',
];

export const DOMAIN_DESCRIPTIONS: Record<TeamDomain, string> = {
    medical: 'Diagnosis, treatment plans, medical ethics',
    scientific: 'Research, experiments, peer review',
    technical: 'Engineering, development, architecture',
    legal: 'Litigation, contracts, compliance',
    business: 'Strategy, product, marketing, operations',
    creative: 'Design, writing, content, art direction',
    educational: 'Curriculum, tutoring, assessment',
    crisis: 'Emergency response, containment, recovery',
    ethical: 'AI ethics, bioethics, policy',
    financial: 'Analysis, investment, budgeting',
    investigation: 'Forensics, audit, due diligence',
    editorial: 'Writing, editing, publishing',
    research: 'Literature review, data analysis',
    custom: 'Build your own from scratch',
};

export interface TeamState {
    team: Partial<RoleTeam>;
    setTeam: React.Dispatch<React.SetStateAction<Partial<RoleTeam>>>;
}
