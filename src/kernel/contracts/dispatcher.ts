/** A lightweight agent directory entry used by the mission dispatcher. */
export interface DispatcherAgent {
    id: string;
    name?: string;
    role: string;
    specializations?: string[];
}

export interface DispatchAssignment {
    nodeId: string;
    agent: DispatcherAgent;
    reason: string;
}

/** Maps mission nodes (role/expertise hints) to concrete agents. */
export interface IDispatcherService {
    assign(
        nodes: Array<{
            id: string;
            assignee?: { role?: string; expertise?: string[] };
        }>,
    ): DispatchAssignment[];
}
