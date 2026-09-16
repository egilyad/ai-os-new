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
