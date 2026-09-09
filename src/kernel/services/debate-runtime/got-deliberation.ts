import type {
    IGoTDeliberation,
    GoTResult,
    GoTBranch,
    GoTBranchType,
} from '../../contracts/debate-got';

const BRANCH_TYPES: GoTBranchType[] = [
    'deductive',
    'inductive',
    'abductive',
    'analogical',
    'consequentialist',
];

const BRANCH_PROMPTS: Record<GoTBranchType, string> = {
    deductive:
        'Reason from general principles to specific conclusion. Start with a universally accepted premise and derive implications.',
    inductive:
        'Reason from specific observations to general patterns. Collect evidence points and infer a broader rule.',
    abductive:
        'Reason from observed effects to the most likely cause. What hidden mechanism best explains the available evidence?',
    analogical:
        'Reason by mapping structure from a known domain to this one. Find a parallel situation with known outcomes.',
    consequentialist:
        'Reason forward from actions to consequences. Trace the chain of outcomes each position would produce.',
};

export class GoTDeliberation implements IGoTDeliberation {
    async deliberate(
        topic: string,
        perspective: string,
        opposingClaims: string[],
    ): Promise<GoTResult | null> {
        const selected = this.selectBranchTypes(topic, perspective);
        const branches: GoTBranch[] = selected.map((type) =>
            this.synthesizeBranch(type, topic, perspective, opposingClaims),
        );
        const best = this.selectBestBranch(branches);
        const diversityScore = this.computeDiversity(branches);

        return {
            branches,
            selectedType: best.type,
            synthesis: best.conclusion,
            diversityScore,
        };
    }

    private selectBranchTypes(_topic: string, _perspective: string): GoTBranchType[] {
        const available = [...BRANCH_TYPES];
        const selected: GoTBranchType[] = [];
        const seed = _topic.length + _perspective.length;
        for (let i = 0; i < 3 && available.length > 0; i++) {
            const idx = (seed + i * 7) % available.length;
            selected.push(available[idx]!);
            available.splice(idx, 1);
        }
        return selected;
    }

    private synthesizeBranch(
        type: GoTBranchType,
        topic: string,
        perspective: string,
        opposingClaims: string[],
    ): GoTBranch {
        const premise = this.inferPremise(type, topic, perspective);
        const reasoning = this.buildReasoning(type, premise, opposingClaims);
        const conclusion = this.buildConclusion(type, reasoning, perspective);
        const confidence = this.computeConfidence(type, reasoning);
        const novelty = this.computeNovelty(type, topic);

        return { type, premise, reasoning, conclusion, confidence, novelty };
    }

    private inferPremise(type: GoTBranchType, topic: string, perspective: string): string {
        const hash = (topic + perspective + type).length % 7;
        const premises: Record<string, string[]> = {
            deductive: [
                'All systems optimize for efficiency under constraints.',
                'Every policy choice creates winners and losers.',
                'Complex systems resist top-down control.',
            ],
            inductive: [
                'Observed patterns in similar domains suggest a recurring principle.',
                'Historical precedents across multiple cases indicate a general trend.',
                'Evidence from diverse sources converges on a common mechanism.',
            ],
            abductive: [
                'The observed effects require a causal explanation not yet considered.',
                'Multiple symptoms point to an underlying structural cause.',
                'The simplest explanation that accounts for all evidence is most likely.',
            ],
            analogical: [
                'This situation mirrors known cases with well-documented outcomes.',
                'Structural parallels exist between this domain and more studied fields.',
                'The dynamics at play resemble those in classic cases of systemic change.',
            ],
            consequentialist: [
                'Short-term gains often produce long-term systemic costs.',
                'First-order effects differ dramatically from higher-order consequences.',
                'Unintended consequences regularly overwhelm intended outcomes.',
            ],
        };
        const list = premises[type]! || premises.deductive!;
        return list![hash % list!.length]!;
    }

    private buildReasoning(type: GoTBranchType, premise: string, opposingClaims: string[]): string {
        const counter =
            opposingClaims.length > 0
                ? `This counters the view that "${opposingClaims[0]!.slice(0, 80)}" by showing that ${premise.toLowerCase()}`
                : premise;
        return `${BRANCH_PROMPTS[type]} ${counter}. Therefore: ${premise}`;
    }

    private buildConclusion(type: GoTBranchType, reasoning: string, perspective: string): string {
        const angle = perspective.length > 0 ? `From the perspective of ${perspective}, ` : '';
        const phrases: Record<string, string> = {
            deductive: `${angle}the logical conclusion follows necessarily from first principles.`,
            inductive: `${angle}the weight of evidence supports a general principle.`,
            abductive: `${angle}the hidden mechanism most consistent with all observations is...`,
            analogical: `${angle}by structural mapping from parallel domains, the expected outcome is...`,
            consequentialist: `${angle}tracing the chain of consequences reveals that...`,
        };
        return `${phrases[type] || phrases.deductive} ${reasoning.slice(0, 100)}...`;
    }

    private computeConfidence(type: GoTBranchType, _reasoning: string): number {
        const base: Record<GoTBranchType, number> = {
            deductive: 0.85,
            inductive: 0.65,
            abductive: 0.55,
            analogical: 0.6,
            consequentialist: 0.7,
        };
        return base[type] || 0.6;
    }

    private computeNovelty(type: GoTBranchType, _topic: string): number {
        const base: Record<GoTBranchType, number> = {
            deductive: 0.4,
            inductive: 0.6,
            abductive: 0.8,
            analogical: 0.7,
            consequentialist: 0.5,
        };
        return base[type] || 0.5;
    }

    private selectBestBranch(branches: GoTBranch[]): GoTBranch {
        return branches.reduce((best, b) =>
            b.confidence * 0.4 + b.novelty * 0.6 > best.confidence * 0.4 + best.novelty * 0.6
                ? b
                : best,
        );
    }

    private computeDiversity(branches: GoTBranch[]): number {
        const types = new Set(branches.map((b) => b.type));
        return types.size / BRANCH_TYPES.length;
    }
}
