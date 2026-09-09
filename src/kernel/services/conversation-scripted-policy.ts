import type { ITurnPolicy } from '../contracts/conversation/policy';
import type { TurnProposal } from '../contracts/conversation/turn';
import type { ConversationContext } from '../contracts/conversation/context';

export class ScriptedPolicy implements ITurnPolicy {
    private cursor = 0;

    constructor(private readonly script: TurnProposal[]) {}

    async proposeNextTurn(_context: ConversationContext): Promise<TurnProposal | null> {
        if (this.cursor >= this.script.length) return null;
        const proposal = this.script[this.cursor]!;
        this.cursor++;
        return proposal;
    }

    reset(): void {
        this.cursor = 0;
    }
}
