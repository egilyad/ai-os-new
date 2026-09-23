/**
 * SimulationEngineService — Phase 63.
 *
 * Parallel ticks (Promise.all) over agents, like TinyWorld step parallel (0.5.1).
 * Additive: uses WorldStateService tick + moveAgent; AgentActPort stub if not wired (PROVIDER-PENDING for real LLM agents).
 * Events: sim:tick (from WorldState) + sim:completed.
 */

import type { ISimulationEngineService, AgentAct, IAgentActPort } from '../../contracts/simulation-engine';
import type { IWorldStateService } from '../../contracts/simulation-world';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

// Ленивый require для разрыва циклов: tsconfig app без node-типов.
declare const require: (id: string) => any;

const LOGGER = rootLogger.child('SimEngine');

class StubActPort implements IAgentActPort {
    async act(agentId: string, _worldId: string, tick: number, world: import('../../contracts/simulation-world').SimulationWorld): Promise<AgentAct> {
        // Simple stub: occasionally move to random adjacent room, else idle
        // Deterministic by agentId + tick hash
        let h = 0;
        for (const ch of `${agentId}:${tick}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        const rooms = world.rooms;
        if (rooms.length > 1 && h % 4 === 0) {
            const cur = rooms.find((r) => r.agents.includes(agentId));
            const idx = cur ? rooms.indexOf(cur) : 0;
            const target = rooms[(idx + 1) % rooms.length]!;
            return { agentId, action: 'move', targetRoomId: target.id, meta: { stub: true, h } };
        }
        if (h % 3 === 0) return { agentId, action: 'talk', message: `tick ${tick} from ${agentId}`, meta: { stub: true } };
        return { agentId, action: 'idle', meta: { stub: true } };
    }
}

export class SimulationEngineService implements ISimulationEngineService {
    private running = new Set<string>();

    constructor(private deps: {
        worldState: IWorldStateService;
        events: IEventBus;
        actPort?: IAgentActPort;
    }) {}

    /** Wiring helper — called by phase64 or panel to swap Stub → AgentFactory adapter without recreation. */
    setActPort(port: IAgentActPort): void {
        this.deps.actPort = port;
    }

    private resolveActPort(): IAgentActPort {
        if (this.deps.actPort) return this.deps.actPort;
        // Lazy fallback: try to get AgentActAdapterService if registered (phase64)
        try {
            // dynamic lazyService lookup to avoid circular import at top
            const { lazyService } = require('../../service-helper') as typeof import('../../service-helper');
            const adapter = lazyService<IAgentActPort>('agentActAdapterService');
            // peek if container has it (lazyService returns proxy that throws if missing — catch)
            // Try a cheap call: adapter.act exists → use it as lazy proxy
            if (adapter && typeof (adapter as unknown as { act?: unknown }).act === 'function') return adapter;
        } catch { /* ignore → stub */ }
        return new StubActPort();
    }

    async init(): Promise<void> { LOGGER.info('SimEngine', 'init', {}); }
    async destroy(): Promise<void> { this.running.clear(); }

    async status(worldId: string): Promise<{ tick: number; running: boolean } | null> {
        const w = await this.deps.worldState.get(worldId);
        if (!w) return null;
        return { tick: w.globalClock, running: this.running.has(worldId) };
    }

    async step(worldId: string): Promise<{ world: import('../../contracts/simulation-world').SimulationWorld; acts: AgentAct[] }> {
        const world = await this.deps.worldState.get(worldId);
        if (!world) throw new Error(`World not found: ${worldId}`);
        const actPort = this.resolveActPort();

        // parallel agents (TinyTroupe 0.5.1: parallel within step)
        const acts: AgentAct[] = await Promise.all(
            world.agentIds.map((agentId) => actPort.act(agentId, worldId, world.globalClock + 1, world)),
        );

        // apply moves (sequential to avoid race, but decisions were parallel)
        for (const a of acts) {
            if (a.action === 'move' && a.targetRoomId) {
                try {
                    await this.deps.worldState.moveAgent(worldId, a.agentId, a.targetRoomId);
                } catch (e) {
                    LOGGER.warn('moveAgent failed', { worldId, agentId: a.agentId, error: e instanceof Error ? e.message : String(e) });
                }
            }
        }

        const ticked = await this.deps.worldState.tick(worldId);
        // act events are already handled via sim:tick from worldState; we also could emit per-acts if needed
        LOGGER.info('tick', { worldId, tick: ticked.globalClock, acts: acts.length });
        return { world: ticked, acts };
    }

    async run(worldId: string, ticks: number, _opts?: { parallel?: boolean }): Promise<import('../../contracts/simulation-world').SimulationWorld> {
        if (ticks < 1 || ticks > 1000) throw new Error('ticks must be 1..1000');
        if (this.running.has(worldId)) throw new Error(`World ${worldId} already running`);
        this.running.add(worldId);
        let world = await this.deps.worldState.get(worldId);
        if (!world) { this.running.delete(worldId); throw new Error(`World not found: ${worldId}`); }
        try {
            for (let i = 0; i < ticks; i++) {
                const { world: w } = await this.step(worldId);
                world = w;
            }
            try {
                (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                    (EVENTS as unknown as Record<string, string>).SIM_COMPLETED ?? ('sim:completed' as unknown as string),
                    { worldId, ticks },
                );
            } catch { /* ignore */ }
            return world;
        } finally {
            this.running.delete(worldId);
        }
    }
}
