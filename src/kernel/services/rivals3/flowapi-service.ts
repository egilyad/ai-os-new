/**
 * FlowApiService — H.1 (Langflow-style flows-as-API, additive).
 *
 * Bearer-ish tokens (random ids) map to graph ids in DAL kv. `invoke()`
 * runs the graph through the real GraphService and returns its result.
 * Revocation is instant. Tokens are capabilities — treat them as secrets.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IGraphService } from '../../contracts/graph';
import type { IFlowApiService } from '../../contracts/rivals3';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('FlowApi');

interface TokenDoc {
    token: string;
    graphId: string;
    label?: string;
    createdAt: number;
}

export class FlowApiService implements IFlowApiService {
    constructor(
        private dal: DataAccessLayer,
        private graphs: IGraphService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async publishToken(graphId: string, label?: string): Promise<string> {
        const graph = await this.graphs.getGraph(graphId);
        if (!graph) throw new Error(`Graph not found: ${graphId}`);
        const doc: TokenDoc = {
            token: genId('flowtok'),
            graphId,
            label: label?.slice(0, 120),
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`flowapi/${doc.token}`, doc);
        return doc.token;
    }

    async invoke(token: string, input: Record<string, unknown> = {}): Promise<string> {
        const doc = await this.dal.kv.get<TokenDoc>(`flowapi/${token}`);
        if (!doc) throw new Error('Invalid or revoked flow token');
        const run = await this.graphs.runGraph(doc.graphId, { ...input, via: 'flow-api' });
        if (run.status === 'paused') {
            return `Flow paused for approval (run ${run.id}). Approve in Fleet → Graphs.`;
        }
        return run.result ?? `Flow ended ${run.status}.`;
    }

    async listTokens(): Promise<Array<{ token: string; graphId: string; label?: string }>> {
        const rows = await this.dal.kv.list('flowapi/');
        return rows.map((r) => {
            const d = r.value as TokenDoc;
            return { token: d.token, graphId: d.graphId, label: d.label };
        });
    }

    async revoke(token: string): Promise<void> {
        await this.dal.kv.delete(`flowapi/${token}`);
    }
}
