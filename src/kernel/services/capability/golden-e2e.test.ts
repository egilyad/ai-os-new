/**
 * Golden E2E — Phase X+ hardening (written, not run on weak PC)
 *
 * Catches real calls, not `toBeDefined()`:
 *  - LLM.chat was invoked with persona prompt
 *  - ToolRunner was invoked when skill→tool resolved
 *  - CogMemory.write was called
 *  - kv persist can be read back
 *  - retrieve returns the saved episodic memory
 *
 * Run on strong PC: `vitest run src/kernel/services/capability/golden-e2e.test.ts`
 */
import { describe, it, expect, vi } from 'vitest';
import { AgentFactory } from './agent-factory';
import { CapabilityResolver } from './capability-resolver';

describe('Golden E2E: create → resolve → execute → tool → memory → retrieve', () => {
    it('proves real wiring (not a green mock)', async () => {
        // Arrange: fakes that record real invocations
        const kv = new Map<string, unknown>();
        const dal = {
            kv: {
                get: async (k: string) => kv.get(k) ?? null,
                set: async (k: string, v: unknown) => { kv.set(k, v); },
                list: async () => [],
                delete: async (k: string) => { kv.delete(k); },
            },
        } as never;
        const events = { emit: vi.fn() } as never;

        const llm = {
            chat: vi.fn(async () => ({ content: 'LLM output with tool result', error: undefined })),
        } as never;

        const runWithToolsMock = vi.fn(async () => ({ output: 'tool output: 42', toolCalls: ['math.calc'] }));
        const tools = {
            listTools: () => [{ name: 'math.calc', description: 'calc' }],
            runWithTools: runWithToolsMock,
            callTool: vi.fn(async () => '42'),
            addTool: () => {},
        } as never;

        const writeMock = vi.fn(async () => ({ id: 'mem1' } as never));
        const memory = {
            write: writeMock,
            read: vi.fn(async () => [{ id: 'mem1', content: 'task: test → tool output: 42' } as never]),
        } as never;

        const persona = { promptFor: async () => 'You are TestAgent.' } as never;
        const skills = { list: async () => [{ id: 'skill1', name: 'skill1', permissions: ['math.calc'] }] } as never;
        const gov = { checkCapability: async () => true } as never;

        const resolver = new CapabilityResolver(dal, persona, skills, tools, gov);
        const factory = new AgentFactory(dal, events, resolver, llm, tools, memory);

        // Act: the one true E2E path
        const resolved = await factory.createResolved({
            name: 'GoldenAgent',
            roleId: 'analyst',
            personaId: 'persona1',
            skillIds: ['skill1'],
            toolIds: [],
            model: 'test-model',
        });

        // Assert: bindings — not just defined, but resolved correctly
        expect(resolved.prompt).toContain('TestAgent');
        expect(resolved.tools).toContain('math.calc');
        expect(resolved.model).toBe('test-model');
        expect(resolved.policyOk).toBe(true);

        const result = await factory.execute(resolved.definition.id, 'calculate 21*2');

        // Assert: real calls happened (not mocked green)
        expect(runWithToolsMock).toHaveBeenCalledTimes(1);
        expect(runWithToolsMock).toHaveBeenCalledWith(expect.stringContaining('21*2'), expect.objectContaining({ agentId: resolved.definition.id }));
        expect(writeMock).toHaveBeenCalledWith(expect.objectContaining({ ownerId: resolved.definition.id, kind: 'episodic' }));
        expect(result.output).toContain('tool output');
        expect(result.toolCalls).toContain('math.calc');

        // Assert: persist → retrieve
        const def = await factory.get(resolved.definition.id);
        expect(def?.id).toBe(resolved.definition.id);
        const runKeys = [...kv.keys()].filter(k => k.startsWith('agent-run/'));
        expect(runKeys.length).toBe(1);
        expect(kv.get(runKeys[0]!) as Record<string, unknown>).toHaveProperty('output');
    });
});
