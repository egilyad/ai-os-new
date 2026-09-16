import type {
    Claim,
    ReasoningStep,
    ReasoningChain,
    MemorySnapshot,
    MemoryRecord,
    IDebateMemory,
} from '../../contracts/debate-runtime';

const MAX_STEPS = 5000;
const MAX_CLAIMS = 1000;
const MAX_CHAINS_PER_AGENT = 100;
const MAX_STEPS_PER_CHAIN = 50;

const STOP_WORDS = new Set([
    'this',
    'that',
    'with',
    'from',
    'the',
    'and',
    'for',
    'are',
    'not',
    'but',
    'has',
    'its',
    'which',
    'will',
    'can',
    'have',
    'about',
    'than',
    'into',
    'also',
    'more',
    'some',
    'their',
    'other',
    'what',
    'when',
    'where',
    'how',
    'who',
    'very',
    'just',
    'than',
    'then',
    'это',
    'что',
    'как',
    'все',
    'который',
    'мочь',
    'быть',
    'также',
    'более',
    'когда',
    'очень',
    'только',
    'если',
    'нет',
    'да',
]);

export function extractStrongTopics(memory: DebateMemory, agentId: string): string[] {
    const agentSteps = memory.getAgentSteps(agentId);
    if (agentSteps.length < 3) return [];

    const wordFreq = new Map<string, number>();
    for (const step of agentSteps) {
        const words = step.content
            .toLowerCase()
            .split(/[^a-zа-яё]+/)
            .filter((w) => w.length > 4 && !STOP_WORDS.has(w));
        for (const w of words) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }
    return [...wordFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}

export function buildPersonaMemory(memory: DebateMemory, agentId: string): string {
    const winning = memory.getWinningStrategies().filter((c) => c.agentId === agentId);
    if (winning.length === 0) return '';

    const avgConfidence =
        winning.reduce((s, c) => {
            const stepConf =
                c.steps.reduce((ss, st) => ss + st.confidence, 0) / Math.max(1, c.steps.length);
            return s + stepConf;
        }, 0) / winning.length;

    const strongTopics = extractStrongTopics(memory, agentId);

    const lines: string[] = [];
    if (avgConfidence > 0)
        lines.push(`- Your historical average confidence: ${(avgConfidence * 100).toFixed(0)}%`);
    if (winning.length > 0)
        lines.push(
            `- You have ${winning.length} successful reasoning chain${winning.length > 1 ? 's' : ''} in past debates`,
        );
    if (strongTopics.length > 0)
        lines.push(`- Your strongest topics: ${strongTopics.slice(0, 3).join(', ')}`);

    return lines.length > 0
        ? `\n\n### Your Persona Memory (from past debates)\n${lines.join('\n')}`
        : '';
}

export class DebateMemory implements IDebateMemory {
    private claims: Claim[] = [];
    private steps: ReasoningStep[] = [];
    private chains = new Map<string, ReasoningChain[]>();

    recordStep(step: ReasoningStep): void {
        this.steps.push(step);
        if (this.steps.length > MAX_STEPS) this.steps = this.steps.slice(-MAX_STEPS);

        const existing = this.chains.get(step.agentId) || [];
        const lastChain = existing[existing.length - 1];
        if (lastChain && !lastChain.conclusion && lastChain.steps.length < MAX_STEPS_PER_CHAIN) {
            const newSteps = [...lastChain.steps, step];
            existing[existing.length - 1] = {
                ...lastChain,
                steps: newSteps,
                coherence: this.calculateCoherence(newSteps),
            };
        } else {
            existing.push({
                agentId: step.agentId,
                topic: '',
                steps: [step],
                coherence: 1.0,
            });
            if (existing.length > MAX_CHAINS_PER_AGENT) {
                this.chains.set(step.agentId, existing.slice(-MAX_CHAINS_PER_AGENT));
                return;
            }
        }
        this.chains.set(step.agentId, existing);
    }

    getAllSteps(): ReasoningStep[] {
        return [...this.steps];
    }

    getAgentSteps(agentId: string): ReasoningStep[] {
        return this.steps.filter((s) => s.agentId === agentId);
    }

    getRecentSteps(count: number): ReasoningStep[] {
        if (count <= 0) return [];
        if (count >= this.steps.length) return [...this.steps];
        return this.steps.slice(-count);
    }

    /**
     * Strip content from steps older than the last `keepCount`, freeing
     * LLM response strings for GC while preserving step structure (agentId,
     * type, confidence, timestamp) for metrics and chain calculations.
     * Call after each round completes to prevent unbounded memory growth
     * (observed: +300MB/round with 10 agents on 70B models).
     */
    trimContent(keepCount: number): void {
        if (keepCount <= 0 || this.steps.length <= keepCount) return;
        const keepFrom = this.steps.length - keepCount;
        for (let i = 0; i < keepFrom; i++) {
            this.steps[i] = { ...this.steps[i]!, content: '' };
        }
        for (const chainArr of this.chains.values()) {
            for (const chain of chainArr) {
                const trimLimit = Math.max(0, chain.steps.length - keepCount);
                for (let i = 0; i < trimLimit; i++) {
                    const s = chain.steps[i];
                    if (s?.content) {
                        chain.steps[i] = { ...s, content: '' } as ReasoningStep;
                    }
                }
            }
        }
    }

    recordClaim(claim: Claim): void {
        this.claims.push(claim);
        if (this.claims.length > MAX_CLAIMS) this.claims = this.claims.slice(-MAX_CLAIMS);
    }

    getChain(agentId: string): ReasoningChain[] {
        return [...(this.chains.get(agentId) || [])];
    }

    getClaimsForTopic(topic: string): Claim[] {
        return this.claims.filter((c) => c.text.toLowerCase().includes(topic.toLowerCase()));
    }

    getWinningStrategies(): ReasoningChain[] {
        const all: ReasoningChain[] = [];
        for (const chains of this.chains.values()) {
            all.push(...chains);
        }
        return all
            .filter((c) => c.coherence > 0.7 && !!c.conclusion)
            .sort((a, b) => b.coherence - a.coherence)
            .slice(0, 5);
    }

    snapshot(): MemorySnapshot {
        return {
            totalClaims: this.claims.length,
            totalChains: Array.from(this.chains.values()).reduce((s, c) => s + c.length, 0),
            topStrategies: this.getWinningStrategies().map((c) => c.agentId),
        };
    }

    toJSON(): MemoryRecord {
        const chains: ReasoningChain[] = [];
        for (const c of this.chains.values()) chains.push(...c);
        return { claims: this.claims, steps: this.steps, chains };
    }

    restoreFrom(data: MemoryRecord): void {
        this.claims = data.claims ?? [];
        this.steps = data.steps ?? [];
        this.chains.clear();
        for (const c of data.chains ?? []) {
            const existing = this.chains.get(c.agentId) ?? [];
            existing.push(c);
            this.chains.set(c.agentId, existing);
        }
    }

    destroy(): void {
        this.claims = [];
        this.steps = [];
        this.chains.clear();
    }

    private calculateCoherence(steps: ReasoningStep[]): number {
        if (steps.length < 2) return 1.0;
        let consistent = 0;
        for (let i = 1; i < steps.length; i++) {
            if (steps[i]!.confidence >= steps[i - 1]!.confidence * 0.5) consistent++;
        }
        return consistent / (steps.length - 1);
    }
}
