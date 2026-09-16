// ── On-Demand Expert Witness Summoner (P1.14) ─────────────────────────
// Allows agents to call upon a domain expert for 1-2 turns when
// specialized knowledge is needed. Expert testimony is injected
// as a prompt block — no actual agent spawning required.

export interface ExpertWitness {
    id: string;
    domain: string;
    title: string;
    /** Short credibility statement for prompt insertion */
    credential: string;
    /** Key perspective / stance on common topics */
    perspective: string;
}

export interface ExpertTestimony {
    expertId: string;
    summary: string;
}

export interface IExpertWitnessService {
    /** Find the best expert match for a given topic or query */
    findExpert(topic: string, query?: string): ExpertWitness | undefined;

    /** Generate expert testimony text to inject into a prompt */
    generateTestimony(expert: ExpertWitness, topic: string, language?: string): string;

    /** Track summoned experts to prevent repeat */
    markSummoned(expertId: string): void;

    /** Check if an expert was already summoned in this session */
    wasSummoned(expertId: string): boolean;

    /** Clear all tracking */
    clearSession(): void;
}
