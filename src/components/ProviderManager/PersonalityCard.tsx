import { getPersonality } from './provider-personalities';

interface PersonalityCardProps {
    provider: string;
    compact?: boolean;
    currentState?: string;
}

const stateEmoji: Record<string, string> = {
    active: '\uD83D\uDFE2',
    idle: '\uD83D\uDE34',
    limited: '\uD83D\uDFE1',
    broken: '\uD83D\uDD34',
    boost: '\u26A1',
    fallback: '\uD83D\uDD04',
    batch: '\uD83D\uDCCA',
    alert: '\uD83D\uDEA8',
    processing: '\uD83D\uDFE2',
    routing: '\uD83D\uDFE2',
    guarding: '\uD83D\uDFE2',
    creating: '\uD83D\uDFE2',
};

export function PersonalityCard({ provider, compact, currentState }: PersonalityCardProps) {
    const p = getPersonality(provider);
    const stateKey =
        currentState && p.states.find((s) => s.key === currentState)
            ? currentState
            : (p.states[0]?.key ?? 'active');
    const state = p.states.find((s) => s.key === stateKey);

    if (compact) {
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                    color: p.color,
                }}
            >
                <span>{p.icon}</span>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                {state && (
                    <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                        {state.emoji} {state.label}
                    </span>
                )}
            </span>
        );
    }

    return (
        <div
            style={{
                background: p.bg,
                border: `1px solid ${p.color}33`,
                borderRadius: 12,
                padding: 16,
                fontFamily: 'system-ui, sans-serif',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '2rem' }}>{p.icon}</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: p.color }}>
                        {p.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{p.archetype}</div>
                </div>
                <div
                    style={{
                        marginLeft: 'auto',
                        textAlign: 'right',
                        fontSize: '0.75rem',
                    }}
                >
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    <div style={{ opacity: 0.6 }}>{p.description}</div>
                </div>
            </div>

            {state && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                        padding: '6px 12px',
                        background: 'rgba(0,0,0,0.06)',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                    }}
                >
                    <span>{stateEmoji[stateKey] ?? '🟢'}</span>
                    <span style={{ fontWeight: 600 }}>{state.label}</span>
                    <span style={{ opacity: 0.6 }}>{state.description}</span>
                </div>
            )}

            <div
                style={{ fontSize: '0.9rem', fontStyle: 'italic', opacity: 0.8, marginBottom: 12 }}
            >
                "{p.catchphrase}"
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {['Tone', 'Pace', 'Formality', 'Warmth', 'Humor'].map((trait) => (
                    <div
                        key={trait}
                        style={{
                            padding: '2px 8px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                        }}
                    >
                        <span style={{ opacity: 0.6 }}>{trait}: </span>
                        <span style={{ fontWeight: 500 }}>
                            {trait === 'Tone'
                                ? p.tone
                                : trait === 'Pace'
                                  ? p.pace
                                  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    String((p as any)[trait.toLowerCase()] ?? '-')}
                        </span>
                    </div>
                ))}
            </div>

            <details style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                <summary style={{ cursor: 'pointer' }}>Voice lines</summary>
                <div style={{ marginTop: 8, lineHeight: 1.8 }}>
                    <div>
                        <strong>Greeting:</strong> {p.voiceLines.greeting}
                    </div>
                    <div>
                        <strong>Working:</strong> {p.voiceLines.working}
                    </div>
                    <div>
                        <strong>Done:</strong> {p.voiceLines.done}
                    </div>
                    <div>
                        <strong>Error:</strong> {p.voiceLines.error}
                    </div>
                    <div>
                        <strong>Idle:</strong> {p.voiceLines.idle}
                    </div>
                </div>
            </details>
        </div>
    );
}
