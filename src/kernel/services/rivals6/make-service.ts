/**
 * MakeService — K.1 (Make-style scenarios, additive).
 *
 * Linear modules with per-module filters (`field=value` gates), iterator
 * fan-out over arrays, aggregators (array/concat/sum), and error fallback
 * modules. Actions run through ToolRunner; everything threads one bundle.
 */
import type { IEventBus } from '../../types/interfaces';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IMakeService } from '../../contracts/rivals6';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Make');

interface MakeModule {
    id: string;
    tool?: string;
    args?: Record<string, unknown>;
    filter?: string;
    iterator?: string;
    aggregate?: 'array' | 'concat' | 'sum';
    onError?: string;
}

function getPath(obj: unknown, path: string): unknown {
    let cur: unknown = obj;
    for (const part of path.split('.')) {
        if (typeof cur !== 'object' || cur === null) return undefined;
        cur = (cur as Record<string, unknown>)[part];
    }
    return cur;
}

function passes(filter: string | undefined, bundle: Record<string, unknown>): boolean {
    if (!filter) return true;
    const eq = filter.indexOf('=');
    if (eq < 0) return Boolean(getPath(bundle, filter.trim()));
    return String(getPath(bundle, filter.slice(0, eq).trim()) ?? '') === filter.slice(eq + 1).trim();
}

export class MakeService implements IMakeService {
    constructor(
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async runScenario(input: {
        modules: MakeModule[];
        initial?: Record<string, unknown>;
    }): Promise<Record<string, unknown>> {
        if (!this.tools) throw new Error('Tool runner unavailable');
        let bundle: Record<string, unknown> = { ...(input.initial ?? {}) };
        const byId = new Map(input.modules.map((m) => [m.id, m]));

        for (const mod of input.modules) {
            if (!passes(mod.filter, bundle)) continue;
            // Iterator: run the same tool per array item, collect outputs.
            if (mod.iterator && mod.tool) {
                const items = getPath(bundle, mod.iterator);
                const list = Array.isArray(items) ? items : [items];
                const outs: unknown[] = [];
                for (const item of list.slice(0, 25)) {
                    try {
                        outs.push(await this.tools.callTool('make', mod.tool, { ...(mod.args ?? {}), item }));
                    } catch (e) {
                        outs.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
                    }
                }
                bundle[`out:${mod.id}`] = this.aggregate(mod.aggregate ?? 'array', outs);
                continue;
            }
            if (!mod.tool) continue;
            try {
                const out = await this.tools.callTool('make', mod.tool, { ...(mod.args ?? {}), ...bundle });
                bundle[`out:${mod.id}`] = out;
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (mod.onError && byId.has(mod.onError)) {
                    const fallback = byId.get(mod.onError)!;
                    if (fallback.tool) {
                        try {
                            bundle[`out:${mod.id}`] = await this.tools.callTool('make', fallback.tool, {
                                ...(fallback.args ?? {}),
                                error: msg,
                            });
                            continue;
                        } catch {
                            // fall through to rethrow original
                        }
                    }
                }
                throw new Error(`Module ${mod.id} failed: ${msg}`);
            }
        }
        this.events.emit(EVENTS.MAKE_RUN, { modules: input.modules.length });
        return bundle;
    }

    private aggregate(mode: 'array' | 'concat' | 'sum', outs: unknown[]): unknown {
        if (mode === 'concat') return outs.map((o) => String(o)).join('\n');
        if (mode === 'sum') return outs.reduce<number>((a, o) => a + (Number(o) || 0), 0);
        return outs;
    }
}
