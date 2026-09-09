// ── Dynamic Persona (P2) ─────────────────────────────────────────
export interface PersonaVariant { readonly variant: string; readonly reason: string; }
export interface IDynamicPersonaService { select(topic: string): PersonaVariant; }
