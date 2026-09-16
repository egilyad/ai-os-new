/**
 * Phase 41 — Rival parity 9 (Roadmap Phase N, §RIVALS9_COMPARE.md).
 *
 * Registers (no Dexie changes — kv + existing tables only):
 *   - `openClawService` (SOUL/AGENTS/HEARTBEAT import, channels, cron, ClawHub)
 *   - `dshService` (plugin registry, presets→toolkits, trajectory, subagents)
 *   - `manusService` (executor→verifier loop, schedules, replay export)
 *   - `gensparkService` (multi-model fanout, sheets CSV, long tasks)
 *
 * Additive — CharacterService, SkillMarket, Coordination, Crew/Graph/Council,
 * RunQueue, MobileAccess untouched (used as delegates).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { ICharacterService } from '../contracts/rivals2';
import type { ISkillMarketService } from '../contracts/ops';
import type { ICoordinationService } from '../contracts/interop';
import type { IRunQueueService } from '../contracts/rivals';
import type { ICrewService } from '../contracts/crew';
import type { IGraphService } from '../contracts/graph';
import type { ICouncilService } from '../contracts/council';
import type { IMobileAccessService } from '../contracts/ops';
import { OpenClawService } from '../services/rivals9/openclaw-service';
import { DshService } from '../services/rivals9/dsh-service';
import { ManusService } from '../services/rivals9/manus-service';
import { GensparkService } from '../services/rivals9/genspark-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

export const registerPhase41: Phase = ({ register }) => {
    register('openClawService', (c: IContainer) => {
        return new OpenClawService(
            dalOf(c),
            eventsOf(c),
            c.get<ICharacterService>('characterService'),
            c.has('skillMarketService') ? c.get<ISkillMarketService>('skillMarketService') : undefined,
        );
    });

    register('dshService', (c: IContainer) => {
        return new DshService(
            dalOf(c),
            eventsOf(c),
            c.has('runQueueService') ? c.get<IRunQueueService>('runQueueService') : undefined,
            c.has('coordinationService') ? c.get<ICoordinationService>('coordinationService') : undefined,
        );
    });

    register('manusService', (c: IContainer) => {
        return new ManusService(
            dalOf(c),
            eventsOf(c),
            c.get<ICrewService>('crewService'),
            c.has('graphService') ? c.get<IGraphService>('graphService') : undefined,
            c.has('councilService') ? c.get<ICouncilService>('councilService') : undefined,
            llmOf(c),
        );
    });

    register('gensparkService', (c: IContainer) => {
        return new GensparkService(
            eventsOf(c),
            llmOf(c),
            c.has('runQueueService') ? c.get<IRunQueueService>('runQueueService') : undefined,
            c.has('mobileAccessService') ? c.get<IMobileAccessService>('mobileAccessService') : undefined,
        );
    });
};
