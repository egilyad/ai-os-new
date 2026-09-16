import '../../tests/setup-runtime';
import { describe, it, expect } from 'vitest';
import { runtime } from '../runtime';
import type {
    IClaudeCodeService,
    IMcpDeepService,
    IFilesApiService,
    ICacheControlService,
    IProjectService,
    IDynamicWorkflowService,
    IRoutineService,
    IAgentViewService,
} from '../contracts/rivals14';
import type { IComputerService, ICodeExecService } from '../contracts/rivals5';

const get = <T>(token: string): T => runtime.getService<T>(token);

describe('Phase46 e2e chain (T)', () => {
    it('claudecode → mcp → computer → codeexec → files → cache → project → dynwf → routine → agentview', async () => {
        const claude = get<IClaudeCodeService>('claudeCodeService');
        expect((await claude.slashCommand('plan', 'demo')).length).toBeGreaterThan(0);

        const mcp = get<IMcpDeepService>('mcpDeepService');
        expect(Array.isArray((await mcp.discover('srv1')).tools)).toBe(true);

        const computer = get<IComputerService>('computerService');
        expect(await computer.act('fake-ticket-1', 'screenshot', {})).toContain('handoff');

        const codeexec = get<ICodeExecService>('codeExecService');
        const ticketId = await codeexec.submit('python', 'print(1)');
        expect(ticketId.length).toBeGreaterThan(0);
        expect(await codeexec.result(ticketId)).toContain('queued');

        const files = get<IFilesApiService>('filesApiService');
        await files.upload('chain-a.txt', 'hi');
        expect((await files.list()).length).toBeGreaterThan(0);

        const cache = get<ICacheControlService>('cacheControlService');
        await cache.markCacheable('chain-k1');
        expect((await cache.stats()).entries).toBeGreaterThan(0);

        const project = get<IProjectService>('projectService');
        expect((await project.createProject('ChainDemo')).length).toBeGreaterThan(0);

        const dynwf = get<IDynamicWorkflowService>('dynamicWorkflowService');
        expect((await dynwf.run(['a', 'b'])).length).toBe(2);

        const routine = get<IRoutineService>('routineService');
        const routineId = await routine.define('chain-r', { kind: 'api', spec: '/x' }, ['step1']);
        expect((await routine.trigger(routineId, 'p')).length).toBeGreaterThan(0);

        const agentview = get<IAgentViewService>('agentViewService');
        expect(await agentview.skillViaContainer('summarize', 'hello')).toContain('summarize');
    }, 60000);
});
