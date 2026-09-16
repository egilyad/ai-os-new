/**
 * Phase 39 — Debate plus (Roadmap Phase L, §RIVALS7_COMPARE.md).
 *
 * Registers (no Dexie changes — kv + council tables only):
 *   - `formatService` (oxford/munk/LD/popper/deliberative/adversarial
 *     formats over the real CouncilService + RagService briefing)
 *   - `argTechService` (claim mining, Dung grounded/preferred, Toulmin
 *     cards, Brier calibration, Kialo claim trees)
 *
 * Additive — CouncilService, RagService, LLM bridge untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { ICouncilService } from '../contracts/council';
import type { IRagService } from '../contracts/rivals2';
import { FormatService } from '../services/debateplus/format-service';
import { ArgTechService } from '../services/debateplus/argtech-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

export const registerPhase39: Phase = ({ register }) => {
    register('formatService', (c: IContainer) => {
        return new FormatService(
            c.get<DataAccessLayer>('dal'),
            c.get<IEventBus>('eventBus'),
            c.get<ICouncilService>('councilService'),
            c.has('ragService') ? c.get<IRagService>('ragService') : undefined,
        );
    });

    register('argTechService', (c: IContainer) => {
        return new ArgTechService(
            c.get<DataAccessLayer>('dal'),
            c.get<IEventBus>('eventBus'),
            llmOf(c),
        );
    });
};
