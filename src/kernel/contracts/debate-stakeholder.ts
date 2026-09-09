// ── Stakeholder Impact Multi-Perspective Analyzer (P1.24) ────────────
// Identifies affected stakeholders from debate topic and forces agents
// to address their perspectives. Works best on policy-themed debates.

export interface Stakeholder {
    id: string;
    label: string;
    relevanceScore: number; // 0-1
    keyConcern: string;
}

export interface IStakeholderMapper {
    analyzeTopic(topic: string): Stakeholder[];
    getFormattedStakeholders(stakeholders: Stakeholder[], language?: string): string;
    clearSession(): void;
}
