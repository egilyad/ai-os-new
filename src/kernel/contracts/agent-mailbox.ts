export interface AgentMessage {
    id: string;
    from: string;
    to: string;
    /** Optional request/reply correlation id. */
    replyTo?: string;
    kind: 'request' | 'reply' | 'event';
    subject: string;
    payload: Record<string, unknown>;
    createdAt: number;
    /** Optional tenant scope for isolation. */
    tenantId?: string;
}

/** Addressable agent-to-agent mailbox with request/reply correlation. */
export interface IAgentMailboxService {
    send(message: Omit<AgentMessage, 'id' | 'createdAt'>): Promise<AgentMessage>;
    /** Deliver a reply to a prior request (replyTo = request id). */
    reply(
        requestId: string,
        from: string,
        payload: Record<string, unknown>,
        subject?: string,
    ): Promise<AgentMessage | null>;
    /**
     * Non-destructive read of a mailbox (newest last).
     * Tenant isolation: when tenantId is omitted ONLY global (tenant-less)
     * messages are returned — never a mix of tenants.
     */
    list(agentId: string, tenantId?: string): Promise<AgentMessage[]>;
    /** Wait for a reply to the given request (polling, bounded timeout). */
    waitForReply(
        requestId: string,
        timeoutMs?: number,
        tenantId?: string,
    ): Promise<AgentMessage | null>;
}
