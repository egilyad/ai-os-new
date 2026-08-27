import type { IConversationOrchestrator } from '../contracts/conversation/orchestrator';
import type { TurnProposal } from '../contracts/conversation/turn';
import type {
    ITurnPolicy,
    IOverrideCapablePolicy,
    PolicyState,
} from '../contracts/conversation/policy';
import type { IExecutionEngine, TurnResult } from '../contracts/conversation/execution';
import type { ConversationContext } from '../contracts/conversation/context';
import type { IEventBus } from '../types/interfaces';
import { eventBus as coreEventBus, EVENTS } from '../events/event-bus';

export class ConversationOrchestrator implements IConversationOrchestrator {
    private paused = false;
    private aborted = new Set<string>();
    private abortControllers = new Map<string, AbortController>();
    private activeSessionId = '';

    constructor(
        private policy: ITurnPolicy,
        private executionEngine: IExecutionEngine,
        private context: ConversationContext,
        private readonly eventBus: IEventBus = coreEventBus,
    ) {}

    abortSession(sessionId: string): void {
        this.aborted.add(sessionId);
        this.abortControllers.get(sessionId)?.abort();
        this.eventBus.emit(EVENTS.CONVERSATION_ABORTED, { sessionId });
    }

    isAborted(sessionId: string): boolean {
        return this.aborted.has(sessionId);
    }

    clearAbort(sessionId: string): void {
        this.aborted.delete(sessionId);
        this.abortControllers.delete(sessionId);
    }

    clearAbortAll(): void {
        this.aborted.clear();
        this.abortControllers.clear();
    }

    getAbortSignal(sessionId: string): AbortSignal {
        let ac = this.abortControllers.get(sessionId);
        if (!ac) {
            ac = new AbortController();
            this.abortControllers.set(sessionId, ac);
        }
        return ac.signal;
    }

    async processNextStep(sessionId: string): Promise<void> {
        if (this.paused || this.aborted.has(sessionId)) return;

        const proposal = await this.policy.proposeNextTurn(this.context, {
            id: sessionId,
            data: {},
        } as PolicyState);
        if (!proposal) {
            // Policy exhausted and not paused/aborted → the scenario completed.
            if (!this.aborted.has(sessionId) && !this.paused) {
                this.eventBus.emit(EVENTS.CONVERSATION_COMPLETED, { sessionId });
            }
            return;
        }

        // Provenance of this turn (planned scripted index vs operator-injected
        // override) for correct step binding and progress accounting in the UI.
        const info = (this.policy as IOverrideCapablePolicy).describeLastProposal?.() ?? null;
        const turnIndex = info ? info.index : -1;
        const injected = info ? info.injected : false;

        this.activeSessionId = sessionId;
        this.eventBus.emit(EVENTS.CONVERSATION_TURN_START, {
            sessionId,
            participantId: proposal.participantId,
            turnIndex,
            injected,
        });

        let result: TurnResult;
        try {
            result = await this.executionEngine.execute(
                proposal,
                this.context,
                this.getAbortSignal(sessionId),
            );
        } catch (e) {
            this.eventBus.emit(EVENTS.CONVERSATION_TURN_ERROR, {
                sessionId,
                participantId: proposal.participantId,
                turnIndex,
                injected,
                error: e instanceof Error ? e.message : String(e),
            });
            throw e;
        }

        // A turn that executed but reported failure must be surfaced as FAILED,
        // never as a successful completion. Previously `success` was hardcoded to
        // true, so a failed LLM call still showed COMPLETE to the operator.
        if (!result.success) {
            const reason = result.error ?? 'turn execution failed';
            this.eventBus.emit(EVENTS.CONVERSATION_TURN_ERROR, {
                sessionId,
                participantId: proposal.participantId,
                turnIndex,
                injected,
                error: reason,
            });
            throw new Error(reason);
        }

        this.context.history.push({
            role: proposal.participantId,
            content: result.content ?? '',
        });
        this.eventBus.emit(EVENTS.CONVERSATION_TURN_COMPLETE, {
            sessionId,
            participantId: proposal.participantId,
            turnIndex,
            injected,
            success: true,
            content: result.content,
        });
    }

    pause(): void {
        this.paused = true;
        this.eventBus.emit(EVENTS.CONVERSATION_PAUSED, { sessionId: this.activeSessionId });
    }
    resume(): void {
        this.paused = false;
        this.eventBus.emit(EVENTS.CONVERSATION_RESUMED, { sessionId: this.activeSessionId });
    }

    overrideTurn(proposal: TurnProposal): void {
        const capable = this.policy as IOverrideCapablePolicy;
        if (typeof capable.queueOverride === 'function') {
            capable.queueOverride(proposal);
            return;
        }
        console.log('Override (no override-capable policy):', proposal);
    }

    skipNext(): void {
        const capable = this.policy as IOverrideCapablePolicy;
        if (typeof capable.skipNextTurn === 'function') {
            capable.skipNextTurn();
            return;
        }
        console.log('skipNext (no override-capable policy)');
    }
}
