// ── Whisper Channels (P2) ────────────────────────────────────────
export interface Whisper { readonly from: string; readonly to: string; readonly hint: string; }
export interface IWhisperChannelsService { whisper(allied: string[], hint: string): Whisper[]; }
