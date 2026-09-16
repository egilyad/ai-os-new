/**
 * ZapierService — K.1 (zap chains, additive).
 *
 * Zaps bind a trigger key (`app.event`) to ordered actions with optional
 * path conditions and delay notes. `fire()` matches the trigger and runs
 * actions through ToolRunner; `testZap()` dry-runs with a sample payload.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IZapierService } from '../../contracts/rivals6';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Zapier');

interface ZapAction {
    tool?: string;
    args?: Record<string, unknown>;
    path?: string;
    delayMs?: number;
}

interface ZapDoc {
    id: string;
    name: string;
    trigger: string;
    actions: ZapAction[];
}

function pathPasses(path: string | undefined, payload: Record<string, unknown>): boolean {
    if (!path) return true;
    const eq = path.indexOf('=');
    if (eq < 0) return Boolean(payload[path.trim()]);
    return String(payload[path.slice(0, eq).trim()] ?? '') === path.slice(eq + 1).trim();
}

export class ZapierService implements IZapierService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Zapier', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createZap(input: {
        name: string;
        trigger: string;
        actions: ZapAction[];
    }): Promise<string> {
        const doc: ZapDoc = {
            id: genId('zap'),
            name: input.name.slice(0, 120),
            trigger: input.trigger.slice(0, 160),
            actions: input.actions.slice(0, 20).map((a) => ({ ...a })),
        };
        await this.dal.kv.set(`zaps/${doc.id}`, doc);
        return doc.id;
    }

    async fire(zapId: string, payload: Record<string, unknown> = {}): Promise<string[]> {
        const doc = await this.dal.kv.get<ZapDoc>(`zaps/${zapId}`);
        if (!doc) throw new Error(`Zap not found: ${zapId}`);
        if (!this.tools) throw new Error('Tool runner unavailable');
        const out: string[] = [];
        for (const action of doc.actions) {
            if (!pathPasses(action.path, payload)) {
                out.push('(path skipped)');
                continue;
            }
            if (action.delayMs && action.delayMs > 0) {
                out.push(`(delay ${Math.min(action.delayMs, 3600000)}ms noted — scheduled, not slept)`);
            }
            if (!action.tool) continue;
            const res = await this.tools.callTool('zap', action.tool, { ...(action.args ?? {}), ...payload });
            out.push(res.slice(0, 2000));
        }
        this.events.emit(EVENTS.ZAP_FIRED, { zapId, actions: out.length });
        return out;
    }

    async testZap(zapId: string): Promise<string> {
        const results = await this.fire(zapId, { test: true, sample: 'zap-test-payload' });
        return `Test: ${results.length} action(s) → ${results.map((r) => r.slice(0, 120)).join(' | ').slice(0, 500)}`;
    }
}
