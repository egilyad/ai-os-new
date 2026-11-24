import { describe, expect, it } from 'vitest';
import { applyMods } from './schema-hooks';
import {
    McpServerRecordSchema,
    MobileSessionRecordSchema,
    PushNotificationRecordSchema,
} from '../../types/schema-types';

describe('applyMods', () => {
    it('применяет dotted-path как вложенное обновление', () => {
        const result = applyMods(
            { metadata: { timestamp: 1, source: 'chat' } },
            { 'metadata.timestamp': 2 },
        ) as { metadata: { timestamp: number; source: string } };
        expect(result.metadata).toEqual({ timestamp: 2, source: 'chat' });
        expect(Object.keys(result)).not.toContain('metadata.timestamp');
    });

    it('ordinary-поля и пустой mods не ломают объект', () => {
        expect(applyMods({ status: 'active' }, { status: 'error' })).toEqual({
            status: 'error',
        });
        expect(applyMods({ status: 'active' }, undefined)).toEqual({ status: 'active' });
    });
});

describe('новые record-схемы', () => {
    it('валидирует записи ops-таблиц', () => {
        expect(
            McpServerRecordSchema.safeParse({
                id: 'm1',
                name: 'local',
                url: 'http://localhost:3000',
                tools: [],
                enabled: true,
                createdAt: 1,
                updatedAt: 1,
            }).success,
        ).toBe(true);
        expect(
            MobileSessionRecordSchema.safeParse({
                id: 'mob1',
                deviceName: 'phone',
                pairingCode: '12345678',
                status: 'pending',
                createdAt: 1,
                updatedAt: 1,
            }).success,
        ).toBe(true);
        expect(
            PushNotificationRecordSchema.safeParse({
                id: 'n1',
                title: 't',
                body: 'b',
                read: false,
                createdAt: 1,
            }).success,
        ).toBe(true);
        expect(MobileSessionRecordSchema.safeParse({ id: 'bad' }).success).toBe(false);
    });
});
