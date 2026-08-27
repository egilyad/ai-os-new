// ── Dynamic Persona Selection (P2.1) ──────────────────────────────
// Matches agent persona to debate topic for thematic relevance.

export interface PersonaVariant {
    id: string;
    name: string;
    description: string;
    promptInjection: string;
    /** Keywords that trigger this persona */
    triggerKeywords: string[];
    /** Roles this variant is suitable for */
    suitableRoles: Array<'pro' | 'con' | 'neutral'>;
    minRound: number;
}

export interface IPersonaSelector {
    selectForTopic(
        agentId: string,
        agentRole: string,
        topic: string,
        round: number,
        usedVariants: string[],
        language: string,
    ): string | undefined;
}
