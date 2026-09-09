/**
 * Phase 24 — Council / advanced debate (Roadmap Wave 2).
 *
 * Registers:
 *   - `councilRepository` (DAL over `councilSessions` + `councilMessages` + `councilVotes`)
 *   - `councilService` (Proposal → [FactGathering] → Debate → Consensus,
 *     Forum/Whisper, double-blind, multi-judge, audience voting)
 *
 * Additive layer over the Debate Runtime — no debate/forum/chat service touched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { CouncilRepository } from '../dal/council-repository';
import { CouncilService } from '../services/council/council-service';
import { CouncilServiceFacade } from '../services/council/council-service-facade';
import { LlmCouncilPort } from '../services/llm-bridge/llm-task-executor';

export const registerPhase24: Phase = ({ register }) => {
    register('councilRepository', (c: IContainer) => {
        return new CouncilRepository(c.get<DatabaseService>('database'));
    });

    register('councilService', (c: IContainer) => {
        const base = new CouncilService({
            repository: c.get<CouncilRepository>('councilRepository'),
            eventBus: c.get<IEventBus>('eventBus'),
            provenance: c.has('provenanceService') ? c.get<import('../contracts/trust').IProvenanceService>('provenanceService') : undefined,
        });
        // GAP E.1 — real LLM stance drafts + judge ballots when configured.
        if (c.has('llmClientService')) {
            base.setLlmPort(
                new LlmCouncilPort({ client: c.get<ILLMClientService>('llmClientService') }),
            );
        }
        // D4.2 facade → DebateEngine A (canonical) — pure mapper, old persistence kept read-only for rollback
        // D4.4a: use same WeightedJudgeEvaluator instance as DebateEngine (one evaluator, not two Maps)
        if (c.has('debateEngine')) {
            const debateEngine = c.get<import('../contracts/debate-runtime').IDebateEngine>('debateEngine');
            const weighted = c.has('weightedJudgeEvaluator') ? c.get<import('../services/council/weighted-judge-evaluator').WeightedJudgeEvaluator>('weightedJudgeEvaluator') : undefined;
            const database = c.has('database') ? c.get<import('../services/database-service').DatabaseService>('database') : undefined;
            const eventBus = c.get<IEventBus>('eventBus');
            return new CouncilServiceFacade(base, debateEngine, weighted, database, eventBus);
        }
        return base;
    });
};
