/**
 * CodeSandboxService — G5 (STATIC GAP CLOSURE).
 *
 * Hardening over CodeExecService: policy, timeout, artifact capture.
 * Additive — CodeExecService untouched (validate+queue). Sandbox wraps its delegate
 * with timeout + logs. No real E2B (BLOCKED-RUNTIME stub returns artifact note).
 */

import type { ICodeSandboxService, CodeArtifact, SandboxPolicy } from '../../contracts/code-sandbox';
import type { ICodeExecService } from '../../contracts/rivals5';
import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CodeSandbox');

const DEFAULT_BANNED = ['eval', 'Function', 'process', 'require', 'import(', '__proto__', 'constructor', 'globalThis', 'fetch', 'XMLHttpRequest'];
const ARTIFACT_PREFIX = 'codesandbox/artifact/';

type Delegate = (ticketId: string, language: string, code: string) => Promise<string>;

export class CodeSandboxService implements ICodeSandboxService {
    private policy: SandboxPolicy = {
        maxChars: 20000,
        allowedLanguages: ['python', 'javascript', 'typescript', 'sql'],
        banned: [...DEFAULT_BANNED],
        defaultTimeoutMs: 15000,
    };
    private delegate?: Delegate;

    constructor(private deps: { dal: DataAccessLayer; codeExec: ICodeExecService; events: IEventBus }) {}

    async init(): Promise<void> {
        LOGGER.info('CodeSandbox', 'init', { policy: this.policy });
        // Install sandbox executor as CodeExec delegate (hardened)
        this.deps.codeExec.setExecutor(async (ticketId, lang, code) => {
            return this.runWithTimeout(ticketId, lang, code);
        });
    }

    async destroy(): Promise<void> {
        this.delegate = undefined;
    }

    setPolicy(patch: Partial<SandboxPolicy>): void {
        this.policy = { ...this.policy, ...patch, banned: patch.banned ?? this.policy.banned, allowedLanguages: patch.allowedLanguages ?? this.policy.allowedLanguages };
        LOGGER.info('CodeSandbox', 'policy updated', { policy: this.policy });
    }

    getPolicy(): SandboxPolicy {
        return { ...this.policy, banned: [...this.policy.banned], allowedLanguages: [...this.policy.allowedLanguages] };
    }

    setExecutor(delegate: Delegate): void {
        this.delegate = delegate;
    }

    async submit(language: string, code: string, opts?: { timeoutMs?: number }): Promise<string> {
        const lang = language.toLowerCase().slice(0, 20);
        if (!this.policy.allowedLanguages.includes(lang)) throw new Error(`Language not allowed by sandbox policy: ${language} (allowed: ${this.policy.allowedLanguages.join(',')})`);
        if (code.length > this.policy.maxChars) throw new Error(`Sandbox policy: code too large (${code.length} > ${this.policy.maxChars})`);
        for (const banned of this.policy.banned) if (code.includes(banned)) throw new Error(`Sandbox policy: banned identifier: ${banned}`);
        const timeoutMs = Math.max(1000, Math.min(120000, opts?.timeoutMs ?? this.policy.defaultTimeoutMs));

        // Pre-create artifact as queued (so even if CodeExec rejects, we have artifact)
        const ticketId = await this.deps.codeExec.submit(lang, code);
        const artifact: CodeArtifact = {
            ticketId,
            language: lang,
            status: 'queued',
            logs: [`sandbox: policy ok, timeout ${timeoutMs}ms, queued`],
            timeoutMs,
            createdAt: Date.now(),
        };
        await this.deps.dal.kv.set(`${ARTIFACT_PREFIX}${ticketId}`, artifact);

        // After CodeExec delegate runs (via sandbox executor), update artifact from delegate result
        // We poll the artifact that delegate will have updated via runWithTimeout
        const stored = await this.deps.dal.kv.get<CodeArtifact>(`${ARTIFACT_PREFIX}${ticketId}`);
        if (stored) return ticketId;

        // Fallback — ensure artifact exists even if delegate didn't update (queued handoff)
        await this.deps.dal.kv.set(`${ARTIFACT_PREFIX}${ticketId}`, artifact);
        return ticketId;
    }

    async artifact(ticketId: string): Promise<CodeArtifact> {
        const a = await this.deps.dal.kv.get<CodeArtifact>(`${ARTIFACT_PREFIX}${ticketId}`);
        if (!a) throw new Error(`Artifact not found: ${ticketId}`);
        // Also merge CodeExec result if sandbox artifact still queued but CodeExec has result
        try {
            const execResult = await this.deps.codeExec.result(ticketId);
            if (a.status === 'queued' && !execResult.startsWith('queued')) {
                // exec finished (done/rejected) but artifact not updated — patch
                const isDone = execResult.startsWith('done:');
                a.status = isDone ? 'done' : 'rejected';
                a.result = execResult.slice(0, 8000);
                a.logs.push(`codeexec: ${execResult.slice(0, 200)}`);
                a.completedAt = Date.now();
                a.exitCode = isDone ? 0 : 1;
                await this.deps.dal.kv.set(`${ARTIFACT_PREFIX}${ticketId}`, a);
            }
        } catch { /* ignore */ }
        return a;
    }

    async list(): Promise<CodeArtifact[]> {
        // best-effort: scan kv prefix (DAL kv is Map-like; we iterate via known index would be better, but fallback to CodeExec tickets)
        // For static test we keep in-memory via kv.get all keys not exposed — so we track via known tickets by scanning codeExec prefix is not needed.
        // Instead, we return artifacts for known ticketIds by checking kv keys if DAL exposes enumeration.
        // Fallback: return empty if not enumerable (still static verified via direct artifact()).
        try {
            const dalAny = this.deps.dal as unknown as { kv: { _store?: Map<string, unknown>; store?: Map<string, unknown> } };
            const store = dalAny.kv._store ?? dalAny.kv.store;
            if (store instanceof Map) {
                const out: CodeArtifact[] = [];
                for (const [k, v] of store.entries()) if (k.startsWith(ARTIFACT_PREFIX)) out.push(v as CodeArtifact);
                return out.sort((a, b) => b.createdAt - a.createdAt);
            }
        } catch { /* ignore */ }
        return [];
    }

    private async runWithTimeout(ticketId: string, language: string, code: string): Promise<string> {
        const kvKey = `${ARTIFACT_PREFIX}${ticketId}`;
        // Load artifact to get timeoutMs
        const artifact = (await this.deps.dal.kv.get<CodeArtifact>(kvKey)) ?? {
            ticketId,
            language,
            status: 'queued' as const,
            logs: [],
            timeoutMs: this.policy.defaultTimeoutMs,
            createdAt: Date.now(),
        };
        const timeoutMs = artifact.timeoutMs ?? this.policy.defaultTimeoutMs;

        const exec: Delegate = this.delegate ?? (async (_id, lang, c) => `stub artifact (${lang}, ${c.length} chars) — BLOCKED-RUNTIME: real E2B not wired`);

        let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error(`Sandbox timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        try {
            const result = await Promise.race([exec(ticketId, language, code), timeoutPromise]);
            if (timeoutHandle) clearTimeout(timeoutHandle);
            const done: CodeArtifact = {
                ticketId,
                language,
                status: 'done',
                result: String(result).slice(0, 8000),
                logs: [...artifact.logs, `sandbox: done in <${timeoutMs}ms`, `exit 0`],
                exitCode: 0,
                timeoutMs,
                createdAt: artifact.createdAt,
                completedAt: Date.now(),
            };
            await this.deps.dal.kv.set(kvKey, done);
            try {
                (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                    (EVENTS as unknown as Record<string, string>).CODEEXEC_SANDBOX_DONE ?? ('codeexec:sandbox:done' as unknown as string),
                    { ticketId, language, timeoutMs },
                );
            } catch { /* ignore */ }
            return done.result ?? '';
        } catch (e) {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            const msg = e instanceof Error ? e.message : String(e);
            const isTimeout = msg.includes('timeout');
            const failed: CodeArtifact = {
                ticketId,
                language,
                status: isTimeout ? 'timeout' : 'rejected',
                result: msg.slice(0, 8000),
                logs: [...artifact.logs, `sandbox: ${isTimeout ? 'timeout' : 'rejected'}: ${msg.slice(0, 200)}`, `exit ${isTimeout ? 124 : 1}`],
                exitCode: isTimeout ? 124 : 1,
                timeoutMs,
                createdAt: artifact.createdAt,
                completedAt: Date.now(),
            };
            await this.deps.dal.kv.set(kvKey, failed);
            throw new Error(failed.result ?? msg, { cause: e });
        }
    }
}
