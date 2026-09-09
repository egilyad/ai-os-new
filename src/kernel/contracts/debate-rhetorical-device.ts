// ── Rhetorical Persona Matrix (P2.6) ─────────────────────────────
// Defines rhetorical devices that can be injected into agent prompts
// to diversify argument style beyond the standard format.

export interface RhetoricalDevice {
    id: string;
    name: string;
    description: string;
    promptInstruction: string;
    /** Roles this device is most suited for */
    suitableRoles: Array<'pro' | 'con' | 'neutral'>;
    /** Minimum round before this device can be used */
    minRound: number;
}

export interface IRhetoricalDeviceSelector {
    /** Get rhetorical device instructions for a given agent/round */
    getDevicePrompt(role: string, round: number, language: string): string | undefined;

    /** Get a description of which device was selected (for logging) */
    getSelectedDevice(agentId: string): string | undefined;
}
