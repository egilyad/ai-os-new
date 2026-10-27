import '../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from './runtime';

/**
 * Golden Scenario Suite — эталонные сквозные сценарии работы системы.
 *
 * Опираются на реальные сервисы ядра (DI-контейнер), а не на моки.
 * Каждый сценарий проверяет целостность цепочки: запись → чтение → поиск.
 */

function svc<T>(name: string): T {
    return runtime.getService<T>(name);
}

describe('Golden Scenario: ключи', () => {
    it('добавить ключ → он появляется в списке и в активных', async () => {
        const keyService = svc<{
            addKey: (data: {
                provider: string;
                key: string;
                label: string;
                status: string;
            }) => Promise<{ id: string } | undefined>;
            getKeys: () => Array<{ id: string; provider: string; status: string }>;
            getActiveKeys: () => Array<{ id: string }>;
        }>('keyService');

        const added = await keyService.addKey({
            provider: 'openrouter',
            key: 'sk-golden-test',
            label: 'Golden Test Key',
            status: 'active',
        });
        expect(added).toBeTruthy();
        if (!added) return;

        const keys = keyService.getKeys();
        expect(keys.some((k) => k.id === added.id)).toBe(true);

        const active = keyService.getActiveKeys();
        expect(active.some((k) => k.id === added.id)).toBe(true);
    });
});

describe('Golden Scenario: кристаллы', () => {
    it('предложить → кристаллизовать → увидеть в списке', async () => {
        const vault = svc<{
            propose: (input: {
                content: { statement: string };
                originKind: string;
                originId: string;
                applicableDomain?: string;
            }) => Promise<string>;
            crystallize: (id: string) => Promise<{ status: string } | null>;
            list: () => Promise<Array<{ crystalId: string; status: string }>>;
        }>('crystalVault');

        const id = await vault.propose({
            content: { statement: 'Золотой сценарий: конвейер знаний работает' },
            originKind: 'observation',
            originId: 'golden-1',
            applicableDomain: 'general',
        });
        expect(id).toBeTruthy();

        const crystallized = await vault.crystallize(id);
        expect(crystallized).not.toBeNull();

        const all = await vault.list();
        expect(all.some((c) => c.crystalId === id)).toBe(true);
    });
});

describe('Golden Scenario: память', () => {
    it('сохранить запись → найти поиском', async () => {
        const memory = svc<{
            store: (entry: {
                content: string;
                metadata: {
                    source: string;
                    type: string;
                    timestamp: number;
                    importance: number;
                };
            }) => Promise<unknown>;
            search: (
                q: string,
                limit?: number,
                mode?: string,
            ) => Promise<Array<{ entry: { content: string } }>>;
        }>('memoryService');

        const marker = 'golden-memory-marker';
        await memory.store({
            content: `Эталонная запись ${marker} для проверки поиска`,
            metadata: {
                source: 'golden-test',
                type: 'context',
                timestamp: Date.now(),
                importance: 0.8,
            },
        });

        const hits = await memory.search(marker, 5);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.some((h) => h.entry.content.includes(marker))).toBe(true);
    });
});

describe('Golden Scenario: сервисы доступны', () => {
    it('ключевые сервисы резолвятся', () => {
        const names = [
            'keyService',
            'memoryService',
            'crystalVault',
            'routerService',
            'debateService',
            'agentService',
            'chatService',
            'settingsService',
        ];
        for (const n of names) {
            expect(() => svc(n)).not.toThrow();
        }
    });
});
