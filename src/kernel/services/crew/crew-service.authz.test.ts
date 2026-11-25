import { describe, expect, it, vi } from 'vitest';
import { CrewService } from './crew-service';

function makeDeps() {
    const repo = {
        putCrew: vi.fn(async () => {}),
        putTask: vi.fn(async () => {}),
        getCrew: vi.fn(async () => null),
        deleteCrew: vi.fn(async () => {}),
        listTasks: vi.fn(async () => []),
    };
    return {
        repo,
        events: { emit: vi.fn() },
        base: { repository: repo as never, eventBus: { emit: vi.fn() } as never },
    };
}

describe('CrewService authorization', () => {
    it('отвергает мутацию при deny от authorizationService', async () => {
        const { repo, base } = makeDeps();
        const assertAllowed = vi.fn(async () => {
            throw new Error('crew mutation denied');
        });
        const svc = new CrewService({
            ...base,
            authorization: { assertAllowed } as never,
        });

        await expect(svc.createCrew({ name: 'x' } as never)).rejects.toThrow(
            /crew mutation denied/,
        );
        expect(assertAllowed).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'crew:create', actor: 'system' }),
        );
        expect(repo.putCrew).not.toHaveBeenCalled();
    });

    it('без authorizationService локальный режим работает как раньше', async () => {
        const { repo, base } = makeDeps();
        const svc = new CrewService(base);
        const crew = await svc.createCrew({ name: 'x' } as never);
        expect(crew.name).toBe('x');
        expect(repo.putCrew).toHaveBeenCalled();
    });
});
