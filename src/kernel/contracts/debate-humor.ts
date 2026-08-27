// ── Humor Injection (P2) ─────────────────────────────────────────
export interface HumorInsert { readonly text: string; readonly type: 'wit'|'irony'|'analogy'; }
export interface IHumorService { inject(topic: string): HumorInsert | null; }
