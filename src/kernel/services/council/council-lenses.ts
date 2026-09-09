/**
 * Council lens + polarity library (Wave 2.1).
 *
 * Analytical lenses (Socrates, Feynman, Sun Tzu…) + polarity pairs
 * (optimist/skeptic, …). Pure data + prompt helpers — no dependencies,
 * so both CouncilService and (later) Debate prompt builders can reuse it.
 */

export interface CouncilLens {
    id: string;
    name: string;
    figure: string;
    prompt: string;
}

export interface CouncilPolarity {
    id: string;
    name: string;
    sides: string[];
    prompts: Record<string, string>;
}

export const COUNCIL_LENSES: CouncilLens[] = [
    {
        id: 'socrates',
        name: 'Socrates — Maieutics',
        figure: 'Socrates',
        prompt: 'Ask relentless clarifying questions. Expose hidden assumptions and contradictions before asserting anything.',
    },
    {
        id: 'feynman',
        name: 'Feynman — First Principles',
        figure: 'Richard Feynman',
        prompt: 'Explain as if to a curious 12-year-old. Reduce to first principles, use plain language and concrete examples.',
    },
    {
        id: 'sun-tzu',
        name: 'Sun Tzu — Strategy',
        figure: 'Sun Tzu',
        prompt: 'Think in positions, terrain and timing. Where is leverage? What is the cost of engagement vs patience?',
    },
    {
        id: 'popper',
        name: 'Popper — Falsification',
        figure: 'Karl Popper',
        prompt: 'Seek the observation that would prove the claim wrong. Unfalsifiable claims score zero.',
    },
    {
        id: 'kahneman',
        name: 'Kahneman — Biases',
        figure: 'Daniel Kahneman',
        prompt: 'Hunt for cognitive biases: anchoring, availability, confirmation, overconfidence. Name the bias explicitly.',
    },
    {
        id: 'steelman',
        name: 'Steelman — Strongest Opponent',
        figure: 'Steelman technique',
        prompt: 'First restate the opposing view in its strongest possible form, then attack that — never a strawman.',
    },
    {
        id: 'devil',
        name: "Devil's Advocate",
        figure: 'Advocatus Diaboli',
        prompt: 'Oppose the emerging consensus. Find the strongest counter-case even if you privately agree.',
    },
    {
        id: 'systems',
        name: 'Systems Thinker',
        figure: 'Donella Meadows',
        prompt: 'Map feedback loops, stocks and flows. What second-order effects and perverse incentives appear?',
    },
    {
        id: 'empiricist',
        name: 'Empiricist',
        figure: 'Evidence-first',
        prompt: 'Demand data and sources for every key claim. Separate verified facts from plausible stories.',
    },
    {
        id: 'historian',
        name: 'Historian',
        figure: 'Long view',
        prompt: 'Find historical precedents and base rates. What happened last time someone tried this?',
    },
    {
        id: 'premortem',
        name: 'Premortem',
        figure: 'Gary Klein',
        prompt: 'Assume the plan already failed spectacularly. Work backwards: what went wrong, and what warning signs were missed?',
    },
    {
        id: 'redteam-lead',
        name: 'Red-Team Lead',
        figure: 'Adversarial review',
        prompt: 'Attack the proposal like a hostile reviewer. Rank vulnerabilities by exploitability and impact.',
    },
    {
        id: 'scout',
        name: 'Scout Mindset',
        figure: 'Julia Galef',
        prompt: 'Update beliefs proportionally to evidence. State your confidence explicitly and what would change it.',
    },
    {
        id: 'base-rates',
        name: 'Base Rates',
        figure: 'Reference class',
        prompt: 'Ignore the vivid details first. What is the base rate for this class of outcomes? Adjust from there, not from zero.',
    },
];

export const COUNCIL_POLARITIES: CouncilPolarity[] = [
    {
        id: 'optimist-skeptic',
        name: 'Optimist / Skeptic',
        sides: ['optimist', 'skeptic'],
        prompts: {
            optimist: 'Argue the upside case: why this works, best plausible outcome, opportunities others miss.',
            skeptic: 'Argue the downside case: why this fails, hidden costs, failure modes, base rates of failure.',
        },
    },
    {
        id: 'builder-critic',
        name: 'Builder / Critic',
        sides: ['builder', 'critic'],
        prompts: {
            builder: 'Propose concrete construction: steps, resources, timeline. Make it buildable.',
            critic: 'Stress-test the construction: weakest link, missing resources, unrealistic assumptions.',
        },
    },
    {
        id: 'visionary-accountant',
        name: 'Visionary / Accountant',
        sides: ['visionary', 'accountant'],
        prompts: {
            visionary: 'Paint the 10x future if this succeeds. What becomes possible?',
            accountant: 'Count the cost: budget, time, attention, opportunity cost. Is it worth it?',
        },
    },
    {
        id: 'tradition-disruption',
        name: 'Tradition / Disruption',
        sides: ['tradition', 'disruption'],
        prompts: {
            tradition: 'Defend the proven path: what works today and must not be broken?',
            disruption: 'Attack the status quo: what is ripe for reinvention and why now?',
        },
    },
];

export function getCouncilLens(id: string | undefined): CouncilLens | undefined {
    if (!id) return undefined;
    return COUNCIL_LENSES.find((l) => l.id === id);
}

export function getPolarityPrompt(polarityId: string | undefined, side: string | undefined): string | undefined {
    if (!polarityId || !side) return undefined;
    const p = COUNCIL_POLARITIES.find((x) => x.id === polarityId);
    return p?.prompts[side];
}

export function buildParticipantPrompt(input: {
    name: string;
    kind: string;
    lensId?: string;
    polarityId?: string;
}): string {
    const parts: string[] = [];
    const lens = getCouncilLens(input.lensId);
    if (lens) parts.push(`[Lens: ${lens.name}] ${lens.prompt}`);
    if (input.polarityId) {
        const pol = COUNCIL_POLARITIES.find((x) => x.id === input.polarityId);
        if (pol) parts.push(`[Polarity: ${pol.name}] sides: ${pol.sides.join(' vs ')}.`);
    }
    parts.push(`[Role: ${input.kind}] You are ${input.name}. Stay in character and argue your side with evidence.`);
    return parts.join('\n');
}
