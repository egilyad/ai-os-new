import { getPersonality, type ProviderPersonality } from './provider-personalities';

interface PersonalityBadgeProps {
    provider: string;
    compact?: boolean;
}

export const PersonalityBadge: React.FC<PersonalityBadgeProps> = ({ provider, compact }) => {
    const p: ProviderPersonality = getPersonality(provider);

    if (compact) {
        return (
            <span
                title={`${p.name}: ${p.description}`}
                style={{
                    fontSize: '0.75rem',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: p.bg,
                    color: p.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 600,
                }}
            >
                {p.icon} {p.name}
            </span>
        );
    }

    return (
        <span
            title={p.description}
            style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 6,
                background: p.bg,
                color: p.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600,
                border: `1px solid ${p.color}22`,
            }}
        >
            {p.icon} {p.name}
            <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 2 }}>{p.title}</span>
        </span>
    );
};

export { getPersonality };
export type { ProviderPersonality };
