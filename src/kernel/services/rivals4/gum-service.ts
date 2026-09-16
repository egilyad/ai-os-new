/**
 * GumService — I.3 (Gumloop-style forms + for-each + vault refs, additive).
 *
 * Forms collect named inputs (kv); forEach fans a crew/graph run per item
 * and aggregates results; vaultRef returns a stored reference NAME
 * (secrets never live here — same rule as credential_ref).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { ICrewService } from '../../contracts/crew';
import type { IGraphService } from '../../contracts/graph';
import type { IGumService } from '../../contracts/rivals4';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Gum');

export class GumService implements IGumService {
    constructor(
        private dal: DataAccessLayer,
        private crews?: ICrewService,
        private graphs?: IGraphService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Gum', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineForm(formId: string, fields: string[]): Promise<void> {
        await this.dal.kv.set(`gumform/${formId.slice(0, 120)}`, {
            fields: fields.map((f) => f.slice(0, 80)).slice(0, 30),
        });
    }

    async submitForm(formId: string, values: Record<string, string>): Promise<void> {
        const def = await this.dal.kv.get<{ fields: string[] }>(`gumform/${formId}`);
        if (!def) throw new Error(`Form not found: ${formId}`);
        const clean: Record<string, string> = {};
        for (const f of def.fields) {
            clean[f] = (values[f] ?? '').slice(0, 2000);
        }
        await this.dal.kv.set(`gumform-values/${formId}`, clean);
    }

    async forEach(items: string[], kind: 'crew' | 'graph', refId: string): Promise<string[]> {
        const list = items.slice(0, 20);
        const out: string[] = [];
        for (const item of list) {
            try {
                if (kind === 'crew') {
                    if (!this.crews) throw new Error('crew runner unavailable');
                    const res = await this.crews.startCrew(refId);
                    out.push(`${item} → crew ${res.status}`);
                } else {
                    if (!this.graphs) throw new Error('graph runner unavailable');
                    const res = await this.graphs.runGraph(refId, { item });
                    out.push(`${item} → graph ${res.status}`);
                }
            } catch (e) {
                out.push(`${item} → failed (${e instanceof Error ? e.message : String(e)})`);
            }
        }
        return out;
    }

    async vaultRef(key: string): Promise<string> {
        const name = key.slice(0, 160);
        const stored = await this.dal.kv.get<string>(`vault-refs/${name}`);
        if (!stored) {
            await this.dal.kv.set(`vault-refs/${name}`, name);
        }
        LOGGER.debug('Gum', 'vault ref resolved', { key: name });
        return name;
    }
}
