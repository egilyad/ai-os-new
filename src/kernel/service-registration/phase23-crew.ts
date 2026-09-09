/**
 * Phase 23 — Crew + Task + Process + Agent Forge (Roadmap Wave 1).
 *
 * Registers:
 *   - `crewRepository` (DAL wrapper over Dexie `crews` + `crewTasks`)
 *   - `crewService` (CrewAI-style teams, EventBus only, local-first)
 *   - `agentForgeService` (goal -> Crew draft proposer)
 *
 * Depends on phase 0 (database + eventBus) and DAL. No LLM dependency —
 * CrewService runs on a deterministic executor until later waves wire
 * a real TaskExecutor.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { CrewRepository } from '../dal/crew-repository';
import { CrewService } from '../services/crew/crew-service';
import { AgentForgeService } from '../services/crew/agent-forge-service';
import { LlmCrewExecutor } from '../services/llm-bridge/llm-task-executor';

export const registerPhase23: Phase = ({ register }) => {
    register('crewRepository', (c: IContainer) => {
        return new CrewRepository(c.get<DatabaseService>('database'));
    });

    register('crewService', (c: IContainer) => {
        const svc = new CrewService({
            repository: c.get<CrewRepository>('crewRepository'),
            eventBus: c.get<IEventBus>('eventBus'),
        });
        // GAP E.1 — real LLM execution when a provider is configured;
        // otherwise the deterministic echo executor stays (offline-first).
        // GAP E.3 — trained per-role guidance is appended to system prompts.
        // 6.1 — crew tool-loop via ToolRunner when wired.
        if (c.has('llmClientService')) {
            const training = c.has('trainingService')
                ? c.get<{ guideFor(role: string): Promise<string> }>('trainingService')
                : undefined;
            const toolRunner = c.has('toolRunnerService') ? c.get<{ runWithTools: (p: string, o?: unknown) => Promise<{ output: string }> }>('toolRunnerService') : undefined;
            const toolCheck = c.has('toolGovernanceService') ? c.get<{ check: (a: string, t: string) => Promise<boolean> }>('toolGovernanceService') : undefined;
            svc.setExecutor(
                new LlmCrewExecutor({
                    client: c.get<ILLMClientService>('llmClientService'),
                    guideFor: training ? (role) => training.guideFor(role) : undefined,
                    toolRunner: toolRunner as never,
                    toolCheck: toolCheck ? (a, t) => toolCheck.check(a, t) : undefined,
                }),
            );
        }
        return svc;
    });

    register('agentForgeService', (c: IContainer) => {
        return new AgentForgeService(
            c.get<CrewService>('crewService'),
            c.get<IEventBus>('eventBus'),
        );
    });
};
