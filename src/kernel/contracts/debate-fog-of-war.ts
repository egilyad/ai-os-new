// ── Fog of War (P2) ──────────────────────────────────────────────
export interface FogConfig { readonly visibleIds: string[]; }
export interface IFogOfWarService { filter(viewerId: string, all: string[]): FogConfig; }
