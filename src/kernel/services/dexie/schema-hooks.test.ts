import { describe, expect, it } from 'vitest';
import { applyMods } from './schema-hooks';

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
