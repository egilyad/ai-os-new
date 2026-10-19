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
import type { IToolRunnerService } from '../contracts/parity';
import type { ILtMemoryService } from '../contracts/persona';

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

    it('registers Letta-style agent-callable memory tools', () => {
        get<IMemoryBlocksService>('memoryBlocksService');
        const runner = get<IToolRunnerService>('toolRunnerService');
        const names = runner.listTools().map((t) => t.name);
        expect(names).toEqual(
            expect.arrayContaining([
                'memory.append',
                'memory.recall',
                'memory.remember',
                'memory.search',
                'memory.link',
                'memory.related',
                'memory.forget',
                'memory.promote',
                'memory.demote',
            ]),
        );
    });

    it('lets agents curate their own long-term memory', async () => {
        get<IMemoryBlocksService>('memoryBlocksService');
        const runner = get<IToolRunnerService>('toolRunnerService');
        const lt = get<ILtMemoryService>('ltMemoryService');
        const m = await lt.remember({ ownerId: 'agent', content: 'self-edit probe' });

        expect(await runner.callTool('agent', 'memory.promote', { id: m.id })).toContain(
            'promoted',
        );
        expect(await runner.callTool('agent', 'memory.demote', { id: m.id })).toContain(
            'demoted',
        );
        expect(await runner.callTool('agent', 'memory.forget', { id: m.id })).toContain('forgot');
        expect(await lt.get(m.id)).toBeNull();
    });
});
