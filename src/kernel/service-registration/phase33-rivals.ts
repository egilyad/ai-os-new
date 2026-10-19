/**
 * Phase 33 — Rival parity (Roadmap Phase F, §RIVALS_COMPARE.md).
 *
 * Registers:
 *   - `rivalRepository` (DAL over agentLoops + groupChats + memoryBlocks + runQueue)
 *   - `groupChatService` (AutoGen-style speaker selection + nested chats)
 *   - `guardrailService` (Swarm-style tripwires, stateless)
 *   - `memoryBlocksService` (Letta-style core blocks; registers
 *     memory.append/search/recall tools into ToolRunner)
 *   - `sopService` (MetaGPT-style SOP pipelines)
 *   - `autonomyService` (AutoGPT goal loop + BabyAGI task queue)
 *   - `runQueueService` (SuperAGI-style queue + toolkits)
 *   - `plannerService` (SK-style strategies + filters)
 *   - `dyadService` (CAMEL-style role-play dyads)
 *
 * Additive — ConversationCore, ToolRunner, SkillMarket, Crew/Graph untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { ICrewService } from '../contracts/crew';
import type { IGraphService } from '../contracts/graph';
import type { IEvalService } from '../contracts/frontier';
import type { IToolRunnerService } from '../contracts/parity';
import type { ILtMemoryService } from '../contracts/persona';
import type { MemoryRelation } from '../types/persona-types';
import type { DataAccessLayer } from '../dal/types';
import { RivalRepository } from '../dal/rival-repository';
import { GroupChatService } from '../services/rivals/groupchat-service';
import { GuardrailService } from '../services/rivals/guardrail-service';
import { MemoryBlocksService } from '../services/rivals/memory-blocks-service';
import { SopService } from '../services/rivals/sop-service';
import { AutonomyService } from '../services/rivals/autonomy-service';
import { RunQueueService } from '../services/rivals/runqueue-service';
import { PlannerService } from '../services/rivals/planner-service';
import { DyadService } from '../services/rivals/dyad-service';
import type { MemoryBlock } from '../types/rival-types';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

export const registerPhase33: Phase = ({ register }) => {
    register('rivalRepository', (c: IContainer) => {
        return new RivalRepository(c.get<DatabaseService>('database'));
    });

    register('groupChatService', (c: IContainer) => {
        return new GroupChatService(
            c.get<RivalRepository>('rivalRepository'),
            c.get<IEventBus>('eventBus'),
            llmOf(c),
        );
    });

    register('guardrailService', (c: IContainer) => {
        return new GuardrailService(
            c.get<IEventBus>('eventBus'),
            c.has('dal') ? c.get<DataAccessLayer>('dal') : undefined,
        );
    });

    register('memoryBlocksService', (c: IContainer) => {
        const svc = new MemoryBlocksService(
            c.get<RivalRepository>('rivalRepository'),
            c.get<IEventBus>('eventBus'),
        );
        // Letta-style agent-callable memory tools (best-effort, never throws).
        try {
            if (c.has('toolRunnerService')) {
                const runner = c.get<IToolRunnerService>('toolRunnerService');
                const str = (v: unknown): string => (typeof v === 'string' ? v : '');
                runner.addTool({
                    name: 'memory.append',
                    description: 'Append text to your core memory block (human/persona/system).',
                    parameters: {
                        type: 'object',
                        properties: {
                            section: { type: 'string' },
                            text: { type: 'string' },
                        },
                        required: ['section', 'text'],
                    },
                    run: async (args) => {
                        const section = str(args['section']) as MemoryBlock['section'];
                        if (section !== 'human' && section !== 'persona' && section !== 'system') {
                            throw new Error('section must be human|persona|system');
                        }
                        const b = await svc.appendBlock('agent', section, str(args['text']));
                        return `appended (${b.content.length}/${b.charLimit} chars)`;
                    },
                });
                runner.addTool({
                    name: 'memory.recall',
                    description: 'Read your core memory blocks.',
                    parameters: { type: 'object', properties: {} },
                    run: async () => svc.corePrompt('agent') || '(empty core memory)',
                });
                runner.addTool({
                    name: 'memory.related',
                    description:
                        'Associative (Personalized PageRank) recall: memories most related to a given memory id.',
                    parameters: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            limit: { type: 'number' },
                            asOf: { type: 'number' },
                        },
                        required: ['id'],
                    },
                    run: async (args) => {
                        if (!c.has('ltMemoryService')) return '(long-term memory unavailable)';
                        const lt = c.get<ILtMemoryService>('ltMemoryService');
                        const id = str(args['id']);
                        if (!id) throw new Error('id is required');
                        const limit = typeof args['limit'] === 'number' ? args['limit'] : 10;
                        const asOf = typeof args['asOf'] === 'number' ? args['asOf'] : undefined;
                        const hits = await lt.associativeRecall(id, {
                            limit,
                            ...(asOf !== undefined ? { asOf } : {}),
                        });
                        if (hits.length === 0) return 'no related memories';
                        return hits
                            .map(
                                (h, i) =>
                                    `${i + 1}. [${h.memory.tier}] ${h.memory.content.slice(0, 240)} (${h.score.toFixed(4)})`,
                            )
                            .join('\n');
                    },
                });
                runner.addTool({
                    name: 'memory.remember',
                    description:
                        'Store a durable long-term memory (recall/archival tier) for later search/recall.',
                    parameters: {
                        type: 'object',
                        properties: {
                            content: { type: 'string' },
                            tier: { type: 'string' },
                            tags: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['content'],
                    },
                    run: async (args) => {
                        if (!c.has('ltMemoryService')) return '(long-term memory unavailable)';
                        const lt = c.get<ILtMemoryService>('ltMemoryService');
                        const content = str(args['content']);
                        if (!content) throw new Error('content is required');
                        const tier = str(args['tier']);
                        const tags = Array.isArray(args['tags'])
                            ? (args['tags'] as unknown[]).map(String)
                            : undefined;
                        const m = await lt.remember({
                            ownerId: 'agent',
                            content,
                            ...(tier === 'core' || tier === 'recall' || tier === 'archival'
                                ? { tier }
                                : {}),
                            ...(tags && tags.length > 0 ? { tags } : {}),
                        });
                        return `remembered ${m.id} [${m.tier}]`;
                    },
                });
                runner.addTool({
                    name: 'memory.search',
                    description: 'Search your durable long-term memory by keyword.',
                    parameters: {
                        type: 'object',
                        properties: { query: { type: 'string' }, limit: { type: 'number' } },
                        required: ['query'],
                    },
                    run: async (args) => {
                        if (!c.has('ltMemoryService')) return '(long-term memory unavailable)';
                        const lt = c.get<ILtMemoryService>('ltMemoryService');
                        const query = str(args['query']);
                        if (!query) throw new Error('query is required');
                        const limit = typeof args['limit'] === 'number' ? args['limit'] : 5;
                        const hits = await lt.recall('agent', query, limit);
                        if (hits.length === 0) return 'no memories found';
                        return hits
                            .map((m, i) => `${i + 1}. ${m.id} [${m.tier}] ${m.content.slice(0, 240)}`)
                            .join('\n');
                    },
                });
                runner.addTool({
                    name: 'memory.link',
                    description:
                        'Link two long-term memories (supports/contradicts/elaborates/caused_by/relates).',
                    parameters: {
                        type: 'object',
                        properties: {
                            from: { type: 'string' },
                            to: { type: 'string' },
                            relation: { type: 'string' },
                        },
                        required: ['from', 'to'],
                    },
                    run: async (args) => {
                        if (!c.has('ltMemoryService')) return '(long-term memory unavailable)';
                        const lt = c.get<ILtMemoryService>('ltMemoryService');
                        const from = str(args['from']);
                        const to = str(args['to']);
                        if (!from || !to) throw new Error('from and to are required');
                        const allowed: MemoryRelation[] = [
                            'supports',
                            'contradicts',
                            'elaborates',
                            'caused_by',
                            'relates',
                        ];
                        const rel = str(args['relation']);
                        const relation = (allowed as string[]).includes(rel)
                            ? (rel as MemoryRelation)
                            : 'relates';
                        const l = await lt.link(from, to, relation);
                        return `linked ${l.id} (${from} ${relation} ${to})`;
                    },
                });
            }
        } catch {
            // offline / partial container — memory tools simply unavailable
        }
        return svc;
    });

    register('sopService', (c: IContainer) => {
        return new SopService(
            c.get<RivalRepository>('rivalRepository'),
            c.get<IEventBus>('eventBus'),
            llmOf(c),
        );
    });

    register('autonomyService', (c: IContainer) => {
        return new AutonomyService({
            repo: c.get<RivalRepository>('rivalRepository'),
            events: c.get<IEventBus>('eventBus'),
            llm: llmOf(c),
            tools: c.has('toolRunnerService')
                ? c.get<IToolRunnerService>('toolRunnerService')
                : undefined,
        });
    });

    register('runQueueService', (c: IContainer) => {
        const svc = new RunQueueService({
            repo: c.get<RivalRepository>('rivalRepository'),
            events: c.get<IEventBus>('eventBus'),
            crews: c.get<ICrewService>('crewService'),
            graphs: c.get<IGraphService>('graphService'),
        });
        // J.1 — eval queue items run real benchmarks when available.
        if (c.has('evalService')) {
            svc.setEvals(c.get<IEvalService>('evalService'));
        }
        return svc;
    });

    register('plannerService', (c: IContainer) => {
        return new PlannerService(
            c.get<IEventBus>('eventBus'),
            llmOf(c),
            c.has('toolRunnerService')
                ? c.get<IToolRunnerService>('toolRunnerService')
                : undefined,
            c.has('dal') ? c.get<DataAccessLayer>('dal') : undefined,
        );
    });

    register('dyadService', (c: IContainer) => {
        return new DyadService(
            c.get<RivalRepository>('rivalRepository'),
            c.get<IEventBus>('eventBus'),
            llmOf(c),
        );
    });
};
