// ── Framing Contests Engine (P1.12) ────────────────────────────────────
// Tracks how the debate topic is framed (crisis/opportunity/moral/etc),
// allows agents to reinforce or challenge the dominant frame,
// and contributes frame-stability data to the consensus engine.

export type FrameType =
    | 'crisis'
    | 'opportunity'
    | 'moral'
    | 'economic'
    | 'scientific'
    | 'legal'
    | 'security'
    | 'progress'
    | 'tradition'
    | 'fairness'
    | 'efficiency'
    | 'risk'
    | 'identity'
    | 'global'
    | 'local';

export interface FrameEntry {
    agentId: string;
    agentName: string;
    round: number;
    frame: FrameType;
    /** Brief justification for why this frame applies */
    reasoning: string;
}

export interface IFrameTracker {
    /** Detect dominant frame(s) in a text and register the entry */
    registerFrame(agentId: string, agentName: string, round: number, content: string): void;

    /** Get the dominant frame heading into this round */
    getDominantFrame(): { frame: FrameType; frequency: number } | null;

    /** Generate a prompt block describing current framing landscape */
    getFramePrompt(language?: string): string;

    /** Clear all tracking for a session */
    clearSession(): void;
}
