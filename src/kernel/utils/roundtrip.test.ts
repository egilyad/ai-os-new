import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseRoundtrip, serializeRoundtrip, ROUNDTRIP_VERSION } from './roundtrip';

const Payload = z.object({ items: z.array(z.object({ id: z.string() })) });

describe('roundtrip serializer', () => {
    it('сериализует и парсит payload с версией', () => {
        const json = serializeRoundtrip(
            'memory',
            { items: [{ id: 'm1' }] },
            new Date('2026-11-23T00:00:00Z'),
        );
        const parsed = parseRoundtrip(json, 'memory', Payload);
        expect(parsed).toMatchObject({
            ok: true,
            version: ROUNDTRIP_VERSION,
            payload: { items: [{ id: 'm1' }] },
        });
        expect(json).toContain('"format": "superagents-roundtrip"');
        expect(json).toContain('2026-11-23');
    });

    it('отвергает неверный формат, вид и версию', () => {
        expect(parseRoundtrip('{oops', 'memory', Payload)).toMatchObject({ ok: false });
        expect(parseRoundtrip('{"format":"other"}', 'memory', Payload)).toMatchObject({
            ok: false,
            error: 'Unknown export format',
        });
        const json = serializeRoundtrip('memory', { items: [] });
        expect(parseRoundtrip(json, 'debates', Payload)).toMatchObject({ ok: false });
        const future = JSON.parse(json) as Record<string, unknown>;
        future['version'] = ROUNDTRIP_VERSION + 1;
        expect(parseRoundtrip(JSON.stringify(future), 'memory', Payload)).toMatchObject({
            ok: false,
            error: expect.stringContaining('Unsupported version'),
        });
    });

    it('проверяет payload схемой', () => {
        const json = serializeRoundtrip('memory', { wrong: true });
        expect(parseRoundtrip(json, 'memory', Payload)).toMatchObject({
            ok: false,
            error: 'Payload does not match schema',
        });
    });

    it('применяет миграции старых версий', () => {
        const raw = JSON.parse(serializeRoundtrip('memory', { records: ['m1'] })) as Record<
            string,
            unknown
        >;
        raw['version'] = 1;
        const json = JSON.stringify(raw);
        const migrated = parseRoundtrip(json, 'memory', Payload, {
            1: (data) => ({ items: (data as { records: string[] }).records.map((id) => ({ id })) }),
        });
        expect(migrated).toMatchObject({ ok: true, payload: { items: [{ id: 'm1' }] } });
        expect(parseRoundtrip(json, 'memory', Payload)).toMatchObject({ ok: false });
    });
});
