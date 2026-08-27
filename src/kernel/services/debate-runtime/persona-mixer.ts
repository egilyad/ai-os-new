// ── Adaptive Persona Mixer (P1.9) ──────────────────────────────────────
// Heuristic persona variation without embeddings:
//   - Extracts traits from base persona text
//   - Emphasises different trait subsets each round
//   - Optionally blends 1 trait from another participant
//   - Tracks used variations to prevent repetition

import type { IPersonaMixer, MixContext, PersonaMix } from '../../contracts/debate-persona-mixer';

const PERSONA_VARIATIONS = [
    { id: 'primary', desc: 'Emphasise your core expertise and strongest arguments.' },
    {
        id: 'skeptic',
        desc: 'Approach the topic with healthy skepticism — question assumptions before asserting.',
    },
    {
        id: 'synthesizer',
        desc: 'Focus on connecting this topic to broader patterns and adjacent fields.',
    },
    {
        id: 'pragmatist',
        desc: 'Emphasise practical implications, trade-offs, and real-world constraints.',
    },
    {
        id: 'visionary',
        desc: 'Take a forward-looking perspective — what could be possible if challenges are overcome?',
    },
    {
        id: 'critic',
        desc: 'Focus on weaknesses, edge cases, and scenarios where the dominant view breaks down.',
    },
    {
        id: 'historian',
        desc: 'Ground your argument in historical context and lessons from the past.',
    },
    {
        id: 'bridge_builder',
        desc: 'Look for common ground between opposing positions and propose synthesis.',
    },
];

function extractTraits(persona: string): string[] {
    const words = persona.toLowerCase().split(/\s+/);
    const traitSignals = [
        'expert',
        'specialist',
        'researcher',
        'analyst',
        'scientist',
        'engineer',
        'philosopher',
        'strategist',
        'practitioner',
        'consultant',
        'advisor',
        'critic',
        'advocate',
        'pioneer',
        'leader',
        'innovator',
        'investigator',
    ];
    return traitSignals.filter((t) => words.includes(t));
}

function deterministicIndex(key: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % max;
}

export class PersonaMixer implements IPersonaMixer {
    private usedKeys = new Map<string, Set<string>>();

    getMix(context: MixContext): PersonaMix {
        const { agentId, basePersona, round, otherParticipants, usedPersonaKeys } = context;
        const activeKeySet = this.usedKeys.get(agentId) ?? new Set<string>();
        usedPersonaKeys.forEach((k) => activeKeySet.add(k));

        const traits = extractTraits(basePersona);
        const traitLabel = traits.length > 0 ? traits.join(', ') : agentId;

        // Round 0 or 1: pure self-variation, no blending
        if (round <= 1) {
            const available = PERSONA_VARIATIONS.filter((v) => !activeKeySet.has(v.id));
            const pool = available.length > 0 ? available : PERSONA_VARIATIONS;
            const idx = deterministicIndex(`${agentId}-round-${round}`, pool.length);
            const chosen = pool[idx]!;
            activeKeySet.add(chosen.id);
            this.usedKeys.set(agentId, activeKeySet);
            return {
                variationKey: chosen.id,
                personaText: `[Persona Variation: ${chosen.desc} As ${traitLabel}, approach this round with that lens.]`,
            };
        }

        // Rounds 2+: blend in a random past participant's trait
        const others = otherParticipants.filter((o) => o.id !== agentId);
        let blendedFrom: string | undefined;
        let blendText = '';
        if (others.length > 0) {
            const srcIdx = deterministicIndex(`${agentId}-blend-${round}`, others.length);
            const source = others[srcIdx]!;
            const srcTraits = extractTraits(source.persona);
            if (srcTraits.length > 0) {
                blendedFrom = source.name;
                const srcTrait =
                    srcTraits[
                        deterministicIndex(`${agentId}-${source.id}-${round}`, srcTraits.length)
                    ];
                blendText = ` Borrow one perspective from ${source.name} (${srcTrait}) and integrate it with your own analysis.`;
            }
        }

        const available = PERSONA_VARIATIONS.filter((v) => !activeKeySet.has(v.id));
        const pool = available.length > 0 ? available : PERSONA_VARIATIONS;
        const idx = deterministicIndex(`${agentId}-round-${round}`, pool.length);
        const chosen = pool[idx]!;
        activeKeySet.add(chosen.id);
        this.usedKeys.set(agentId, activeKeySet);

        return {
            variationKey: chosen.id,
            personaText: `[Persona Variation: ${chosen.desc} As ${traitLabel}, apply this lens.${blendText}]`,
            blendedFrom,
        };
    }

    recordMix(agentId: string, _round: number, variationKey: string): void {
        const set = this.usedKeys.get(agentId) ?? new Set();
        set.add(variationKey);
        this.usedKeys.set(agentId, set);
    }

    clearSession(): void {
        this.usedKeys.clear();
    }
}
