import type {
    IConceptBlender,
    DeadlockSignal,
    BlendResult,
    BlendedConcept,
} from '../../contracts/debate-blending';

const STALEMATE_TRIGGERS = [
    /\b(you.?re ignoring|missing the point|not addressing|straw.?man)\b/i,
    /\b(as I already said|I already explained|repeating myself)\b/i,
    /\b(fundamentally|completely|entirely) (different|wrong|incorrect)\b/i,
    /\b(circular|tautology|begging the question)\b/i,
    /\b(irreconcilable|incommensurable|apples.?and.?oranges)\b/i,
];

const CONCEPT_PAIRS: Array<[string, string, string, string]> = [
    [
        'Efficiency',
        'Equity',
        'Regenerative Equilibrium',
        'A dynamic balance where optimization serves fairness through feedback loops that penalize extreme inequality',
    ],
    [
        'Freedom',
        'Security',
        'Responsible Autonomy',
        'Structured liberty where security constraints are transparent, minimal, and democratically audited',
    ],
    [
        'Centralization',
        'Decentralization',
        'Federated Coordination',
        'Hierarchical decision-making with local autonomy, where authority flows to the lowest capable level',
    ],
    [
        'Competition',
        'Cooperation',
        'Co-opetition',
        'Structured collaboration where entities compete within agreed rules and cooperate on shared infrastructure',
    ],
    [
        'Tradition',
        'Innovation',
        'Rooted Evolution',
        'Change that preserves valuable patterns while upgrading mechanisms, like biological descent with modification',
    ],
    [
        'Individual Rights',
        'Collective Good',
        'Reciprocal Liberties',
        'Rights balanced by responsibilities, where individual freedom ends where collective harm begins',
    ],
    [
        'Growth',
        'Sustainability',
        'Regenerative Development',
        'Development that enhances rather than depletes natural and social capital across generations',
    ],
    [
        'Privacy',
        'Transparency',
        'Selective Disclosure',
        'Information sharing governed by consent and purpose-limitation, with strong default privacy protections',
    ],
    [
        'Stability',
        'Change',
        'Antifragile Adaptation',
        'Systems designed to strengthen under stress, using disruption as a signal for improvement rather than a threat',
    ],
    [
        'Local',
        'Global',
        'Glocal Integration',
        'Globally coordinated frameworks that respect local context and implementation autonomy',
    ],
];

export class ConceptBlender implements IConceptBlender {
    detectDeadlock(
        _agentId: string,
        _agentName: string,
        previousArguments: ReadonlyArray<{ agentId: string; content: string; round: number }>,
        currentRound: number,
    ): DeadlockSignal | null {
        if (previousArguments.length < 6) return null;

        const recentArgs = previousArguments.slice(-6);
        let triggerHits = 0;

        for (const arg of recentArgs) {
            for (const trigger of STALEMATE_TRIGGERS) {
                if (trigger.test(arg.content)) {
                    triggerHits++;
                    break;
                }
            }
        }

        const intensity = triggerHits / recentArgs.length;

        if (intensity < 0.3) return null;

        const clashingConcepts = this.findClashingConcepts(recentArgs);

        return {
            present: true,
            intensity: Math.min(1, intensity),
            stalemateRounds: Math.max(1, currentRound - 3),
            clashingConcepts: clashingConcepts ?? ['Certainty', 'Uncertainty'],
        };
    }

    generateBlend(deadlock: DeadlockSignal, _topic: string, _language?: string): BlendResult {
        const blends: BlendedConcept[] = [];
        const [conceptA, conceptB] = deadlock.clashingConcepts;

        const candidates = CONCEPT_PAIRS.filter(
            ([a, b]) =>
                conceptA.toLowerCase().includes(a.toLowerCase()) ||
                conceptB.toLowerCase().includes(b.toLowerCase()) ||
                a.toLowerCase().includes(conceptA.toLowerCase()) ||
                b.toLowerCase().includes(conceptB.toLowerCase()),
        );

        const selected = candidates.length > 0 ? candidates.slice(0, 2) : [CONCEPT_PAIRS[0]!];

        for (const [parentA, parentB, name, synthesis] of selected) {
            blends.push({
                name,
                parentA,
                parentB,
                synthesis,
                novelInsight: `Combining ${parentA} with ${parentB} reveals that the apparent contradiction resolves when we adopt a ${name} framework`,
                resolutionPath: `Rather than choosing between ${parentA.toLowerCase()} and ${parentB.toLowerCase()}, we should pursue ${name.toLowerCase()} — ${synthesis.toLowerCase()}`,
            });
        }

        return {
            deadlock,
            blends,
            bestBlendText:
                blends.length > 0
                    ? `Rather than persisting in the ${conceptA.toLowerCase()} vs ${conceptB.toLowerCase()} dichotomy, consider: "${blends[0]!.name}" — ${blends[0]!.synthesis}`
                    : '',
        };
    }

    private findClashingConcepts(
        args: ReadonlyArray<{ content: string }>,
    ): [string, string] | null {
        const conceptHits = new Map<string, number>();
        for (const [a, b] of CONCEPT_PAIRS) {
            let count = 0;
            for (const arg of args) {
                if (arg.content.includes(a) || arg.content.includes(b)) count++;
            }
            if (count > 0) conceptHits.set(`${a}|${b}`, count);
        }
        if (conceptHits.size === 0) return null;
        let best: [string, string] | null = null;
        let bestCount = 0;
        for (const [key, count] of conceptHits) {
            if (count > bestCount) {
                bestCount = count;
                const [a, b] = key.split('|');
                best = [a!, b!];
            }
        }
        return best;
    }
}
