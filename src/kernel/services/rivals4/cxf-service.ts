/**
 * CxfService — I.1 (Dialogflow CX-style flows/pages/routes, additive).
 *
 * Flows contain pages (entry messages); routes match intent→page with
 * overlap NLU; parameters fill per scope (flow/session) via follow-up text;
 * fulfillment runs a ToolRunner tool or best-effort webhook. All in kv.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ICxfService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('CXF');

interface CxfPage {
    id: string;
    name: string;
    entryMessage?: string;
}

interface CxfRoute {
    id: string;
    fromPage: string;
    intent: string;
    toPage: string;
}

interface FlowDoc {
    id: string;
    name: string;
    pages: CxfPage[];
    routes: CxfRoute[];
    startPage: string;
}

function tokens(s: string): Set<string> {
    return new Set(s.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((t) => t.length > 2));
}

function overlap(a: string, b: string): number {
    const sa = tokens(a);
    if (sa.size === 0) return 0;
    const sb = tokens(b);
    let hit = 0;
    for (const t of sa) if (sb.has(t)) hit += 1;
    return hit / sa.size;
}

export class CxfService implements ICxfService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createFlow(name: string): Promise<string> {
        const startPage = genId('page');
        const doc: FlowDoc = {
            id: genId('flow'),
            name: name.slice(0, 120),
            pages: [{ id: startPage, name: 'Start' }],
            routes: [],
            startPage,
        };
        await this.dal.kv.set(`cxf/${doc.id}`, doc);
        return doc.id;
    }

    async addPage(flowId: string, name: string, entryMessage?: string): Promise<string> {
        const doc = await this.require(flowId);
        const page: CxfPage = { id: genId('page'), name: name.slice(0, 120), entryMessage: entryMessage?.slice(0, 1000) };
        doc.pages.push(page);
        await this.dal.kv.set(`cxf/${flowId}`, doc);
        return page.id;
    }

    async addRoute(flowId: string, fromPage: string, intent: string, toPage: string): Promise<void> {
        const doc = await this.require(flowId);
        const ids = new Set(doc.pages.map((p) => p.id));
        if (!ids.has(fromPage) || !ids.has(toPage)) throw new Error('Route references unknown page');
        doc.routes.push({ id: genId('route'), fromPage, intent: intent.slice(0, 200), toPage });
        await this.dal.kv.set(`cxf/${flowId}`, doc);
    }

    async handleMessage(
        flowId: string,
        sessionId: string,
        text: string,
        params: Record<string, unknown> = {},
    ): Promise<string> {
        const doc = await this.require(flowId);
        const stateKey = `cxf-state/${flowId}/${sessionId}`;
        const state = (await this.dal.kv.get<{ page: string; params: Record<string, unknown> }>(stateKey)) ?? {
            page: doc.startPage,
            params: {},
        };
        Object.assign(state.params, params);
        // Match routes from the current page by intent overlap.
        let best: CxfRoute | undefined;
        let bestScore = 0.25;
        for (const r of doc.routes.filter((x) => x.fromPage === state.page)) {
            const s = overlap(text, r.intent);
            if (s > bestScore) {
                bestScore = s;
                best = r;
            }
        }
        if (best) {
            state.page = best.toPage;
            await this.dal.kv.set(stateKey, state);
            this.events.emit(EVENTS.CX_ROUTE, { flowId, toPage: best.toPage });
        }
        const page = doc.pages.find((p) => p.id === state.page);
        // Fulfillment: `fulfill:toolName` marker in entry message runs a tool.
        const entry = page?.entryMessage ?? '(silence)';
        const fulfill = entry.match(/fulfill:([a-zA-Z0-9_.-]+)/);
        if (fulfill && this.tools) {
            try {
                const out = await this.tools.callTool('cx-fulfillment', fulfill[1] as string, { text, ...state.params });
                return `${entry}\n→ ${out.slice(0, 1000)}`;
            } catch (e) {
                return `${entry}\n(fulfillment failed: ${e instanceof Error ? e.message : String(e)})`;
            }
        }
        return entry;
    }

    private async require(id: string): Promise<FlowDoc> {
        const doc = await this.dal.kv.get<FlowDoc>(`cxf/${id}`);
        if (!doc) throw new Error(`Flow not found: ${id}`);
        return doc;
    }
}
