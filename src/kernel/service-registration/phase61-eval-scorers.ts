/**
 * Phase 61 — Eval Scorers (GAP G8, STATIC GAP CLOSURE).
 *
 * Registers (additive, no migration):
 *   - scorerRegistryService (contains/exact/token_f1 + registry)
 *   - llmJudgeService (stub heuristic, PROVIDER-PENDING until LLM wired)
 *
 * Real LLM judge = BLOCKED-RUNTIME until evaluated on real benchmarks.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { ScorerRegistryService } from '../services/eval/scorer-registry-service';
import { LlmJudgeService } from '../services/eval/llm-judge-service';

export const registerPhase61: Phase = ({ register }) => {
    register('scorerRegistryService', (c: IContainer) => new ScorerRegistryService(c.get<IEventBus>('eventBus')));

    register('llmJudgeService', (c: IContainer) => {
        const llm = c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
        return new LlmJudgeService({ events: c.get<IEventBus>('eventBus'), llm });
    });
};
