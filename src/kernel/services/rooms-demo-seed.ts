import type { InvocationRepository } from './invocation/invocation-repository';
import { InvocationRepository as InvocationRepositoryImpl } from './invocation/invocation-repository';
import { getDexieDb } from './database-service';
import type { IDatabaseService } from '../types/interfaces';
import type { Invocation } from '../contracts/invocation';
import { genId } from '../../utils/gen-id';

/**
 * Demo seed for Agent Rooms: one COMPLETED invocation (human → agent,
 * accepted and done) so the lifecycle list shows a full cycle without
 * running an LLM.
 *
 * Idempotent: invocations with DEMO_INVOCATION_REASON are reused.
 */
export const DEMO_INVOCATION_REASON = 'Демо: проверить риски релиза';

export async function seedRoomsDemo(repository?: InvocationRepository): Promise<Invocation> {
    const repo =
        repository ??
        new InvocationRepositoryImpl(getDexieDb() as unknown as IDatabaseService);
    const existing = (await repo.list()).find((i) => i.reason === DEMO_INVOCATION_REASON);
    if (existing) return existing;
    const now = Date.now();
    const inv: Invocation = {
        id: genId('inv'),
        status: 'done',
        source: 'human-mention',
        caller: { kind: 'human', id: 'room-ui' },
        target: { agentId: 'agent-risk' },
        resolvedAgents: [{ id: 'agent-risk', role: 'Risk Analyst' }],
        reason: DEMO_INVOCATION_REASON,
        context: { type: 'room', ref: 'general' },
        constraints: { mode: 'chat' },
        policyRef: 'demo-room-policy',
        createdAt: now - 120000,
        updatedAt: now,
    };
    await repo.put(inv);
    return inv;
}
