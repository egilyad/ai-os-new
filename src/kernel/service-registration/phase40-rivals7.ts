/**
 * Phase 40 — Rival parity 8 (Roadmap Phase M, §RIVALS8_COMPARE.md).
 *
 * Registers (no Dexie changes — kv only):
 *   - `forumPlusService` (polls + solved + trust levels + badges)
 *   - `decisionService` (proposals + dot-vote + Borda ranked choice)
 *   - `polisService` (opinion clustering + consensus statements)
 *   - `reflexionService` (actor + verbal reflection + retry memory)
 *   - `totService` (BFS thought search + prune)
 *   - `selfConService` (N-path majority vote)
 *   - `soarService` (WM + productions + impasse + chunking)
 *   - `atomService` (hypergraph + PLN inheritance)
 *   - `meterService` (counters/gauges/histograms + alert rules)
 *   - `errInboxService` (fingerprint error groups)
 *
 * Additive — Forum, Council, ToolRunner, Timeline, Eval untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IToolRunnerService } from '../contracts/parity';
import type { IMobileAccessService } from '../contracts/ops';
import { ForumPlusService } from '../services/rivals7/forumplus-service';
import { DecisionService } from '../services/rivals7/decision-service';
import { PolisService } from '../services/rivals7/polis-service';
import { ReflexionService } from '../services/rivals7/reflexion-service';
import { TotService } from '../services/rivals7/tot-service';
import { SelfConsistencyService } from '../services/rivals7/selfcon-service';
import { SoarService } from '../services/rivals7/soar-service';
import { AtomService } from '../services/rivals7/atom-service';
import { MeterService } from '../services/rivals7/meter-service';
import { ErrorInboxService } from '../services/rivals7/errinbox-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

export const registerPhase40: Phase = ({ register }) => {
    register('forumPlusService', (c: IContainer) => {
        return new ForumPlusService(dalOf(c), eventsOf(c));
    });

    register('decisionService', (c: IContainer) => {
        return new DecisionService(dalOf(c), eventsOf(c));
    });

    register('polisService', (c: IContainer) => {
        return new PolisService(dalOf(c), eventsOf(c));
    });

    register('reflexionService', (c: IContainer) => {
        return new ReflexionService(
            dalOf(c),
            eventsOf(c),
            llmOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('totService', (c: IContainer) => {
        return new TotService(eventsOf(c), llmOf(c));
    });

    register('selfConService', (c: IContainer) => {
        return new SelfConsistencyService(eventsOf(c), llmOf(c));
    });

    register('soarService', (c: IContainer) => {
        return new SoarService(dalOf(c), eventsOf(c));
    });

    register('atomService', (c: IContainer) => {
        return new AtomService(dalOf(c));
    });

    register('meterService', (c: IContainer) => {
        return new MeterService(
            dalOf(c),
            eventsOf(c),
            c.has('mobileAccessService') ? c.get<IMobileAccessService>('mobileAccessService') : undefined,
        );
    });

    register('errInboxService', (c: IContainer) => {
        return new ErrorInboxService(dalOf(c), eventsOf(c));
    });
};
