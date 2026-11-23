import { z } from 'zod';

export const ROUNDTRIP_FORMAT = 'superagents-roundtrip';
export const ROUNDTRIP_VERSION = 2;

const EnvelopeSchema = z.object({
    format: z.literal(ROUNDTRIP_FORMAT),
    version: z.number().int().positive(),
    kind: z.string().min(1),
    exportedAt: z.string(),
    payload: z.unknown(),
});

export type RoundtripResult<T> =
    { ok: true; payload: T; version: number } | { ok: false; error: string };

export function serializeRoundtrip<T>(kind: string, payload: T, now = new Date()): string {
    return JSON.stringify(
        {
            format: ROUNDTRIP_FORMAT,
            version: ROUNDTRIP_VERSION,
            kind,
            exportedAt: now.toISOString(),
            payload,
        },
        null,
        2,
    );
}

export type ImportMode = 'merge' | 'replace';

export function mergeById<T extends { id: string }>(
    existing: T[],
    incoming: T[],
    mode: ImportMode,
): T[] {
    if (mode === 'replace') {
        const byId = new Map<string, T>();
        for (const item of incoming) byId.set(item.id, item);
        return [...byId.values()];
    }
    const known = new Set(existing.map((item) => item.id));
    const fresh = new Map<string, T>();
    for (const item of incoming) if (!known.has(item.id)) fresh.set(item.id, item);
    return [...existing, ...fresh.values()];
}

export function parseRoundtrip<T>(
    json: string,
    kind: string,
    schema: z.ZodType<T>,
    migrations: Record<number, (data: unknown) => unknown> = {},
): RoundtripResult<T> {
    let raw: unknown;
    try {
        raw = JSON.parse(json);
    } catch {
        return { ok: false, error: 'Invalid JSON' };
    }
    const envelope = EnvelopeSchema.safeParse(raw);
    if (!envelope.success) return { ok: false, error: 'Unknown export format' };
    if (envelope.data.kind !== kind) {
        return { ok: false, error: `Expected ${kind}, got ${envelope.data.kind}` };
    }
    if (envelope.data.version > ROUNDTRIP_VERSION) {
        return { ok: false, error: `Unsupported version ${envelope.data.version}` };
    }

    let payload = envelope.data.payload;
    for (let v = envelope.data.version; v < ROUNDTRIP_VERSION; v++) {
        const migrate = migrations[v];
        if (!migrate) return { ok: false, error: `No migration from version ${v}` };
        payload = migrate(payload);
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) return { ok: false, error: 'Payload does not match schema' };
    return { ok: true, payload: parsed.data, version: envelope.data.version };
}
