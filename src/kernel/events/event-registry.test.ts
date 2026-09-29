import { describe, it, expect } from 'vitest';
import { EVENT_REGISTRY } from './event-registry';

// 5.2: duplicate event names share one validator slot (last-wins in
// buildValidators) and EventBus replaces the payload with the parsed result,
// so a divergent duplicate silently strips fields (seen live: the
// CHAT_SEND_MESSAGE alias dropped top-level `sessionId` from every
// chat:send emit). Aliases with identical schemas are allowed, but any
// structural divergence must fail loudly here instead of corrupting payloads.
function fingerprint(v: unknown, seen = new Set<object>()): unknown {
    if (typeof v === 'function') return '[fn]';
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return '[cycle]';
    seen.add(v);
    if (Array.isArray(v)) return v.map((x) => fingerprint(x, seen));
    const rec = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    // NOTE: zod v4 keeps the schema definition in non-enumerable `_def`,
    // invisible to Object.keys — read all own props explicitly.
    for (const k of Object.getOwnPropertyNames(rec).sort()) {
        if (k === '_zod' || k === 'def' || k === 'parent' || k === 'description' || k === 'meta')
            continue;
        let val: unknown;
        try {
            val = rec[k];
        } catch {
            continue;
        }
        out[k] = fingerprint(val, seen);
    }
    return out;
}

describe('EVENT_REGISTRY duplicate names', () => {
    it('aliases sharing an event name have structurally identical schemas', () => {
        const byName = new Map<string, string[]>();
        for (const [key, entry] of Object.entries(EVENT_REGISTRY)) {
            const e = entry as { name: string; schema: unknown };
            const fp = JSON.stringify(fingerprint(e.schema));
            const arr = byName.get(e.name) ?? [];
            arr.push(`${key}::${fp}`);
            byName.set(e.name, arr);
        }
        const diverged: string[] = [];
        for (const [name, arr] of byName) {
            if (arr.length < 2) continue;
            const fps = new Set(arr.map((a) => a.split('::')[1]));
            if (fps.size > 1) {
                const keys = arr.map((a) => a.split('::')[0]);
                diverged.push(`${name} <- ${keys.join(', ')}`);
            }
        }
        expect(diverged).toEqual([]);
    });
});
