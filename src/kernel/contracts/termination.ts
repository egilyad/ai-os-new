import type { ILifecycle } from './lifecycle';

/** Snapshot of a running conversation/mission, fed to termination predicates. */
export interface TerminationContext {
    messageCount: number;
    tokenCount: number;
    elapsedMs: number;
    lastMessage?: string;
    lastSource?: string;
    handoffDetected?: boolean;
    [key: string]: unknown;
}

/** A pure termination predicate — no side effects, no LLM calls. */
export interface TerminationCondition {
    readonly id: string;
    /** Human-readable description for UI/logging. */
    describe(): string;
    /** True when this condition says "stop". */
    shouldTerminate(ctx: TerminationContext): boolean;
}

export type TerminationOperator = 'all' | 'any';

/** Composable termination algebra (AutoGen-style: AND/OR over predicates). */
export interface ITerminationService extends ILifecycle {
    register(condition: TerminationCondition): void;
    list(): TerminationCondition[];
    /** Combine conditions with AND (all) or OR (any). */
    combine(
        operator: TerminationOperator,
        conditions: TerminationCondition[],
    ): TerminationCondition;
    /** Evaluate all registered conditions using the configured operator. */
    evaluate(ctx: TerminationContext): { stop: boolean; matched: string[] };
    /** Override the evaluator operator (default: any). */
    setOperator(operator: TerminationOperator): void;
    clear(): void;
}
