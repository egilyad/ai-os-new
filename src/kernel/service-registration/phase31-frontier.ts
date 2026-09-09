/**
 * Phase 31 — Frontier evals & exotic (Roadmap Phase D).
 *
 * Registers:
 *   - `frontierRepository` (DAL over 8 v31 tables)
 *   - `evalService` (benchmarks + A/B + red-team + matrix; executor =
 *     deterministic echo unless Graph delegate wired)
 *   - `simulationService` (society/economy/org sims + norms)
 *   - `frontierOpsService` (org charters + intent plans materialized as
 *     real graphs + multimodal registry)
 *
 * Additive — EvalDatasetService and all runtimes untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IGraphService } from '../contracts/graph';
import { FrontierRepository } from '../dal/frontier-repository';
import { EvalService } from '../services/frontier/eval-service';
import { SimulationService } from '../services/frontier/simulation-service';
import { FrontierOpsService } from '../services/frontier/frontier-ops-service';
import { LlmFrontierExecutor } from '../services/llm-bridge/llm-task-executor';

export const registerPhase31: Phase = ({ register }) => {
    register('frontierRepository', (c: IContainer) => {
        return new FrontierRepository(c.get<DatabaseService>('database'));
    });

    register('evalService', (c: IContainer) => {
        const svc = new EvalService(
            c.get<FrontierRepository>('frontierRepository'),
            c.get<IEventBus>('eventBus'),
        );
        // GAP E.1 — benchmark cases run on a real model when configured.
        if (c.has('llmClientService')) {
            svc.setExecutor(
                new LlmFrontierExecutor({ client: c.get<ILLMClientService>('llmClientService') }),
            );
        }
        return svc;
    });

    register('simulationService', (c: IContainer) => {
        return new SimulationService(c.get<FrontierRepository>('frontierRepository'));
    });

    register('frontierOpsService', (c: IContainer) => {
        const graphs = c.get<IGraphService>('graphService');
        return new FrontierOpsService(
            c.get<FrontierRepository>('frontierRepository'),
            c.get<IEventBus>('eventBus'),
            {
                buildGraph: async (mode: string, topic: string) => {
                    const def = await graphs.buildModeGraph(
                        (mode === 'crew' || mode === 'council' ? mode : 'graph') as 'graph',
                        { topic },
                    );
                    return def.id;
                },
            },
        );
    });
};
