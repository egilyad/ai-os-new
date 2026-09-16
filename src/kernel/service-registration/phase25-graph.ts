/**
 * Phase 25 — State Graph runtime (Roadmap Wave 3).
 *
 * Registers:
 *   - `graphRepository` (DAL over `graphs` + `graphRuns` + `graphCheckpoints` + `graphDecisions`)
 *   - `graphService` (nodes + edges + conditional routing, checkpoints,
 *     time-travel, HITL, reflection, decision log, 6 orchestration modes)
 *
 * Delegates wire the real Wave 1 / Wave 2 services so graph nodes execute
 * for real: crew nodes → CrewService, council nodes → CouncilService,
 * forge drafts → AgentForgeService. All lazy via container (no new buses).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { ICrewService, IAgentForgeService } from '../contracts/crew';
import type { ICouncilService } from '../contracts/council';
import { GraphRepository } from '../dal/graph-repository';
import { GraphService } from '../services/graph/graph-service';
import { LlmGraphPort } from '../services/llm-bridge/llm-task-executor';

export const registerPhase25: Phase = ({ register }) => {
    register('graphRepository', (c: IContainer) => {
        return new GraphRepository(c.get<DatabaseService>('database'));
    });

    register('graphService', (c: IContainer) => {
        const crew = c.get<ICrewService>('crewService');
        const council = c.get<ICouncilService>('councilService');
        const forge = c.get<IAgentForgeService>('agentForgeService');
        const svc = new GraphService({
            repository: c.get<GraphRepository>('graphRepository'),
            eventBus: c.get<IEventBus>('eventBus'),
            delegates: {
                runCrew: async (crewId: string, task: string) => {
                    const result = await crew.startCrew(crewId);
                    const outs = Object.values(result.outputs);
                    return outs.length > 0
                        ? `Crew ${crewId} ${result.status}: ${task}\n${outs.join('\n---\n').slice(0, 2000)}`
                        : `Crew ${crewId} ${result.status}: ${task}`;
                },
                runCouncil: async (topic: string) => {
                    const session = await council.createSession({ topic });
                    let current = session;
                    let guard = 5;
                    while (
                        current.phase !== 'consensus' &&
                        current.phase !== 'completed' &&
                        guard-- > 0
                    ) {
                        current = await council.advancePhase(session.id);
                    }
                    const done = await council.conclude(session.id);
                    return `Council on "${topic}": winner ${done.winnerId ?? 'draw'}. ${done.summary ?? ''}`;
                },
                forgeDraft: async (goal: string) => {
                    const proposal = await forge.propose({ goal });
                    return (
                        `Forge draft for "${goal}": ${proposal.roles.length} roles, ` +
                        `${proposal.tasks.length} tasks (${proposal.process}). ${proposal.reasoning}`
                    );
                },
            },
        });
        // GAP E.1 — real LLM task nodes + reflections when configured.
        if (c.has('llmClientService')) {
            svc.setLlmPort(
                new LlmGraphPort({ client: c.get<ILLMClientService>('llmClientService') }),
            );
        }
        return svc;
    });
};
