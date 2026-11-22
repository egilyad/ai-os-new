import type { ILifecycle } from './lifecycle';

export type MiddlewareHook =
    | 'beforeModel'
    | 'beforeCall'
    | 'afterCall'
    | 'beforeTool'
    | 'afterTool'
    | 'onError'
    | 'afterReply';

export interface MiddlewareContext {
    hook: MiddlewareHook;
    agentId?: string;
    payload: Record<string, unknown>;
    /** Mutable state shared between hooks of a single run. */
    state: Record<string, unknown>;
    error?: unknown;
}

export interface AgentMiddleware {
    readonly id: string;
    readonly hooks: MiddlewareHook[];
    apply(ctx: MiddlewareContext): Promise<void> | void;
}

/** Composable 7-hook middleware lifecycle around an agent run (AgentScope E1). */
export interface IMiddlewareService extends ILifecycle {
    use(middleware: AgentMiddleware): void;
    remove(id: string): void;
    list(): AgentMiddleware[];
    /** Run the hook chain in registration order; errors are isolated per middleware. */
    emit(hook: MiddlewareHook, ctx: Omit<MiddlewareContext, 'hook'>): Promise<MiddlewareContext>;
    clear(): void;
}
