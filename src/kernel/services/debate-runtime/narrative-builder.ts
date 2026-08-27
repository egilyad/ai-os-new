import type {
    INarrativeBuilder,
    NarrativeArc,
    NarrativeArcType,
} from '../../contracts/debate-narrative';

const ARC_INSTRUCTIONS: Record<NarrativeArcType, string> = {
    setup_conflict_resolution:
        'Structure your argument as: SETUP (context + status quo) → CONFLICT (problem, tension, what is at stake) → RESOLUTION (your proposed solution with reasoning). This classic arc maximises persuasive impact.',
    hero_journey:
        'Frame your argument as a journey: start with the familiar world (status quo), introduce a challenge or call to action, describe the struggle (obstacles, opposition), and end with transformation — what changes and why it matters.',
    underdog_story:
        'Position your perspective as the underestimated view that defies conventional wisdom. Acknowledge the majority position briefly, then explain why it is incomplete or wrong. Build sympathy through concrete examples of overlooked evidence.',
    mystery_unraveling:
        'Present the debate topic as a puzzle. Start with a provocative question or paradox. Uncover evidence layer by layer. Each paragraph reveals a new piece. End with the full picture — your conclusion that resolves the mystery.',
    cautionary_tale:
        'Adopt the voice of a wise advisor. Describe a desirable outcome, then pivot to what could go wrong. Use vivid "what if" scenarios. Draw parallels to historical precedents. Your argument is a warning grounded in evidence.',
    visionary_forecast:
        'Paint a vivid picture of the future. Start with "Imagine a world where..." and describe the positive or negative outcome. Bridge from present trends to future consequences. Use concrete timelines and projections.',
    underdog_vs_goliath:
        'Cast yourself or your position as the underdog challenging a dominant but flawed orthodoxy. Identify the Goliath (prevailing assumption, powerful interest, status quo). Show why it is vulnerable. Your evidence is the slingshot.',
};

function pickArc(agentId: string, round: number, _totalRounds: number): NarrativeArc {
    const progress = Math.min(1, round / 8);
    let arc: NarrativeArcType;
    if (progress < 0.3) {
        const earlyArcs: NarrativeArcType[] = ['setup_conflict_resolution', 'mystery_unraveling'];
        const idx = (agentId.charCodeAt(0) + round) % earlyArcs.length;
        arc = earlyArcs[Math.abs(idx)]!;
    } else if (progress < 0.6) {
        const midArcs: NarrativeArcType[] = [
            'hero_journey',
            'underdog_story',
            'underdog_vs_goliath',
            'visionary_forecast',
        ];
        const idx = (agentId.charCodeAt(agentId.length - 1) + round * 7) % midArcs.length;
        arc = midArcs[Math.abs(idx)]!;
    } else {
        const lateArcs: NarrativeArcType[] = ['cautionary_tale', 'visionary_forecast'];
        const idx = (round * 13 + agentId.length) % lateArcs.length;
        arc = lateArcs[Math.abs(idx)]!;
    }
    return { arc, instruction: ARC_INSTRUCTIONS[arc] };
}

export class NarrativeBuilder implements INarrativeBuilder {
    selectArc(agentId: string, round: number, totalRounds: number): NarrativeArc {
        return pickArc(agentId, round, totalRounds);
    }
}
