/**
 * ToolApprovalService — the human-in-the-loop channel for the tool waterfall.
 *
 * The waterfall's `ask` decision needs somebody to answer. This service holds
 * the pending question, publishes it as an event (the UI renders a dialog),
 * and resolves the awaiting tool call when a human decides.
 *
 * Design rules:
 *  - Fail closed: timeout, destroy, or an unknown id all mean `deny`.
 *  - One request per call: the promise resolves exactly once.
 *  - The kernel never touches the UI — the UI only listens and calls
 *    `resolve()`.
 */
import type {
    IToolApprovalService,
    ToolApprovalDecision,
    ToolApprovalRequest,
} from '../../contracts/tool-approval';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('ToolApproval');

const DEFAULT_TIMEOUT_MS = 120_000;

interface Pending {
    request: ToolApprovalRequest;
    settle: (decision: ToolApprovalDecision) => void;
    timer: ReturnType<typeof setTimeout>;
}

export class ToolApprovalService implements IToolApprovalService {
    private pending = new Map<string, Pending>();
    private counter = 0;
    /**
     * True while a UI is listening. Without an attentive UI nobody can answer,
     * so the request is denied immediately instead of stalling the caller.
     */
    private attended = false;

    constructor(private readonly deps: { eventBus: IEventBus }) {}

    /** The UI announces itself on mount and leaves on unmount. */
    setAttended(attended: boolean): void {
        this.attended = attended;
    }

    isAttended(): boolean {
        return this.attended;
    }

    async request(input: {
        toolId: string;
        agentId?: string;
        action?: string;
        resource?: string;
        reason: string;
        input?: unknown;
        timeoutMs?: number;
    }): Promise<ToolApprovalDecision> {
        if (!this.attended) {
            // Fail closed and fast: no human is watching.
            LOGGER.warn('ToolApproval', 'no approval channel — denying', {
                toolId: input.toolId,
            });
            return 'deny';
        }
        const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const now = Date.now();
        const request: ToolApprovalRequest = {
            id: `approval-${now}-${++this.counter}`,
            toolId: input.toolId,
            agentId: input.agentId,
            action: input.action,
            resource: input.resource,
            reason: input.reason,
            input: input.input,
            createdAt: now,
            expiresAt: now + timeoutMs,
        };

        const pendingPromise = new Promise<ToolApprovalDecision>((resolve) => {
            const timer = setTimeout(() => {
                this.pending.delete(request.id);
                LOGGER.warn('ToolApproval', 'approval timed out — denying', {
                    toolId: request.toolId,
                });
                resolve('deny');
            }, timeoutMs);
            this.pending.set(request.id, { request, settle: resolve, timer });
        });

        // Publish before awaiting: the UI must see the question while it is open.
        this.deps.eventBus.emit(EVENTS.TOOL_APPROVAL_REQUESTED, request);

        const decision = await pendingPromise;

        this.deps.eventBus.emit(EVENTS.TOOL_APPROVAL_RESOLVED, {
            id: request.id,
            toolId: request.toolId,
            agentId: request.agentId,
            decision,
        });
        return decision;
    }

    resolve(id: string, decision: ToolApprovalDecision): boolean {
        const entry = this.pending.get(id);
        if (!entry) return false;
        clearTimeout(entry.timer);
        this.pending.delete(id);
        entry.settle(decision);
        return true;
    }

    listPending(): ToolApprovalRequest[] {
        return [...this.pending.values()]
            .map((p) => p.request)
            .sort((a, b) => a.createdAt - b.createdAt);
    }

    /** Deny everything that is still open (shutdown). */
    destroy(): void {
        for (const [, entry] of this.pending) {
            clearTimeout(entry.timer);
            entry.settle('deny');
        }
        this.pending.clear();
    }
}
