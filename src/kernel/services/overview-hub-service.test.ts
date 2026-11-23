import { describe, expect, it, vi } from 'vitest';
import { OverviewHubService } from './overview-hub-service';

function harness(overrides: Record<string, unknown> = {}) {
    const deps = {
        agents: () => [
            { id: 'a1', status: 'active' },
            { id: 'a2', status: 'paused' },
        ],
        memory: () => ({ count: 42 }),
        debates: () => [{ id: 'd1' }],
        providers: () => [{ id: 'k1', status: 'active' }],
        runs: async () => ({ total: 10, failures: 2 }),
        unread: () => 3,
        ...overrides,
    } as ConstructorParameters<typeof OverviewHubService>[0];
    return new OverviewHubService(deps);
}

describe('OverviewHubService', () => {
    it('собирает пять карточек с корректными значениями', async () => {
        const cards = await harness().snapshot();
        expect(cards.map((c) => c.id)).toEqual([
            'agents',
            'memory',
            'debates',
            'providers',
            'background',
        ]);
        expect(cards[0]).toMatchObject({ value: 1, hint: 'из 2', status: 'ok', link: 'agents' });
        expect(cards[1]).toMatchObject({ value: 42, link: 'memory' });
        expect(cards[4]).toMatchObject({ value: 2, status: 'error', link: 'diagnostics' });
        expect(cards[4]!.hint).toContain('10 запусков');
        expect(cards[4]!.hint).toContain('3 непрочитанных');
    });

    it('отмечает предупреждение при отсутствии активных провайдеров', async () => {
        const cards = await harness({ providers: () => [] }).snapshot();
        expect(cards[3]).toMatchObject({ value: 0, status: 'warning' });
        expect(cards[3]!.hint).toContain('нет активных ключей');
    });

    it('не считает активными paused/failed сущности', async () => {
        const svc = harness({
            agents: () => [
                { id: 'a1', status: 'paused' },
                { id: 'a2', status: 'failed' },
            ],
            runs: vi.fn(async () => ({ total: 0, failures: 0 })),
        });
        const cards = await svc.snapshot();
        expect(cards[0]).toMatchObject({ value: 0, status: 'warning' });
        expect(cards[4]).toMatchObject({ status: 'warning' });
    });
});
