/**
 * Phase 43 — Rival parity 11 (Roadmap Phase Q, §RIVALS11_COMPARE.md).
 *
 * Registers (no Dexie changes — kv only):
 *   - `netLogoService` (grid turtles + BehaviorSpace)
 *   - `mesaService` (schedulers + DataCollector + batch runs)
 *   - `bonsaiService` (curriculum + Q-brain + assessment)
 *   - `chainlitService` (step tree + elements + feedback)
 *   - `gradioService` (interfaces + flagging)
 *   - `chartService` (specs + SVG + meter bridge)
 *   - `graphVizService` (layered/force layouts + SVG)
 *   - `malmoService` (grid missions + rewards)
 *   - `gymService` (bandit/gridworld/cartlite/custom envs)
 *
 * Additive — SimulationService, MeterService, ToolRunner untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { IToolRunnerService } from '../contracts/parity';
import type { ICrewService } from '../contracts/crew';
import type { IMeterService } from '../contracts/rivals7';
import { NetLogoService } from '../services/rivals11/netlogo-service';
import { MesaService } from '../services/rivals11/mesa-service';
import { BonsaiService } from '../services/rivals11/bonsai-service';
import { ChainlitService } from '../services/rivals11/chainlit-service';
import { GradioService } from '../services/rivals11/gradio-service';
import { ChartService } from '../services/rivals11/chart-service';
import { GraphVizService } from '../services/rivals11/graphviz-service';
import { MalmoService } from '../services/rivals11/malmo-service';
import { GymService } from '../services/rivals11/gym-service';

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

export const registerPhase43: Phase = ({ register }) => {
    register('netLogoService', (c: IContainer) => {
        return new NetLogoService(dalOf(c), eventsOf(c));
    });

    register('mesaService', (c: IContainer) => {
        return new MesaService(dalOf(c), eventsOf(c));
    });

    register('bonsaiService', (c: IContainer) => {
        return new BonsaiService(dalOf(c), eventsOf(c));
    });

    register('chainlitService', (c: IContainer) => {
        return new ChainlitService(dalOf(c), eventsOf(c));
    });

    register('gradioService', (c: IContainer) => {
        return new GradioService(
            dalOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
            c.has('crewService') ? c.get<ICrewService>('crewService') : undefined,
        );
    });

    register('chartService', (c: IContainer) => {
        return new ChartService(
            dalOf(c),
            c.has('meterService') ? c.get<IMeterService>('meterService') : undefined,
        );
    });

    register('graphVizService', () => {
        return new GraphVizService();
    });

    register('malmoService', (c: IContainer) => {
        return new MalmoService(dalOf(c), eventsOf(c));
    });

    register('gymService', (c: IContainer) => {
        return new GymService(dalOf(c));
    });
};
