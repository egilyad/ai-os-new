// ── Adaptive Persona Mixer (P1.9) ──────────────────────────────────────
// Linear interpolation of persona traits + noise at each round to increase
// strategy diversity while maintaining character consistency.
// Persona fingerprint tracked across rounds for traceability.

export interface MixContext {
    agentId: string;
    agentName: string;
    basePersona: string;
    agentRole: string;
    round: number;
    otherParticipants: Array<{ id: string; name: string; role: string; persona: string }>;
    /** List of roles this agent has already used in previous rounds (for diversity) */
    usedPersonaKeys: string[];
}

export interface PersonaMix {
    variationKey: string;
    personaText: string;
    /**
     * Which other participant's persona trait was blended in (or empty for pure self-variation).
     * Serves as fingerprint for consistency tracking.
     */
    blendedFrom?: string;
}

export interface IPersonaMixer {
    /** Generate a persona variation for this agent in this round */
    getMix(context: MixContext): PersonaMix;
    /** Record which variation was used so it's not repeated */
    recordMix(agentId: string, round: number, variationKey: string): void;
    /** Clear all tracking for a session */
    clearSession(): void;
}
