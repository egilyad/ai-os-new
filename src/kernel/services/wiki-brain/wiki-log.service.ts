import type { IWikiLogService } from '../../contracts/wiki-brain/wiki-log.service';
import type { IWikiStore } from '../../contracts/wiki-brain/wiki-store';
import type { TWikiLogEntry } from '../../contracts/wiki-brain/types';
import { wikiId } from './wiki-brain-dexie';

export class WikiLogService implements IWikiLogService {
    constructor(private store: IWikiStore) {}

    async append(entry: Omit<TWikiLogEntry, 'id' | 'ts'>): Promise<TWikiLogEntry> {
        const full: TWikiLogEntry = {
            ...entry,
            id: wikiId('log'),
            ts: new Date().toISOString(),
        };
        await this.store.appendLog(full);
        return full;
    }

    async list(opts?: { limit?: number; op?: TWikiLogEntry['op'] }) {
        return this.store.listLog(opts);
    }

    async materializeAsMarkdown(): Promise<string> {
        const entries = await this.store.listLog({ limit: 200 });
        const lines = ['# Wiki log', ''];
        for (const e of entries) {
            lines.push(`- ${e.ts} [${e.op}/${e.actor}] ${e.summary}`);
        }
        return lines.join('\n');
    }
}
