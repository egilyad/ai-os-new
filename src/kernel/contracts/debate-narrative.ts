// ── Narrative Arc & Storytelling Enforcer (P2.14) ──────────────────────
// Injects setup-conflict-resolution or hero's journey mini-structure
// into agent prompts. Persona-dependent. Boosts persuasiveness + naturalness.

export type NarrativeArcType =
    | 'setup_conflict_resolution'
    | 'hero_journey'
    | 'underdog_story'
    | 'mystery_unraveling'
    | 'cautionary_tale'
    | 'visionary_forecast'
    | 'underdog_vs_goliath';

export interface NarrativeArc {
    readonly arc: NarrativeArcType;
    readonly instruction: string;
}

export interface INarrativeBuilder {
    selectArc(agentId: string, round: number, totalRounds: number): NarrativeArc;
}
