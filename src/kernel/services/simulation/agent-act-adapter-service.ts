/**
 * AgentActAdapterService — Phase 64 (Stub→AgentFactory adapter, no LLM).
 *
 * Implements IAgentActPort via IAgentFactory.execute().
 * No real LLM required: if agent not found or execute fails, falls back to stub deterministic act (PROVIDER-PENDING for real LLM).
 * Additive — does NOT modify SimulationEngine; engine can be wired with this adapter via DI (see phase64).
 */

import type { IAgentActPort, AgentAct } from '../../contracts/simulation-engine';
import type { SimulationWorld } from '../../contracts/simulation-world';
import type { IAgentFactory } from '../../contracts/capability';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('AgentActAdapter');

function stubAct(agentId: string, tick: number, world: SimulationWorld): AgentAct {
    let h = 0;
    for (const ch of `${agentId}:${tick}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rooms = world.rooms;
    if (rooms.length > 1 && h % 4 === 0) {
        const cur = rooms.find((r) => r.agents.includes(agentId));
        const idx = cur ? rooms.indexOf(cur) : 0;
        const target = rooms[(idx + 1) % rooms.length]!;
        return { agentId, action: 'move', targetRoomId: target.id, meta: { via: 'stub-fallback', h } };
    }
    if (h % 3 === 0) return { agentId, action: 'talk', message: `tick ${tick} from ${agentId} (stub)`, meta: { via: 'stub-fallback' } };
    return { agentId, action: 'idle', meta: { via: 'stub-fallback' } };
}

function parseAct(agentId: string, output: string): AgentAct {
    const lower = output.toLowerCase();
    // Simple heuristic: if output contains "move to <roomName>" → move, else talk
    const moveMatch = output.match(/move\s+(?:to\s+)?([a-z0-9 _-]+)/i);
    if (moveMatch) {
        const name = moveMatch[1]!.trim().slice(0, 80);
        return { agentId, action: 'move', message: output.slice(0, 500), meta: { via: 'agentFactory', parsedRoomName: name } };
    }
    if (/talk:|say:|message:/i.test(output) || lower.includes('hello') || lower.includes('think')) {
        return { agentId, action: 'talk', message: output.slice(0, 500), meta: { via: 'agentFactory' } };
    }
    // Default to talk if output non-empty else idle
    if (output.trim()) return { agentId, action: 'talk', message: output.slice(0, 500), meta: { via: 'agentFactory' } };
    return { agentId, action: 'idle', meta: { via: 'agentFactory' } };
}

export class AgentActAdapterService implements IAgentActPort {
    constructor(private deps: { agentFactory: IAgentFactory }) {}

    async init(): Promise<void> { LOGGER.info('init', {}); }
    async destroy(): Promise<void> {}

    async act(agentId: string, worldId: string, tick: number, world: SimulationWorld): Promise<AgentAct> {
        const prompt = [
            `You are agent ${agentId} in Simulation World "${world.name}" (tick ${tick}).`,
            `Rooms: ${world.rooms.map((r) => `${r.name}(${r.id})[${r.agents.join(',') || 'empty'}]`).join(' | ')}`,
            `Your current room: ${world.rooms.find((r) => r.agents.includes(agentId))?.name ?? 'unknown'}`,
            `Relations: ${world.relations.map((rel) => `${rel.from}->${rel.to}:${rel.kind}=${rel.weight}`).join(', ') || 'none'}`,
            `Decide ONE action: idle, or move to a room name, or talk with a message. Reply concisely.`,
        ].join('\n');

        try {
            const def = await this.deps.agentFactory.get(agentId);
            if (!def) {
                LOGGER.warn('agent not found, stub fallback', { agentId });
                return stubAct(agentId, tick, world);
            }
            const result = await this.deps.agentFactory.execute(agentId, prompt);
            const raw = result.output || '';
            // If output empty but toolCalls present, treat as custom
            if (!raw && result.toolCalls.length > 0) {
                return { agentId, action: 'custom', message: `toolCalls: ${result.toolCalls.join(',')}`, meta: { via: 'agentFactory', toolCalls: result.toolCalls } };
            }
            const parsed = parseAct(agentId, raw);
            // If parsed move has room name, resolve to actual room id
            if (parsed.action === 'move' && parsed.meta?.parsedRoomName) {
                const name = String(parsed.meta.parsedRoomName).toLowerCase();
                const match = world.rooms.find((r) => r.name.toLowerCase().includes(name) || r.id.toLowerCase() === name);
                if (match) parsed.targetRoomId = match.id;
                else {
                    // fallback: next room
                    const cur = world.rooms.find((r) => r.agents.includes(agentId));
                    const idx = cur ? world.rooms.indexOf(cur) : 0;
                    parsed.targetRoomId = world.rooms[(idx + 1) % world.rooms.length]!.id;
                }
            }
            LOGGER.info('agent act', { agentId, worldId, tick, action: parsed.action });
            return parsed;
        } catch (e) {
            LOGGER.warn('agentFactory execute failed, stub fallback', { agentId, error: e instanceof Error ? e.message : String(e) });
            return stubAct(agentId, tick, world);
        }
    }
}
