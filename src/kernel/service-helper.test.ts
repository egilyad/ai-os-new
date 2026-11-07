import { describe, it, expect, beforeEach } from 'vitest';
import {
    lazyService,
    tryGetServiceProp,
    invalidateLazyServiceNotFound,
    clearResolvedServices,
    getContainer,
} from './service-helper';

describe('service-helper (lazyService)', () => {
    beforeEach(() => {
        clearResolvedServices();
    });

    it('throws when accessed before registration', () => {
        const svc = lazyService<{ greet(): string }>('demo-service');
        expect(() => svc.greet()).toThrow(/ServiceNotRegisteredError/);
        expect(tryGetServiceProp(svc, 'greet')).toBeUndefined();
    });

    it('resolves after registration + invalidation', () => {
        const container = getContainer();
        container.register('demo-service', { greet: () => 'hello' });
        invalidateLazyServiceNotFound('demo-service');
        const svc = lazyService<{ greet(): string }>('demo-service');
        expect(svc.greet()).toBe('hello');
    });

    it('returns registered data properties', () => {
        const container = getContainer();
        container.register('cfg-service', { env: 'test' });
        invalidateLazyServiceNotFound('cfg-service');
        const svc = lazyService<{ env: string }>('cfg-service');
        expect(svc.env).toBe('test');
    });

    it('falls back to provided fallback functions', () => {
        const svc = lazyService<{ missing(): string }>('absent-service', {
            missing: () => 'fallback',
        });
        expect(svc.missing()).toBe('fallback');
    });
});
