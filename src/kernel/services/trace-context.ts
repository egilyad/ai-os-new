import type { ITraceContext } from '../contracts/logger';

export class TraceContext {
    private static contextStack: ITraceContext[] = [];
    private static stacks = new Map<string, ITraceContext[]>();

    static get current(): ITraceContext | undefined {
        return this.contextStack[this.contextStack.length - 1];
    }

    static getCurrentTraceId(): string | null {
        const ctx = this.current;
        return ctx?.traceId ?? null;
    }

    static run<T>(trace: Partial<ITraceContext>, fn: () => T): T {
        const parent = this.current;
        const traceId = trace.traceId ?? parent?.traceId ?? crypto.randomUUID();
        const ctx: ITraceContext = {
            traceId,
            spanId: crypto.randomUUID(),
            parentSpanId: parent?.spanId,
            correlationId: trace.correlationId ?? parent?.correlationId,
        };
        let stack = this.stacks.get(traceId);
        if (!stack) {
            stack = [];
            this.stacks.set(traceId, stack);
        }
        this.contextStack.push(ctx);
        stack.push(ctx);
        const doExit = () => {
            this.contextStack.pop();
            stack!.pop();
            if (stack!.length === 0) this.stacks.delete(traceId);
        };
        let isAsync = false;
        try {
            const result = fn();
            // H-31: Handle async functions — defer cleanup to promise.finally
            if (result instanceof Promise) {
                isAsync = true;
                (result as Promise<unknown>).finally(doExit);
            }
            return result;
        } finally {
            // H-31: If fn was sync, cleanup now. If async, cleanup is deferred.
            if (!isAsync) doExit();
        }
    }

    static enter(trace?: Partial<ITraceContext>): ITraceContext {
        const parent = this.current;
        const traceId = trace?.traceId ?? parent?.traceId ?? crypto.randomUUID();
        const ctx: ITraceContext = {
            traceId,
            spanId: crypto.randomUUID(),
            parentSpanId: parent?.spanId,
            correlationId: trace?.correlationId ?? parent?.correlationId,
        };
        let stack = this.stacks.get(traceId);
        if (!stack) {
            stack = [];
            this.stacks.set(traceId, stack);
        }
        this.contextStack.push(ctx);
        stack.push(ctx);
        return ctx;
    }

    static exit(): void {
        const ctx = this.contextStack.pop();
        if (!ctx) return;
        const stack = this.stacks.get(ctx.traceId);
        if (!stack) return;
        stack.pop();
        if (stack.length === 0) this.stacks.delete(ctx.traceId);
    }

    static wrap<T>(fn: () => T, trace?: Partial<ITraceContext>): T {
        try {
            this.enter(trace);
            return fn();
        } finally {
            this.exit();
        }
    }

    /**
     * Explicit async variant of `run()`. Returns `Promise<T>`.
     * Context cleanup is deferred until the promise settles.
     */
    static async runAsync<T>(trace: Partial<ITraceContext>, fn: () => Promise<T>): Promise<T> {
        this.enter(trace);
        try {
            return await fn();
        } finally {
            this.exit();
        }
    }

    static generateTraceId(): string {
        return `${Date.now().toString(36)}-${crypto.randomUUID()}`;
    }

    static clear(): void {
        this.contextStack = [];
        this.stacks.clear();
    }
}
