/**
 * AssetService — K.2 (Dagster-style data assets, additive).
 *
 * Assets declare deps + a materializer tool; materialize() walks deps
 * topologically (cycle-guarded) and records lineage through ProvenanceService
 * plus freshness timestamps in kv.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IProvenanceService } from '../../contracts/trust';
import type { IAssetService } from '../../contracts/rivals6';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Assets');

interface AssetDoc {
    name: string;
    deps: string[];
    tool?: string;
}

export class AssetService implements IAssetService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
        private provenance?: IProvenanceService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineAsset(name: string, deps: string[] = [], tool?: string): Promise<void> {
        const doc: AssetDoc = { name: name.slice(0, 120), deps: deps.slice(0, 20), tool };
        await this.dal.kv.set(`assets-def/${doc.name}`, doc);
    }

    async materialize(name: string): Promise<string> {
        const order = await this.topo(name);
        const outputs: string[] = [];
        for (const asset of order) {
            const def = await this.dal.kv.get<AssetDoc>(`assets-def/${asset}`);
            let out = '(no materializer)';
            if (def?.tool && this.tools) {
                out = await this.tools.callTool('assets', def.tool, { asset });
            }
            await this.dal.kv.set(`assets-value/${asset}`, { value: out.slice(0, 4000), at: Date.now() });
            if (this.provenance) {
                try {
                    const node = await this.provenance.addNode('data', `asset:${asset}`);
                    for (const dep of def?.deps ?? []) {
                        const depNode = await this.provenance.addNode('data', `asset:${dep}`);
                        await this.provenance.link(depNode.id, node.id, 'derived_from');
                    }
                } catch (e) {
                    LOGGER.warn('lineage failed', { error: e instanceof Error ? e.message : String(e) });
                }
            }
            outputs.push(`${asset}: ok`);
        }
        this.events.emit(EVENTS.ASSET_BUILT, { asset: name, count: order.length });
        return outputs.join('\n');
    }

    async lineage(name: string): Promise<{ nodes: string[]; edges: Array<[string, string]> }> {
        const order = await this.topo(name);
        const edges: Array<[string, string]> = [];
        for (const asset of order) {
            const def = await this.dal.kv.get<AssetDoc>(`assets-def/${asset}`);
            for (const dep of def?.deps ?? []) edges.push([dep, asset]);
        }
        return { nodes: order, edges };
    }

    async freshness(name: string): Promise<number | null> {
        const v = await this.dal.kv.get<{ value: string; at: number }>(`assets-value/${name}`);
        return v ? Date.now() - v.at : null;
    }

    private async topo(root: string): Promise<string[]> {
        const order: string[] = [];
        const visiting = new Set<string>();
        const visit = async (name: string): Promise<void> => {
            if (order.includes(name)) return;
            if (visiting.has(name)) throw new Error(`Asset cycle at ${name}`);
            visiting.add(name);
            const def = await this.dal.kv.get<AssetDoc>(`assets-def/${name}`);
            if (!def) throw new Error(`Asset not found: ${name}`);
            for (const dep of def.deps) await visit(dep);
            visiting.delete(name);
            order.push(name);
        };
        await visit(root);
        return order;
    }
}
