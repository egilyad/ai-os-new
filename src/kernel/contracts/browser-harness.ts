/**
 * Browser Harness contracts — GAP G6 (STATIC GAP CLOSURE).
 *
 * Hardening over ComputerService (J.3): Zod-like strict schemas per action,
 * handoff artifact capture, policy (blockedPatterns). Real browser execution = BLOCKED-RUNTIME.
 */

import type { ILifecycle } from './lifecycle';

export const BROWSER_ACTIONS = ['screenshot', 'click_at', 'type_text', 'scroll', 'open_url', 'open_app', 'browser_navigate', 'devtools_run'] as const;
export type BrowserAction = typeof BROWSER_ACTIONS[number];

export interface BrowserHarnessPolicy {
    maxTextLen: number; // default 2000
    allowedSchemes: string[]; // ['http:','https:']
    blockedPatterns: RegExp[]; // sensitive
}

export interface BrowserArtifact {
    id: string;
    ticketId: string;
    action: BrowserAction;
    args: Record<string, unknown>;
    status: 'handoff' | 'queued' | 'rejected';
    handoffReason?: string;
    logs: string[];
    createdAt: number;
}

export interface IBrowserHarnessService extends ILifecycle {
    getPolicy(): BrowserHarnessPolicy;
    setPolicy(patch: Partial<Omit<BrowserHarnessPolicy, 'blockedPatterns'>> & { blockedPatterns?: RegExp[] }): void;
    /** Hardened act: strict schema → ComputerService.act → artifact + event. */
    act(ticketId: string, action: string, args?: Record<string, unknown>): Promise<BrowserArtifact>;
    artifact(id: string): Promise<BrowserArtifact | null>;
    list(ticketId?: string): Promise<BrowserArtifact[]>;
}
