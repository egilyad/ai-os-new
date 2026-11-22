/**
 * Agent registry query (Swarms-inspired, J3).
 *
 * Predicate-based lookup over registered agents plus a JSON config snapshot
 * that can be saved as a project artifact and reloaded later.
 */
import type {
    IAgentRegistryQueryService,
    RegisteredAgent,
} from '../../contracts/agent-registry-query';

export class AgentRegistryQueryService implements IAgentRegistryQueryService {
    private agents = new Map<string, RegisteredAgent>();

    register(agent: RegisteredAgent): void {
        this.agents.set(agent.id, { ...agent, expertise: [...agent.expertise] });
    }

    query(predicate: (agent: RegisteredAgent) => boolean): RegisteredAgent[] {
        return [...this.agents.values()]
            .filter(predicate)
            .map((a) => ({ ...a, expertise: [...a.expertise] }));
    }

    snapshot(ids?: string[]): string {
        const list = ids
            ? ids.map((id) => this.agents.get(id)).filter((a): a is RegisteredAgent => Boolean(a))
            : [...this.agents.values()];
        return JSON.stringify(
            { version: 1, exportedAt: new Date().toISOString(), agents: list },
            null,
            2,
        );
    }
}
