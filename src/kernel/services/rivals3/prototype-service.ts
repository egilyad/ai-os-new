/**
 * PrototypeService — H.3 (Voiceflow-style CMS + funnels + share export).
 *
 * CMS content slots (kv), step→step funnel counters (kv), and shareable
 * transcript exports (JSON envelope with title/lines/timestamp).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IPrototypeService } from '../../contracts/rivals3';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Prototype');

export class PrototypeService implements IPrototypeService {
    constructor(private dal: DataAccessLayer) {}

    async init(): Promise<void> {
        LOGGER.info('Prototype', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async setSlot(key: string, value: string): Promise<void> {
        await this.dal.kv.set(`cms/${key.slice(0, 160)}`, value.slice(0, 4000));
    }

    async getSlot(key: string): Promise<string | null> {
        const v = await this.dal.kv.get<string>(`cms/${key.slice(0, 160)}`);
        return v ?? null;
    }

    async funnelStep(funnel: string, step: string): Promise<void> {
        const key = `funnel/${funnel.slice(0, 80)}/${step.slice(0, 80)}`;
        const hits = ((await this.dal.kv.get<number>(key)) ?? 0) + 1;
        await this.dal.kv.set(key, hits);
    }

    async funnelStats(funnel: string): Promise<Record<string, number>> {
        const rows = await this.dal.kv.list(`funnel/${funnel.slice(0, 80)}/`);
        const out: Record<string, number> = {};
        for (const r of rows) {
            const step = r.id.split('/').pop() ?? r.id;
            out[step] = r.value as number;
        }
        return out;
    }

    async exportTranscript(title: string, lines: string[]): Promise<string> {
        const envelope = {
            kind: 'prototype-transcript',
            version: 1,
            id: genId('proto'),
            title: title.slice(0, 200),
            lines: lines.map((l) => l.slice(0, 2000)).slice(0, 500),
            exportedAt: Date.now(),
        };
        return JSON.stringify(envelope, null, 2);
    }
}
