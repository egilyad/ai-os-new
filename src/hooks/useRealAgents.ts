import { useEffect, useState } from 'react';
import { agentService } from '../kernel/instances/services-core';
import { eventBus } from '../kernel/events/event-bus';
import { EVENTS } from '../kernel/events/event-registry';

export interface RealAgent {
    id: string;
    name: string;
    role: string;
}

function readAgents(): RealAgent[] {
    try {
        const list = agentService.getAgents() as Array<{ id: string; name: string; role?: string }>;
        if (list && list.length > 0) return list.map((a) => ({ id: a.id, name: a.name, role: a.role ?? 'agent' }));
    } catch {
        // container not ready → no agents (never demo data)
    }
    return [];
}

/**
 * Canonical hook for real agent identities.
 * Source: AgentService (topology-backed) → orchestrator.getActiveTopology().
 * Returns the REAL agent list, or an empty array when none are registered.
 * Consumers must render a "No agents available" state when the list is empty —
 * this hook never synthesizes demo identities.
 * Subscribes to SYSTEM_TOPOLOGY_MOUNTED to stay live.
 */
export function useRealAgents(): RealAgent[] {
    const [agents, setAgents] = useState<RealAgent[]>(() => readAgents());

    useEffect(() => {
        let unsub: (() => void) | undefined;
        try {
            const cb = () => setAgents(readAgents());
            // onSafe is preferred (filters + error isolation)
            const bus: any = eventBus as any;
            if (bus?.onSafe) unsub = bus.onSafe(EVENTS.SYSTEM_TOPOLOGY_MOUNTED, cb);
            else if (bus?.on) unsub = bus.on(EVENTS.SYSTEM_TOPOLOGY_MOUNTED, cb);
        } catch {
            // no bus in test harness
        }
        // also refresh once after mount in case orchestrator became ready async
        const t = setTimeout(() => setAgents(readAgents()), 300);
        return () => {
            clearTimeout(t);
            try { unsub?.(); } catch { /* ignore */ }
        };
    }, []);

    return agents;
}
