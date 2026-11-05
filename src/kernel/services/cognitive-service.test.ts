import { describe, expect, it, vi } from 'vitest';
import { CognitiveService, type CognitiveServiceDeps } from './cognitive-service';

function makeDeps(overrides: Partial<CognitiveServiceDeps> = {}): CognitiveServiceDeps {
    return {
        eventBus: {
            on: vi.fn(() => () => {}),
            onSafe: vi.fn(() => () => {}),
            emit: vi.fn(),
        },
        traceStore: {
            bulkPut: vi.fn(async () => {}),
            count: vi.fn(async () => 0),
            queryTraces: vi.fn(async () => []),
            deleteTrace: vi.fn(async () => {}),
            clear: vi.fn(async () => {}),
            saveTrace: vi.fn(async () => {}),
            getTrace: vi.fn(async () => undefined),
            exportAll: vi.fn(async () => []),
            importAll: vi.fn(async () => {}),
        } as unknown as CognitiveServiceDeps['traceStore'],
        routerService: {
            getRankedProviders: vi.fn(() => []),
        },
        roleService: {
            recordRoleUsage: vi.fn(),
        },
        adapterRegistry: {
            getAdapter: vi.fn(),
        } as unknown as CognitiveServiceDeps['adapterRegistry'],
        blackboardService: { read: vi.fn() },
        ...overrides,
    };
}

const node = {
    id: 'n1',
    config: { provider: 'openai', model: 'gpt-4o', keyId: 'k1' },
} as never;

describe('CognitiveService', () => {
    it('buildPrompt объединяет systemPrompt и output', () => {
        const svc = new CognitiveService(makeDeps());
        const prompt = (
            svc as unknown as { buildPrompt(n: unknown, d: unknown): string }
        ).buildPrompt({ config: { systemPrompt: 'SYS' } }, { output: 'OUT' });
        expect(prompt).toContain('SYS');
        expect(prompt).toContain('OUT');
    });

    it('evaluateAlternatives возвращает пусто, когда нет провайдеров', () => {
        const svc = new CognitiveService(makeDeps());
        const alts = (
            svc as unknown as { evaluateAlternatives(n: unknown, d: unknown, i: string): unknown[] }
        ).evaluateAlternatives(node, { strategy: 'auto' }, 'q');
        expect(alts).toEqual([]);
    });

    it('executeAgentNode с pinned binding вызывает adapter и возвращает output', async () => {
        const adapter = { sendMessage: vi.fn(async () => ({ content: 'answer' })) };
        const deps = makeDeps({
            keyService: { getKey: vi.fn(() => ({ key: 'sk', status: 'active' })) },
            adapterRegistry: { getAdapter: vi.fn(() => adapter) } as never,
        });
        const svc = new CognitiveService(deps);
        const out = await svc.executeAgentNode(node, {} as never);
        expect(out).toBe('answer');
        expect(adapter.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('executeAgentNode бросает при отсутствии альтернатив', async () => {
        const svc = new CognitiveService(makeDeps());
        await expect(svc.executeAgentNode(node, {} as never)).rejects.toThrow(
            'No viable execution alternatives',
        );
    });

    it('getStats возвращает snapshot', () => {
        const svc = new CognitiveService(makeDeps());
        const stats = svc.getStats();
        expect(stats.totalTraces).toBe(0);
    });

    it('executeAgentNode с ошибкой адаптера бросает', async () => {
        const adapter = {
            sendMessage: vi.fn(async () => {
                throw new Error('adapter down');
            }),
        };
        const deps = makeDeps({
            keyService: { getKey: vi.fn(() => ({ key: 'sk', status: 'active' })) },
            adapterRegistry: { getAdapter: vi.fn(() => adapter) } as never,
        });
        const svc = new CognitiveService(deps);
        await expect(svc.executeAgentNode(node, {} as never)).rejects.toThrow('adapter down');
    });
});
