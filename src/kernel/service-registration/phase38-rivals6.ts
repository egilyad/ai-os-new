/**
 * Phase 38 — Rival parity 6 (Roadmap Phase K, §RIVALS6_COMPARE.md).
 *
 * Registers (no Dexie changes — kv + existing tables only):
 *   - `n8nService` (workflows + safe transforms + execution log)
 *   - `makeService` (filters + iterators + aggregators + error routes)
 *   - `zapierService` (trigger → actions + paths + delays)
 *   - `temporalService` (durable steps + signals + retries)
 *   - `assetService` (data assets + provenance lineage + freshness)
 *   - `sensorService` (poke-until-condition)
 *   - `voiceService` (calls + transcript + tool turns)
 *   - `supportService` (tickets + macros + drafts + handoff)
 *   - `verifyService` (review queue + gaps)
 *   - `deckService` (outline → slides → markdown)
 *
 * Additive — ToolRunner, KnowledgeService, Gateway, Provenance, Planner,
 * Crew/Graph untouched (used as delegates).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import type { IProvenanceService } from '../contracts/trust';
import type { IRagService } from '../contracts/rivals2';
import type { IMobileAccessService } from '../contracts/ops';
import { N8nService } from '../services/rivals6/n8n-service';
import { MakeService } from '../services/rivals6/make-service';
import { ZapierService } from '../services/rivals6/zapier-service';
import { TemporalService } from '../services/rivals6/temporal-service';
import { AssetService } from '../services/rivals6/asset-service';
import { SensorService } from '../services/rivals6/sensor-service';
import { VoiceAgentService } from '../services/rivals6/voice-service';
import { SupportService } from '../services/rivals6/support-service';
import { VerifyService } from '../services/rivals6/verify-service';
import { DeckService } from '../services/rivals6/deck-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

function toolsOf(c: IContainer): IToolRunnerService | undefined {
    return c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined;
}

export const registerPhase38: Phase = ({ register }) => {
    register('n8nService', (c: IContainer) => {
        return new N8nService(dalOf(c), eventsOf(c), toolsOf(c));
    });

    register('makeService', (c: IContainer) => {
        return new MakeService(eventsOf(c), toolsOf(c));
    });

    register('zapierService', (c: IContainer) => {
        return new ZapierService(dalOf(c), eventsOf(c), toolsOf(c));
    });

    register('temporalService', (c: IContainer) => {
        return new TemporalService(dalOf(c), eventsOf(c), toolsOf(c));
    });

    register('assetService', (c: IContainer) => {
        return new AssetService(
            dalOf(c),
            eventsOf(c),
            toolsOf(c),
            c.has('provenanceService') ? c.get<IProvenanceService>('provenanceService') : undefined,
        );
    });

    register('sensorService', (c: IContainer) => {
        return new SensorService(eventsOf(c), toolsOf(c));
    });

    register('voiceService', (c: IContainer) => {
        return new VoiceAgentService(dalOf(c), eventsOf(c), llmOf(c), toolsOf(c));
    });

    register('supportService', (c: IContainer) => {
        return new SupportService(
            dalOf(c),
            eventsOf(c),
            c.has('ragService') ? c.get<IRagService>('ragService') : undefined,
            c.has('mobileAccessService') ? c.get<IMobileAccessService>('mobileAccessService') : undefined,
        );
    });

    register('verifyService', (c: IContainer) => {
        return new VerifyService(dalOf(c));
    });

    register('deckService', (c: IContainer) => {
        return new DeckService(llmOf(c));
    });
};
