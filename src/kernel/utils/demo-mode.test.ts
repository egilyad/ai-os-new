import { describe, expect, it } from 'vitest';
import { buildDemoKey, DEMO_MODEL, DEMO_PROVIDER, isDemoKey } from './demo-mode';

describe('demo mode', () => {
    it('строит ключ для локального mock-провайдера без реального секрета', () => {
        const key = buildDemoKey();
        expect(key.provider).toBe(DEMO_PROVIDER);
        expect(key.status).toBe('active');
        expect(key.availableModels).toEqual([DEMO_MODEL]);
        expect(key.key).not.toMatch(/^sk-/);
    });

    it('распознаёт демо-ключ по провайдеру или id', () => {
        expect(isDemoKey(buildDemoKey())).toBe(true);
        expect(isDemoKey({ id: 'demo-mock-key', provider: 'openai' })).toBe(true);
        expect(isDemoKey({ id: 'k1', provider: 'openrouter' })).toBe(false);
    });
});
