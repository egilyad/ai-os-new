import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IGroupChatService,
    IGuardrailService,
    IMemoryBlocksService,
    ISopService,
    IAutonomyService,
    IRunQueueService,
    IPlannerService,
    IDyadService,
} from '../contracts/rivals';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase33 e2e chain (F)', () => {
    it('chat → guardrail → block → sop → goal → queue → step → dyad', async () => {
        const chat = get<IGroupChatService>('groupChatService');
        expect((await chat.createChat({ name: 't', members: ['a', 'b'] })).status).toBe('running');

        const guard = get<IGuardrailService>('guardrailService');
        expect((await guard.check('hello')).ok).toBe(true);

        const blocks = get<IMemoryBlocksService>('memoryBlocksService');
        expect(await blocks.setBlock('o1', 'persona', 'hi')).toBeDefined();

        const sop = get<ISopService>('sopService');
        const sopDef = await sop.defineSop('s', [{ name: 'p1', role: 'r', artifact: 'a', instruction: 'i' }]);
        expect((await sop.runSop(sopDef.id, 'goal')).id).toBeDefined();

        const autonomy = get<IAutonomyService>('autonomyService');
        expect(Array.isArray(await autonomy.listLoops())).toBe(true);

        const queue = get<IRunQueueService>('runQueueService');
        await queue.defineToolkit('tk', ['memory.']);
        expect((await queue.listToolkits()).some((t) => t.name === 'tk')).toBe(true);

        const planner = get<IPlannerService>('plannerService');
        expect(await planner.planStep('draft outline')).toContain('draft outline');

        const dyad = get<IDyadService>('dyadService');
        expect((await dyad.startDyad({ topic: 'x', maxTurns: 2 })).id).toBeDefined();
    }, 60000);
});
