/**
 * Tool approval contracts — the human-in-the-loop channel of the tool waterfall.
 *
 * The waterfall (`services/tool-pipeline/tool-pipeline.ts`) turns an `ask`
 * decision into a request. Without a channel to ask, `ask` degrades to `deny`
 * (fail closed). These contracts describe that channel: the kernel keeps a
 * pending request alive until a human resolves it (or it times out).
 *
 * The request travels to the UI as an event; the UI answers through
 * `IToolApprovalService.resolve()`. The kernel never imports the UI.
 */

/** A pending "may I run this?" question. */
export interface ToolApprovalRequest {
    id: string;
    /** Tool the agent wants to run. */
    toolId: string;
    /** Agent that asked. */
    agentId?: string;
    /** Permission action (tool:read | tool:write | tool:exec | tool:net | tool:mcp | tool:memory). */
    action?: string;
    /** Resource the action targets (usually the tool id). */
    resource?: string;
    /** Human-readable justification shown in the dialog. */
    reason: string;
    /** Tool input, so the human can judge what exactly is going to happen. */
    input?: unknown;
    createdAt: number;
    /** After this moment the request auto-denies. */
    expiresAt: number;
}

export type ToolApprovalDecision = 'allow' | 'deny';

export interface IToolApprovalService {
    /**
     * Ask a human. Resolves with the decision; `deny` on timeout or when the
     * service was destroyed (fail closed).
     */
    request(request: {
        toolId: string;
        agentId?: string;
        action?: string;
        resource?: string;
        reason: string;
        input?: unknown;
        /** How long to wait for a human. Default 120s. */
        timeoutMs?: number;
    }): Promise<ToolApprovalDecision>;
    /** Answer a pending request. Returns false when the id is unknown or expired. */
    resolve(id: string, decision: ToolApprovalDecision): boolean;
    /** Currently pending requests (oldest first). */
    listPending(): ToolApprovalRequest[];
    /**
     * The UI announces itself while it can show a dialog. While nobody is
     * attending, `request()` denies immediately instead of stalling.
     */
    setAttended(attended: boolean): void;
    isAttended(): boolean;
}
