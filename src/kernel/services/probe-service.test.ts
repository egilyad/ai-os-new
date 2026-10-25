import { describe, expect, it, vi } from 'vitest';
import { ProbeService, type ProbeServiceDeps } from './probe-service';
import type { ApiKey } from '../types/metrics-types';

function makeKey(partial: Partial<ApiKey>): ApiKey {
    return {
        id: 'k1',
        provider: 'openrouter',
        key: 'sk-test',
        status: 'active',
        label: 'test',
        ...partial,
    } as ApiKey;
}

function makeDeps(overrides: Partial<ProbeServiceDeps> = {}): ProbeServiceDeps {
    const key: ApiKey = makeKey({});
    return {
        keyService: {
            getKeys: () => [key],
            getKey: (id) => (id === key.id ? key : undefined),
            isProviderCircuitOpen: () => false,
            isProviderRateLimited: () => false,
            recordUsage: () => {},
            pushHistory: () => {},
            ...(overrides.keyService as never),
        },
        adapterRegistry: {
            getAdapter: () => undefined,
            resetCircuitBreaker: () => {},
            ...(overrides.adapterRegistry as never),
        },
        keyStateStore: {
            get: () => undefined,
            update: () => {},
            ingestProbe: () => {},
            ...(overrides.keyStateStore as never),
        },
        eventBus: {
            emit: () => {},
            ...(overrides.eventBus as never),
        },
        ...overrides,
    };
}

describe('ProbeService', () => {
    it('returns broken when key is missing', async () => {
        const deps = makeDeps({ keyService: { getKey: () => undefined } as never });
        const svc = new ProbeService(deps);
        const r = await svc.probeKey('nope');
        expect(r.status).toBe('broken');
        expect(r.error).toContain('Key not found');
    });

    it('returns broken when no adapter exists for provider', async () => {
        const deps = makeDeps();
        const svc = new ProbeService(deps);
        const r = await svc.probeKey('k1');
        expect(r.status).toBe('broken');
        expect(r.error).toContain('No adapter');
    });

    it('reports ready when adapter responds with content', async () => {
        const deps = makeDeps({
            adapterRegistry: {
                getAdapter: () =>
                    ({
                        sendMessage: async () => ({ content: '4', latency: 10 }),
                    }) as never,
                resetCircuitBreaker: () => {},
            } as never,
        });
        const svc = new ProbeService(deps);
        const r = await svc.probeKey('k1');
        expect(r.status).toBe('ready');
        expect(r.responseContent).toBe('4');
        expect(r.model).toBe('meta-llama/llama-3.1-8b-instruct');
    });

    it('marks auth-failed key as broken without probing', async () => {
        const deps = makeDeps({
            keyStateStore: {
                get: () => ({ flags: { authFailed: true, rateLimited: false, circuitOpen: false } }),
                update: () => {},
                ingestProbe: () => {},
            } as never,
        });
        const svc = new ProbeService(deps);
        const r = await svc.probeKey('k1');
        expect(r.status).toBe('broken');
        expect(r.error).toContain('auth failed');
    });
});
