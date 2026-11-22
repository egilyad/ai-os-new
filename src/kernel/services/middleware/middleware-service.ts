/**
 * Composable agent middleware (AgentScope-inspired, E1).
 *
 * Seven hooks around an agent run. Middleware is registered in order and can
 * mutate a shared per-run state (e.g. inject a hint, record a token budget,
 * rewrite a model choice). A failing middleware never breaks the chain — the
 * error is recorded in ctx.state for observability.
 */
import type {
    IMiddlewareService,
    AgentMiddleware,
    MiddlewareHook,
    MiddlewareContext,
} from '../../contracts/agent-middleware';

export class MiddlewareService implements IMiddlewareService {
    private middlewares: AgentMiddleware[] = [];

    async init(): Promise<void> {}

    async destroy(): Promise<void> {
        this.clear();
    }

    use(middleware: AgentMiddleware): void {
        const withoutDuplicate = this.middlewares.filter((m) => m.id !== middleware.id);
        withoutDuplicate.push(middleware);
        this.middlewares = withoutDuplicate;
    }

    remove(id: string): void {
        this.middlewares = this.middlewares.filter((m) => m.id !== id);
    }

    list(): AgentMiddleware[] {
        return [...this.middlewares];
    }

    async emit(
        hook: MiddlewareHook,
        input: Omit<MiddlewareContext, 'hook'>,
    ): Promise<MiddlewareContext> {
        const ctx: MiddlewareContext = { ...input, hook };
        const errors: string[] = (ctx.state['middlewareErrors'] as string[]) ?? [];
        for (const m of this.middlewares) {
            if (!m.hooks.includes(hook)) continue;
            try {
                await m.apply(ctx);
            } catch (e) {
                errors.push(`${m.id}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        if (errors.length > 0) ctx.state['middlewareErrors'] = errors;
        return ctx;
    }

    clear(): void {
        this.middlewares = [];
    }
}
