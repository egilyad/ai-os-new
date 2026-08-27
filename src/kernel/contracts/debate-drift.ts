// ── Persona Drift Detector (P1.16) ─────────────────────────────────
// Monitors whether each agent stays in character by comparing
// new arguments against their persona profile (role, system prompt,
// accumulated vocabulary). Triggers correction when drift exceeds
// threshold — prevents agents from going out of character mid-debate.

export interface DriftRecord {
    readonly agentId: string;
    readonly round: number;
    readonly driftScore: number; // 0-1, 0 = perfect persona match, 1 = complete drift
    readonly isDrifting: boolean; // true if driftScore >= threshold
}

export interface PersonaProfile {
    readonly agentId: string;
    readonly role: string; // 'pro' | 'con' | 'neutral'
    readonly keywords: string[]; // extracted from systemPrompt and historical arguments
    readonly accumulatedContent: string[]; // all prior arguments text
}

export interface IPersonaDriftDetector {
    /**
     * Register a participant's persona definition before debate starts.
     * Must be called for each agent before any recordArgument() calls.
     */
    registerPersona(agentId: string, role: string, systemPrompt?: string): void;

    /**
     * Record a new argument and compute drift score against persona profile.
     * Returns a DriftRecord describing the measurement.
     */
    recordArgument(agentId: string, round: number, content: string): DriftRecord;

    /**
     * Get drift status for an agent in a given round.
     * Returns undefined if no argument was recorded for this round.
     */
    getDrift(agentId: string, round: number): DriftRecord | undefined;

    /**
     * Clean up data for a completed session.
     */
    clearSession(): void;
}
