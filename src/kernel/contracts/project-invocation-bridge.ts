/**
 * Project invocation bridge contract.
 */
export interface IProjectInvocationBridge {
    invokeAgent(request: { projectId: string; agentId: string; task: string; mode?: string }): Promise<{ success: boolean; output: string; filesChanged: string[]; durationMs: number }>;
    getRecentInvocations(projectId: string): Array<{ agentId: string; task: string; timestamp: number; success: boolean }>;
}
