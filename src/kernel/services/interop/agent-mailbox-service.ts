/**
 * In-process agent mailbox (A2A transport layer).
 *
 * Messages are stored per agent with optional tenant scoping. `send` supports
 * request/reply correlation via `replyTo`; `waitForReply` polls for a matching
 * reply with a bounded timeout. This is the local transport primitive — a real
 * HTTP/WebSocket sync can be layered on top by mirroring send/list.
 */
import type { IAgentMailboxService, AgentMessage } from '../../contracts/agent-mailbox';

const POLL_MS = 25;
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_MESSAGES = 1000;

let seq = 0;
const nextId = () => `msg-${Date.now()}-${++seq}`;

export class AgentMailboxService implements IAgentMailboxService {
    private byAgent = new Map<string, AgentMessage[]>();

    destroy(): void {
        this.byAgent.clear();
    }

    async send(message: Omit<AgentMessage, 'id' | 'createdAt'>): Promise<AgentMessage> {
        const full: AgentMessage = { ...message, id: nextId(), createdAt: Date.now() };
        const list = this.byAgent.get(message.to) ?? [];
        list.push(full);
        if (list.length > MAX_MESSAGES) list.shift();
        this.byAgent.set(message.to, list);
        return full;
    }

    async reply(
        requestId: string,
        from: string,
        payload: Record<string, unknown>,
        subject = 'reply',
    ): Promise<AgentMessage | null> {
        const request = this.findMessage(requestId);
        if (!request) return null;
        if (request.kind !== 'request') return null;
        return this.send({
            from,
            to: request.from,
            replyTo: requestId,
            kind: 'reply',
            subject,
            payload,
            tenantId: request.tenantId,
        });
    }

    async list(agentId: string, tenantId?: string): Promise<AgentMessage[]> {
        const all = this.byAgent.get(agentId) ?? [];
        return tenantId ? all.filter((m) => m.tenantId === tenantId) : [...all];
    }

    async waitForReply(
        requestId: string,
        timeoutMs = DEFAULT_TIMEOUT_MS,
    ): Promise<AgentMessage | null> {
        const deadline = Date.now() + Math.max(0, timeoutMs);
        while (Date.now() <= deadline) {
            const reply = this.findMessage(requestId, 'reply');
            if (reply) return reply;
            await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        }
        return null;
    }

    private findMessage(id: string, kind?: AgentMessage['kind']): AgentMessage | undefined {
        for (const list of this.byAgent.values()) {
            for (const m of list) {
                if (m.replyTo === id && (!kind || m.kind === kind)) return m;
                if (!kind && m.id === id) return m;
            }
        }
        return undefined;
    }
}
