/**
 * Code Sandbox contracts — GAP G5 (STATIC GAP CLOSURE).
 *
 * Additive hardening over CodeExecService (J.3, queued tickets).
 * Sandbox adds: policy (allowedLanguages/banned/maxChars), timeout (wrap delegate),
 * artifact capture (logs + exitCode + result slice). Real E2B execution = BLOCKED-RUNTIME.
 */

import type { ILifecycle } from './lifecycle';

export interface SandboxPolicy {
    maxChars: number; // default 20000
    allowedLanguages: string[]; // default ['python','javascript','typescript','sql']
    banned: string[]; // default from CodeExec BANNED
    defaultTimeoutMs: number; // default 15000
}

export interface CodeArtifact {
    ticketId: string;
    language: string;
    status: 'queued' | 'done' | 'rejected' | 'timeout';
    result?: string;
    logs: string[];
    exitCode?: number; // 0=done, 1=rejected, 124=timeout
    timeoutMs: number;
    createdAt: number;
    completedAt?: number;
}

export interface ICodeSandboxService extends ILifecycle {
    setPolicy(patch: Partial<SandboxPolicy>): void;
    getPolicy(): SandboxPolicy;
    /** Submit with sandbox policy + timeout + artifact stub. Returns ticketId. */
    submit(language: string, code: string, opts?: { timeoutMs?: number }): Promise<string>;
    artifact(ticketId: string): Promise<CodeArtifact>;
    list(): Promise<CodeArtifact[]>;
    /** For tests: set stub executor (otherwise BLOCKED-RUNTIME stub). */
    setExecutor(delegate: (ticketId: string, language: string, code: string) => Promise<string>): void;
}
