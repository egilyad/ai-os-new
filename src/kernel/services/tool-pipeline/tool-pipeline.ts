/**
 * Tool execution pipeline (waterfall).
 *
 * Ported from the DeepSeek Harness execution waterfall (MIT): a tool call is
 * wrapped by three middleware phases instead of having the permission check
 * hard-coded inside the dispatcher.
 *
 *   pre   → allow | deny | cancel | ask | replace(input)
 *   exec  → the actual tool body
 *   post  → accept | replace(output) | enrich(output) | block(reason)
 *
 * The permission gate lives in the `pre` phase as a middleware, so any other
 * cross-cutting concern (rate limiting, audit, sandbox, sandbox inheritance
 * guard) can join the same chain without touching the tool dispatcher.
 *
 * Rules borrowed from the reference harnesses:
 *  - `ask` without an approval resolver degrades to `deny` (DeepSeek Harness:
 *    "missing approval support turns ask into denial").
 *  - a middleware may only replace the *input* in `pre` and the *output* in
 *    `post`; the tool identity and the caller signal stay immutable.
 */

/** Decision returned by the `pre` phase. */
export type ToolPreDecision =
    | { kind: 'allow' }
    | { kind: 'deny'; reason: string }
    | { kind: 'cancel'; reason: string }
    | { kind: 'ask'; reason: string; action?: string; resource?: string }
    | { kind: 'replace'; input: unknown; reason?: string };

/** Decision returned by the `post` phase. */
export type ToolPostDecision =
    | { kind: 'accept' }
    | { kind: 'replace'; output: unknown }
    | { kind: 'enrich'; output: unknown }
    | { kind: 'block'; reason: string };

export interface ToolPipelineContext {
    toolId: string;
    input: unknown;
    agentId?: string;
    sessionId?: string;
    runId?: string;
    signal?: AbortSignal;
}

export interface ToolPipelineOutcome {
    status: string;
    data?: unknown;
    error?: string;
    timestamp: number;
    duration?: number;
}

export interface ToolPipelineMiddleware {
    readonly id: string;
    pre?(ctx: ToolPipelineContext): Promise<ToolPreDecision> | ToolPreDecision;
    post?(
        ctx: ToolPipelineContext,
        outcome: ToolPipelineOutcome,
    ): Promise<ToolPostDecision> | ToolPostDecision;
}

/** Human-in-the-loop resolver for `ask` decisions. */
export interface ToolApprovalResolver {
    resolve(request: {
        toolId: string;
        agentId?: string;
        action?: string;
        resource?: string;
        reason: string;
    }): Promise<'allow' | 'deny'>;
}

/** Narrow port consumed by the tool dispatcher. */
export interface ToolPipelinePort {
    runPre(ctx: ToolPipelineContext): Promise<ToolPipelineResult>;
    runPost(
        ctx: ToolPipelineContext,
        outcome: ToolPipelineOutcome,
    ): Promise<ToolPipelineOutcome>;
}

export interface ToolPipelineResult {
    /** Final gate outcome. */
    decision: 'allow' | 'deny' | 'cancel' | 'ask';
    reason?: string;
    /** Possibly rewritten input produced by a `replace` middleware. */
    input: unknown;
    /** Middleware that produced the blocking decision (for audit logs). */
    blockedBy?: string;
}

export class ToolPipeline {
    private middlewares: ToolPipelineMiddleware[] = [];

    constructor(
        middlewares: ToolPipelineMiddleware[] = [],
        private approvalResolver?: ToolApprovalResolver,
    ) {
        this.middlewares = [...middlewares];
    }

    use(middleware: ToolPipelineMiddleware): this {
        if (this.middlewares.some((m) => m.id === middleware.id)) return this;
        this.middlewares.push(middleware);
        return this;
    }

    remove(id: string): void {
        this.middlewares = this.middlewares.filter((m) => m.id !== id);
    }

    list(): ToolPipelineMiddleware[] {
        return [...this.middlewares];
    }

    /**
     * Run the `pre` phase. The first middleware that does not return `allow`
     * short-circuits the chain.
     */
    async runPre(ctx: ToolPipelineContext): Promise<ToolPipelineResult> {
        let input = ctx.input;
        for (const middleware of this.middlewares) {
            if (!middleware.pre) continue;
            const decision = await middleware.pre({ ...ctx, input });
            if (!decision) continue;
            switch (decision.kind) {
                case 'allow':
                    break;
                case 'replace':
                    input = decision.input;
                    break;
                case 'deny':
                    return {
                        decision: 'deny',
                        reason: decision.reason,
                        input,
                        blockedBy: middleware.id,
                    };
                case 'cancel':
                    return {
                        decision: 'cancel',
                        reason: decision.reason,
                        input,
                        blockedBy: middleware.id,
                    };
                case 'ask': {
                    if (!this.approvalResolver) {
                        // No approval channel wired — fail closed.
                        return {
                            decision: 'deny',
                            reason: `${decision.reason} (no approval channel available)`,
                            input,
                            blockedBy: middleware.id,
                        };
                    }
                    const verdict = await this.approvalResolver.resolve({
                        toolId: ctx.toolId,
                        agentId: ctx.agentId,
                        action: decision.action,
                        resource: decision.resource,
                        reason: decision.reason,
                    });
                    if (verdict === 'allow') break;
                    return {
                        decision: 'deny',
                        reason: `${decision.reason} (approval rejected)`,
                        input,
                        blockedBy: middleware.id,
                    };
                }
            }
        }
        return { decision: 'allow', input };
    }

    /**
     * Run the `post` phase. The first `block` short-circuits, otherwise the
     * last `replace`/`enrich` wins.
     */
    async runPost(
        ctx: ToolPipelineContext,
        outcome: ToolPipelineOutcome,
    ): Promise<ToolPipelineOutcome> {
        let result = outcome;
        for (const middleware of this.middlewares) {
            if (!middleware.post) continue;
            const decision = await middleware.post({ ...ctx, input: ctx.input }, result);
            if (!decision) continue;
            switch (decision.kind) {
                case 'accept':
                    break;
                case 'replace':
                    result = { ...result, data: decision.output };
                    break;
                case 'enrich':
                    result = {
                        ...result,
                        data:
                            result.data && typeof result.data === 'object'
                                ? { ...(result.data as Record<string, unknown>), ...(decision.output as Record<string, unknown>) }
                                : decision.output,
                    };
                    break;
                case 'block':
                    return {
                        status: 'error',
                        error: decision.reason,
                        timestamp: result.timestamp,
                        duration: result.duration,
                    };
            }
        }
        return result;
    }
}
