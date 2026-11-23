import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { permissionsPayloadSchema, providersPayloadSchema } from './roundtrip-schemas';
import { mergeById, parseRoundtrip, serializeRoundtrip, ROUNDTRIP_VERSION } from './roundtrip';

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

    it('проверяет схему матрицы прав', () => {
        const json = serializeRoundtrip('permissions', [
            { name: 'admin', permissions: ['system:admin'] },
        ]);
        expect(parseRoundtrip(json, 'permissions', permissionsPayloadSchema)).toMatchObject({
            ok: true,
            payload: [{ name: 'admin', permissions: ['system:admin'] }],
        });
        const bad = serializeRoundtrip('permissions', [{ name: 'admin', permissions: 'all' }]);
        expect(parseRoundtrip(bad, 'permissions', permissionsPayloadSchema)).toMatchObject({
            ok: false,
        });
    });

    it('проверяет схему провайдеров и сохраняет лишние поля', () => {
        const json = serializeRoundtrip('providers', {
            items: [{ provider: 'openai', label: 'main', key: 'sk-1' }],
        });
        const parsed = parseRoundtrip(json, 'providers', providersPayloadSchema);
        // payload должен быть массивом — оболочка выше намеренно неверная
        expect(parsed).toMatchObject({ ok: false });
        const valid = serializeRoundtrip('providers', [
            { provider: 'openai', label: 'main', key: 'sk-1' },
        ]);
        expect(parseRoundtrip(valid, 'providers', providersPayloadSchema)).toMatchObject({
            ok: true,
            payload: [{ provider: 'openai', label: 'main', key: 'sk-1' }],
        });
    });

    it('дедуплицирует записи по id в режимах merge и replace', () => {
        const existing = [
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
        ];
        const incoming = [
            { id: 'a', value: 99 },
            { id: 'c', value: 3 },
            { id: 'c', value: 4 },
        ];
        expect(mergeById(existing, incoming, 'merge')).toEqual([
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
            { id: 'c', value: 4 },
        ]);
        expect(mergeById(existing, incoming, 'replace')).toEqual([
            { id: 'a', value: 99 },
            { id: 'c', value: 4 },
        ]);
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
