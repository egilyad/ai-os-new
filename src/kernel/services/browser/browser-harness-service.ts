/**
 * BrowserHarnessService — G6 (STATIC GAP CLOSURE).
 *
 * Hardening over ComputerService: strict per-action Zod-like schemas, policy,
 * handoff artifact capture (kv `browser/harness/<id>`). Real browser = BLOCKED-RUNTIME
 * (ComputerService returns handoff when no approved ticket).
 */

import type { IBrowserHarnessService, BrowserArtifact, BrowserHarnessPolicy, BrowserAction } from '../../contracts/browser-harness';
import type { IComputerService } from '../../contracts/rivals5';
import type { DataAccessLayer } from '../../dal/types';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';
import { BROWSER_ACTIONS } from '../../contracts/browser-harness';

const LOGGER = rootLogger.child('BrowserHarness');
const PREFIX = 'browser/harness/';

function isHttpsUrl(s: string, allowed: string[]): boolean {
    try { const u = new URL(s); return allowed.includes(u.protocol); } catch { return false; }
}

function validate(action: BrowserAction, args: Record<string, unknown>, policy: BrowserHarnessPolicy): void {
    if (action === 'click_at') {
        const x = Number(args.x), y = Number(args.y);
        if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1000 || y < 0 || y > 1000) throw new Error('click_at: x/y must be 0..1000');
        if (args.button !== undefined && !['left','right','middle'].includes(String(args.button))) throw new Error('click_at: button must be left|right|middle');
    } else if (action === 'type_text') {
        const text = String(args.text ?? '');
        if (!text) throw new Error('type_text: text required');
        if (text.length > policy.maxTextLen) throw new Error(`type_text: text too long (${text.length} > ${policy.maxTextLen})`);
        const field = String(args.field ?? '');
        for (const re of policy.blockedPatterns) {
            if (re.test(text) || (field && re.test(field))) throw new Error(`type_text: sensitive pattern blocked (${re.source})`);
        }
    } else if (action === 'scroll') {
        const dir = String(args.direction ?? 'down');
        if (!['up','down','left','right'].includes(dir)) throw new Error('scroll: direction must be up|down|left|right');
        if (args.amount !== undefined) {
            const n = Number(args.amount);
            if (!Number.isFinite(n) || n < 1 || n > 10000) throw new Error('scroll: amount 1..10000');
        }
    } else if (action === 'open_url' || action === 'browser_navigate') {
        const url = String(args.url ?? '');
        if (!url) throw new Error(`${action}: url required`);
        if (!isHttpsUrl(url, policy.allowedSchemes)) throw new Error(`${action}: url must be ${policy.allowedSchemes.join('|')}`);
        if (action === 'browser_navigate' && args.waitUntil !== undefined && !['load','domcontentloaded','networkidle'].includes(String(args.waitUntil))) {
            throw new Error('browser_navigate: waitUntil must be load|domcontentloaded|networkidle');
        }
    } else if (action === 'open_app') {
        if (!String(args.name ?? '').trim()) throw new Error('open_app: name required');
    } else if (action === 'devtools_run') {
        if (!String(args.command ?? '').trim()) throw new Error('devtools_run: command required');
        if (args.timeoutMs !== undefined) {
            const n = Number(args.timeoutMs);
            if (!Number.isFinite(n) || n < 100 || n > 120000) throw new Error('devtools_run: timeoutMs 100..120000');
        }
    } else if (action === 'screenshot') {
        if (args.fullPage !== undefined && typeof args.fullPage !== 'boolean') throw new Error('screenshot: fullPage must be boolean');
        if (args.clip !== undefined) {
            const c = args.clip as Record<string, unknown>;
            for (const k of ['x','y','width','height']) {
                const v = Number((c as Record<string, unknown>)[k]);
                if (!Number.isFinite(v) || v < 0) throw new Error(`screenshot: clip.${k} must be >=0`);
            }
        }
    }
}

export class BrowserHarnessService implements IBrowserHarnessService {
    private policy: BrowserHarnessPolicy = {
        maxTextLen: 2000,
        allowedSchemes: ['http:', 'https:'],
        blockedPatterns: [/password|passwd|card|cvv|otp|2fa|seed phrase/i],
    };

    constructor(private deps: { dal: DataAccessLayer; computer: IComputerService; events: IEventBus }) {}

    async init(): Promise<void> {
        LOGGER.info('BrowserHarness', 'init', { policy: { ...this.policy, blockedPatterns: this.policy.blockedPatterns.map((r) => r.source) } });
    }

    async destroy(): Promise<void> {}

    getPolicy(): BrowserHarnessPolicy {
        return { ...this.policy, blockedPatterns: [...this.policy.blockedPatterns] };
    }

    setPolicy(patch: Partial<Omit<BrowserHarnessPolicy, 'blockedPatterns'>> & { blockedPatterns?: RegExp[] }): void {
        this.policy = {
            maxTextLen: patch.maxTextLen ?? this.policy.maxTextLen,
            allowedSchemes: patch.allowedSchemes ?? this.policy.allowedSchemes,
            blockedPatterns: patch.blockedPatterns ?? this.policy.blockedPatterns,
        };
    }

    async act(ticketId: string, action: string, args: Record<string, unknown> = {}): Promise<BrowserArtifact> {
        if (!BROWSER_ACTIONS.includes(action as BrowserAction)) throw new Error(`Unknown browser action: ${action} (${BROWSER_ACTIONS.join('|')})`);
        const act = action as BrowserAction;
        validate(act, args, this.policy);

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        let result = '';
        let status: BrowserArtifact['status'] = 'queued';
        let handoffReason: string | undefined;

        try {
            result = await this.deps.computer.act(ticketId, act, args);
            if (result.startsWith('handoff:')) {
                status = 'handoff';
                handoffReason = result.slice(0, 400);
            } else if (result.startsWith('queued')) {
                status = 'queued';
            } else {
                status = 'queued';
            }
        } catch (e) {
            status = 'rejected';
            handoffReason = e instanceof Error ? e.message : String(e);
            result = `rejected: ${handoffReason}`;
        }

        const artifact: BrowserArtifact = {
            id,
            ticketId,
            action: act,
            args,
            status,
            handoffReason,
            logs: [
                `harness: ${act} validated`,
                `computer: ${result.slice(0, 300)}`,
                status === 'handoff' ? 'BLOCKED-RUNTIME: real browser not wired (handoff)' : `ticket ${ticketId} ${status}`,
            ],
            createdAt: Date.now(),
        };
        await this.deps.dal.kv.set(`${PREFIX}${id}`, artifact);
        try {
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).BROWSER_HARNESS_ACT ?? ('browser:harness:act' as unknown as string),
                { id, ticketId, action: act, status },
            );
        } catch { /* ignore */ }
        return artifact;
    }

    async artifact(id: string): Promise<BrowserArtifact | null> {
        return (await this.deps.dal.kv.get<BrowserArtifact>(`${PREFIX}${id}`)) ?? null;
    }

    async list(ticketId?: string): Promise<BrowserArtifact[]> {
        try {
            const anyDal = this.deps.dal as unknown as { kv: { _store?: Map<string, unknown> } };
            const store = anyDal.kv._store;
            if (store instanceof Map) {
                const out: BrowserArtifact[] = [];
                for (const [k, v] of store.entries()) if (k.startsWith(PREFIX)) {
                    const a = v as BrowserArtifact;
                    if (!ticketId || a.ticketId === ticketId) out.push(a);
                }
                return out.sort((a, b) => b.createdAt - a.createdAt);
            }
        } catch { /* ignore */ }
        return [];
    }
}
