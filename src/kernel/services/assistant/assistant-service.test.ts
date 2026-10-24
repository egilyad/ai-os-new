import { describe, it, expect, vi } from 'vitest';
import { AssistantService } from './assistant-service';
import { AssistantActionRegistry } from './assistant-action-registry';
import { AssistantViewService } from './assistant-view-service';
import type { ProjectKnowledgeService } from './project-knowledge-service';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IToolApprovalService } from '../../contracts/tool-approval';
import type { AgentPermissionService } from '../permissions/permission-service';
import type { IEventBus } from '../../types/interfaces';

function makeRegistry() {
    const registry = new AssistantActionRegistry();
    registry.register({
        id: 'system.find',
        group: 'research',
        description: 'find',
        parameters: { type: 'object', properties: { query: { type: 'string' } } },
        action: 'tool:read',
        run: async (args) => ({
            ok: true,
            detail: `found ${String(args['query'])}`,
            evidence: 'panel memory',
            verification: 'verified',
        }),
    });
    registry.register({
        id: 'agents.spawn',
        group: 'work',
        description: 'spawn',
        parameters: { type: 'object', properties: { name: { type: 'string' } } },
        action: 'tool:write',
        run: async () => ({ ok: true, detail: 'spawned', evidence: 'agentId: a1' }),
    });
    return registry;
}

function makeKnowledge(): ProjectKnowledgeService {
    return {
        context: vi.fn(async () => ({
            hits: [],
            markdown: '[SYSTEM KNOWLEDGE]\n- panel "memory" route /memory',
        })),
    } as unknown as ProjectKnowledgeService;
}

function makeEvents(): IEventBus {
    return { emit: vi.fn(), on: vi.fn(), off: vi.fn(), emitOnce: vi.fn() } as unknown as IEventBus;
}

function llmStub(responses: Array<{ content: string; toolCalls?: unknown[] }>) {
    const calls: Array<{ messages: unknown[]; options: Record<string, unknown> }> = [];
    const sendMessage = vi.fn(async (messages: unknown[], options: Record<string, unknown>) => {
        calls.push({ messages, options });
        const next = responses.shift() ?? { content: '' };
        return {
            content: next.content,
            toolCalls: next.toolCalls,
            latency: 1,
            tokens: 1,
        };
    });
    return { service: { sendMessage } as unknown as ILLMClientService, calls, sendMessage };
}

describe('AssistantService', () => {
    it('answers without tools and emits chunks plus done', async () => {
        const llm = llmStub([{ content: 'Панель памяти — /memory.' }]);
        const events = makeEvents();
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events,
            agentId: 'assistant',
        });

        const result = await service.ask({ text: 'где память?' });
        expect(result.content).toContain('/memory');
        expect(result.toolCalls).toEqual([]);
        expect(events.emit).toHaveBeenCalledWith(
            'assistant:done',
            expect.objectContaining({ content: 'Панель памяти — /memory.' }),
        );
    });

    it('injects the four context layers into the prompt', async () => {
        const llm = llmStub([{ content: 'ok' }]);
        const memory = { recall: vi.fn(async () => [{ content: 'решили X', metadata: { type: 'decision' } }]) };
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            memory,
        });

        await service.ask({ text: 'что решили?', sessionId: 's1' });
        const prompt = String(
            (llm.calls[0]!.messages as Array<{ role: string; content: string }>)[1]!.content,
        );
        expect(prompt).toContain('[SYSTEM KNOWLEDGE]');
        expect(prompt).toContain('[RECALLED MEMORY]');
        expect(prompt).toContain('решили X');
        expect(prompt).toContain('[LIVE STATE]');
        expect(prompt).toContain('session: s1');
    });

    it('injects wiki brain hits into the context', async () => {
        const llm = llmStub([{ content: 'ok' }]);
        const wiki = {
            search: vi.fn(async () => [
                { slug: 'memory', title: 'Memory', snippet: 'панель памяти: /memory' },
            ]),
        };
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            wiki,
        });

        await service.ask({ text: 'что такое память?', sessionId: 's2' });
        const prompt = String(
            (llm.calls[0]!.messages as Array<{ role: string; content: string }>)[1]!.content,
        );
        expect(prompt).toContain('[WIKI BRAIN]');
        expect(prompt).toContain('[[memory]]');
        expect(wiki.search).toHaveBeenCalledWith('что такое память?');
    });

    it('tells the model which screen the operator is looking at', async () => {
        const llm = llmStub([{ content: 'ok' }]);
        const view = new AssistantViewService();
        view.setView({ route: '/memory', panelId: 'memory' });
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            view,
        });

        await service.ask({ text: 'что это за экран?' });
        const prompt = String(
            (llm.calls[0]!.messages as Array<{ role: string; content: string }>)[1]!.content,
        );
        expect(prompt).toContain('[CURRENT VIEW]');
        expect(prompt).toContain('route: /memory');
    });

    it('executes a read action without asking and feeds the result back', async () => {
        const llm = llmStub([
            {
                content: '',
                toolCalls: [
                    {
                        id: 'c1',
                        type: 'function',
                        function: { name: 'system.find', arguments: '{"query":"память"}' },
                    },
                ],
            },
            { content: 'Нашёл: /memory' },
        ]);
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
        });

        const result = await service.ask({ text: 'найди память' });
        expect(result.toolCalls).toEqual(['system.find']);
        expect(result.rounds).toBe(2);

        const secondCall = llm.calls[1]!.messages as Array<{ role: string; content: string }>;
        const toolMessage = secondCall.find((m) => m.role === 'tool');
        expect(toolMessage?.content).toContain('found память');
        expect(toolMessage?.content).toContain('evidence: panel memory');
    });

    it('asks the human before a write action and respects a denial', async () => {
        const llm = llmStub([
            {
                content: '',
                toolCalls: [
                    {
                        id: 'c1',
                        type: 'function',
                        function: { name: 'agents.spawn', arguments: '{"name":"Coder"}' },
                    },
                ],
            },
            { content: 'Не разрешили — не создал.' },
        ]);
        const request = vi.fn(async () => 'deny' as const);
        const permissions = {
            evaluate: vi.fn(async () => ({
                effect: 'ask',
                reason: 'guarded mode asks for writes',
            })),
        };
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            permissionService: permissions as unknown as AgentPermissionService,
            approvalService: { request } as unknown as IToolApprovalService,
        });

        const result = await service.ask({ text: 'создай агента Coder' });
        expect(request).toHaveBeenCalledWith(
            expect.objectContaining({ toolId: 'agents.spawn', agentId: 'assistant' }),
        );
        const toolMessage = (llm.calls[1]!.messages as Array<{ role: string; content: string }>).find(
            (m) => m.role === 'tool',
        );
        expect(toolMessage?.content).toContain('did not allow');
        expect(result.content).toContain('не создал');
    });

    it('executes a write action after the human allows it', async () => {
        const llm = llmStub([
            {
                content: '',
                toolCalls: [
                    {
                        id: 'c1',
                        type: 'function',
                        function: { name: 'agents.spawn', arguments: '{"name":"Coder"}' },
                    },
                ],
            },
            { content: 'Создал.' },
        ]);
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            permissionService: {
                evaluate: vi.fn(async () => ({ effect: 'ask', reason: 'ask' })),
            } as unknown as AgentPermissionService,
            approvalService: {
                request: vi.fn(async () => 'allow' as const),
            } as unknown as IToolApprovalService,
        });

        const result = await service.ask({ text: 'создай агента' });
        expect(result.toolCalls).toEqual(['agents.spawn']);
        const toolMessage = (llm.calls[1]!.messages as Array<{ role: string; content: string }>).find(
            (m) => m.role === 'tool',
        );
        expect(toolMessage?.content).toContain('agentId: a1');
    });

    it('stops on a denial from the permission engine without asking', async () => {
        const llm = llmStub([
            {
                content: '',
                toolCalls: [
                    {
                        id: 'c1',
                        type: 'function',
                        function: { name: 'agents.spawn', arguments: '{"name":"X"}' },
                    },
                ],
            },
            { content: 'Запрещено.' },
        ]);
        const request = vi.fn();
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            permissionService: {
                evaluate: vi.fn(async () => ({ effect: 'deny', reason: 'read-only' })),
            } as unknown as AgentPermissionService,
            approvalService: { request } as unknown as IToolApprovalService,
        });

        await service.ask({ text: 'создай' });
        expect(request).not.toHaveBeenCalled();
        const toolMessage = (llm.calls[1]!.messages as Array<{ role: string; content: string }>).find(
            (m) => m.role === 'tool',
        );
        expect(toolMessage?.content).toContain('Permission denied');
    });

    it('falls back to the first usable key when no provider is configured', async () => {
        const llm = llmStub([{ content: 'ok' }]);
        const resolveRoute = vi.fn(() => ({ provider: 'OpenRouter', model: 'openai/gpt-4o' }));
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            resolveRoute,
        });

        await service.ask({ text: 'привет' });
        expect(resolveRoute).toHaveBeenCalled();
        expect(llm.calls[0]!.options).toMatchObject({
            provider: 'OpenRouter',
            model: 'openai/gpt-4o',
        });
    });

    it('prefers the session route and ignores an "auto" default', async () => {        const llm = llmStub([{ content: 'a' }, { content: 'b' }]);
        const resolveRoute = vi.fn(() => ({ provider: 'OpenRouter', model: 'm-1' }));
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            provider: 'auto',
            resolveRoute,
        });

        await service.ask({ text: 'раз', provider: 'OpenAI', model: 'gpt-5' });
        expect(resolveRoute).not.toHaveBeenCalled();
        expect(llm.calls[0]!.options).toMatchObject({ provider: 'OpenAI', model: 'gpt-5' });

        await service.ask({ text: 'два' });
        expect(resolveRoute).toHaveBeenCalledTimes(1);
        expect(llm.calls[1]!.options).toMatchObject({ provider: 'OpenRouter', model: 'm-1' });
    });

    it('tells the model who it is and seeds its guarded profile once', async () => {
        const llm = llmStub([{ content: 'a' }, { content: 'b' }]);
        const state = { mode: 'guarded' as string, preset: 'guarded' as string };
        const permissions = {
            hasState: vi.fn(() => false),
            setMode: vi.fn(async (_id: string, mode: string) => {
                state.mode = mode;
            }),
            getState: vi.fn(() => ({
                agentId: 'assistant',
                mode: state.mode,
                preset: state.preset,
                rules: [],
                consecutiveDenials: 0,
                updatedAt: 0,
            })),
            evaluate: vi.fn(async () => ({ effect: 'allow', reason: 'read' })),
        } as unknown as AgentPermissionService;
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            agentLabel: 'Project Assistant',
            permissionService: permissions,
        });

        await service.ask({ text: 'кто ты?' });
        expect(permissions.setMode).toHaveBeenCalledWith('assistant', 'guarded');
        const prompt = String(
            (llm.calls[0]!.messages as Array<{ role: string; content: string }>)[1]!.content,
        );
        expect(prompt).toContain('[SELF]');
        expect(prompt).toContain('Project Assistant');
        expect(prompt).toContain('permission mode: guarded');

        await service.ask({ text: 'ещё' });
        expect(permissions.setMode).toHaveBeenCalledTimes(1);
    });

    it('describes itself with node, status and permission mode', () => {
        const service = new AssistantService({
            llm: llmStub([]).service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            agentLabel: 'Project Assistant',
            permissionService: {
                getState: () => ({
                    agentId: 'assistant',
                    mode: 'guarded',
                    preset: 'guarded',
                    rules: [],
                    consecutiveDenials: 2,
                    updatedAt: 0,
                }),
            } as unknown as AgentPermissionService,
        });

        expect(service.describeSelf()).toMatchObject({
            id: 'assistant',
            name: 'Project Assistant',
            mode: 'guarded',
            preset: 'guarded',
            denials: 2,
        });
    });

    it('stops acting while paused in the admin, but still answers', async () => {
        const llm = llmStub([
            {
                content: '',
                toolCalls: [
                    {
                        id: 'c1',
                        type: 'function',
                        function: { name: 'system.find', arguments: '{"query":"память"}' },
                    },
                ],
            },
            { content: 'Я на паузе, поэтому не искал.' },
        ]);
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events: makeEvents(),
            agentId: 'assistant',
            lifecycle: { status: () => 'paused' },
        });

        const result = await service.ask({ text: 'найди память' });
        expect(result.content).toContain('паузе');
        const toolMessage = (llm.calls[1]!.messages as Array<{ role: string; content: string }>).find(
            (m) => m.role === 'tool',
        );
        expect(toolMessage?.content).toContain('paused');
    });

    it('reports its turns to the per-agent statistics', async () => {
        const llm = llmStub([{ content: 'готово' }]);
        const events = makeEvents();
        const service = new AssistantService({
            llm: llm.service,
            actions: makeRegistry(),
            knowledge: makeKnowledge(),
            events,
            agentId: 'assistant',
            resolveRoute: () => ({ provider: 'OpenRouter', model: 'openai/gpt-4o' }),
        });

        await service.ask({ text: 'привет' });
        expect(events.emit).toHaveBeenCalledWith(
            'cognitive:step:completed',
            expect.objectContaining({
                nodeId: 'assistant',
                status: 'done',
                provider: 'OpenRouter',
                model: 'openai/gpt-4o',
            }),
        );
    });
});
