/**
 * Mission dispatcher: assigns DAG nodes to agents by role/expertise.
 *
 * Pure and deterministic — the agent directory is injected, so the dispatcher
 * works with the app's real agent registry or a test fixture. Nodes with no
 * assignee hint fall back to a generic executor id.
 */
import type {
    IDispatcherService,
    DispatchAssignment,
    DispatcherAgent,
} from '../../contracts/dispatcher';

export class DispatcherService implements IDispatcherService {
    constructor(private agents: DispatcherAgent[]) {}

    assign(
        nodes: Array<{ id: string; assignee?: { role?: string; expertise?: string[] } }>,
    ): DispatchAssignment[] {
        const used = new Set<string>();
        return nodes.map((node) => {
            const hint = node.assignee;
            const candidates = hint
                ? this.agents.filter((a) => {
                      const roleOk = hint.role
                          ? a.role === hint.role || (a.specializations ?? []).includes(hint.role)
                          : false;
                      const expOk = hint.expertise
                          ? hint.expertise.some((e) => (a.specializations ?? []).includes(e))
                          : false;
                      return roleOk || expOk;
                  })
                : [];
            // Prefer an unused agent so parallel nodes don't pile onto one.
            const agent = candidates.find((a) => !used.has(a.id)) ?? candidates[0];
            if (agent) used.add(agent.id);
            return {
                nodeId: node.id,
                agent: agent ?? { id: 'generic-executor', role: 'executor' },
                reason: hint
                    ? `matched role/expertise: ${JSON.stringify(hint)}`
                    : 'default executor',
            };
        });
    }
}
