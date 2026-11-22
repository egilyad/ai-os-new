export interface RegisteredAgent {
    id: string;
    name: string;
    role?: string;
    expertise: string[];
    provider?: string;
    model?: string;
    enabled: boolean;
}

/** Query agents by predicate and export a portable config snapshot (Swarms J3). */
export interface IAgentRegistryQueryService {
    register(agent: RegisteredAgent): void;
    query(predicate: (agent: RegisteredAgent) => boolean): RegisteredAgent[];
    snapshot(ids?: string[]): string;
}
