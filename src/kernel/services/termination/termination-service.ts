/**
 * Composable termination conditions (AutoGen-inspired).
 *
 * Pure predicates + AND/OR combinators. No LLM, no side effects — usable from
 * tool loops, crew runs, graph pipelines and UI. Conditions are context-keyed:
 * a predicate reads only TerminationContext fields, so it stays deterministic
 * and trivially testable.
 */
import type {
    ITerminationService,
    TerminationCondition,
    TerminationContext,
    TerminationOperator,
} from '../../contracts/termination';

export class TerminationService implements ITerminationService {
    private conditions: TerminationCondition[] = [];
    private operator: TerminationOperator = 'any';

    async init(): Promise<void> {}

    async destroy(): Promise<void> {
        this.clear();
    }

    register(condition: TerminationCondition): void {
        this.conditions.push(condition);
    }

    list(): TerminationCondition[] {
        return [...this.conditions];
    }

    setOperator(operator: TerminationOperator): void {
        this.operator = operator;
    }

    combine(
        operator: TerminationOperator,
        conditions: TerminationCondition[],
    ): TerminationCondition {
        return {
            id: `${operator}(${conditions.map((c) => c.id).join(',')})`,
            describe: () =>
                conditions.length
                    ? `${operator.toUpperCase()}: ${conditions.map((c) => c.describe()).join(operator === 'all' ? ' AND ' : ' OR ')}`
                    : `${operator.toUpperCase()}: (empty)`,
            shouldTerminate: (ctx) =>
                operator === 'all'
                    ? conditions.length > 0 && conditions.every((c) => c.shouldTerminate(ctx))
                    : conditions.some((c) => c.shouldTerminate(ctx)),
        };
    }

    evaluate(ctx: TerminationContext): { stop: boolean; matched: string[] } {
        const matched = this.conditions.filter((c) => c.shouldTerminate(ctx)).map((c) => c.id);
        const stop =
            this.operator === 'all'
                ? this.conditions.length > 0 && matched.length === this.conditions.length
                : matched.length > 0;
        return { stop, matched };
    }

    clear(): void {
        this.conditions = [];
        this.operator = 'any';
    }
}

// ── Built-in predicates ──────────────────────────────────────────────

export const maxMessages = (limit: number): TerminationCondition => ({
    id: `maxMessages(${limit})`,
    describe: () => `-stop after ${limit} messages`,
    shouldTerminate: (ctx) => ctx.messageCount >= limit,
});

export const maxTokens = (limit: number): TerminationCondition => ({
    id: `maxTokens(${limit})`,
    describe: () => `stop after ${limit} tokens`,
    shouldTerminate: (ctx) => ctx.tokenCount >= limit,
});

export const timeoutMs = (limit: number): TerminationCondition => ({
    id: `timeoutMs(${limit})`,
    describe: () => `stop after ${limit}ms`,
    shouldTerminate: (ctx) => ctx.elapsedMs >= limit,
});

export const textMention = (needle: string): TerminationCondition => ({
    id: `textMention(${needle})`,
    describe: () => `stop when a message contains "${needle}"`,
    shouldTerminate: (ctx) =>
        typeof ctx.lastMessage === 'string' && ctx.lastMessage.includes(needle),
});

export const sourceMatch = (source: string): TerminationCondition => ({
    id: `sourceMatch(${source})`,
    describe: () => `stop when the last message came from "${source}"`,
    shouldTerminate: (ctx) => ctx.lastSource === source,
});

export const handoffDetected = (): TerminationCondition => ({
    id: 'handoffDetected',
    describe: () => 'stop when a handoff was detected',
    shouldTerminate: (ctx) => ctx.handoffDetected === true,
});

export const functionalCondition = (
    id: string,
    description: string,
    predicate: (ctx: TerminationContext) => boolean,
): TerminationCondition => ({
    id,
    describe: () => description,
    shouldTerminate: (ctx) => {
        try {
            return predicate(ctx) === true;
        } catch {
            return false;
        }
    },
});
