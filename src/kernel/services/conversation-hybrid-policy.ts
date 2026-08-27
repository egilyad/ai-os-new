import type { IOverrideCapablePolicy, PolicyState } from '../contracts/conversation/policy';
import type { TurnProposal } from '../contracts/conversation/turn';
import type { ConversationContext } from '../contracts/conversation/context';

/**
 * "Conversation Director" policy.
 *
 * Holds a base scripted plan (the director's draft). Between turns the human
 * can intervene:
 *  - queueOverride(proposal): insert/edit a turn that runs *instead* of the
 *    next autonomously planned one, WITHOUT consuming the plan cursor — the
 *    planned turn is preserved and runs later once overrides drain.
 *  - skipNextTurn(): drop the next planned turn and let the one after run.
 *
 * This is the proof of the user-controlled "roles in a managed dialogue"
 * concept: the plan is a suggestion, the human stays in the loop.
 */
export class HybridPolicy implements IOverrideCapablePolicy {
    private cursor = 0;
    private overrideQueue: TurnProposal[] = [];
    private skipNext = false;
    private lastIndex = -1;
    private lastInjected = false;

    constructor(private readonly script: TurnProposal[]) {}

    async proposeNextTurn(
        _context: ConversationContext,
        _state: PolicyState,
    ): Promise<TurnProposal | null> {
        if (this.overrideQueue.length > 0) {
            this.lastInjected = true;
            this.lastIndex = -1;
            return this.overrideQueue.shift()!;
        }

        if (this.skipNext) {
            this.skipNext = false;
            if (this.cursor < this.script.length) this.cursor++;
        }

        if (this.cursor >= this.script.length) return null;
        const proposal = this.script[this.cursor]!;
        this.lastInjected = false;
        this.lastIndex = this.cursor;
        this.cursor++;
        return proposal;
    }

    queueOverride(proposal: TurnProposal): void {
        this.overrideQueue.push(proposal);
    }

    skipNextTurn(): void {
        this.skipNext = true;
    }

    describeLastProposal(): { index: number; injected: boolean } | null {
        if (this.lastIndex < 0 && !this.lastInjected) return null;
        return { index: this.lastIndex, injected: this.lastInjected };
    }

    reset(): void {
        this.cursor = 0;
        this.overrideQueue = [];
        this.skipNext = false;
        this.lastIndex = -1;
        this.lastInjected = false;
    }
}
