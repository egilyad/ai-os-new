import { describe, expect, it, vi } from 'vitest';
import { CognitiveIntelligenceService } from './cognitive-intelligence-service';

function makeBus() {
    const handlers = new Map<string, Array<(d: unknown) => void>>();
    return {
        onSafe: vi.fn((event: string, cb: (d: unknown) => void) => {
            const arr = handlers.get(event) ?? [];
            arr.push(cb);
            handlers.set(event, arr);
            return () => {
                handlers.set(
                    event,
                    (handlers.get(event) ?? []).filter((h) => h !== cb),
                );
            };
        }),
        on: vi.fn(),
        emit: vi.fn(),
        handlers,
    };
}

describe('CognitiveIntelligenceService', () => {
    it('init подписывается на события и refresh работает', async () => {
        const bus = makeBus();
        const svc = new CognitiveIntelligenceService(bus as never);
        await svc.init();
        expect(bus.onSafe).toHaveBeenCalled();
        expect(() => svc.refresh()).not.toThrow();
        svc.destroy();
    });

    it('getMetrics/getPressure возвращают snapshot', async () => {
        const bus = makeBus();
        const svc = new CognitiveIntelligenceService(bus as never);
        await svc.init();
        expect(svc.getMetrics()).toBeDefined();
        expect(svc.getPressure()).toBeDefined();
        svc.destroy();
    });

    it('diagnoseSession возвращает undefined для неизвестной сессии', async () => {
        const bus = makeBus();
        const svc = new CognitiveIntelligenceService(bus as never);
        await svc.init();
        expect(svc.diagnoseSession('nope')).toBeUndefined();
        svc.destroy();
    });

    it('simulateTopologyChange возвращает undefined для неизвестной сессии', async () => {
        const bus = makeBus();
        const svc = new CognitiveIntelligenceService(bus as never);
        await svc.init();
        expect(svc.simulateTopologyChange('nope', 'roundtable')).toBeUndefined();
        svc.destroy();
    });
});
