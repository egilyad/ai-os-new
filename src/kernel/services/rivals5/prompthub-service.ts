/**
 * PromptHubService — J.1 (LangSmith-style prompt hub, additive).
 *
 * Versioned prompt templates in DAL kv (`prompts/<name>/<version>`).
 * render() substitutes {{vars}} and fails loudly on missing keys
 * (prompt bugs should surface, not silently ship).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IPromptHubService } from '../../contracts/rivals5';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('PromptHub');

export class PromptHubService implements IPromptHubService {
    constructor(private dal: DataAccessLayer) {}

    async init(): Promise<void> {
        LOGGER.info('PromptHub', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async publish(name: string, template: string): Promise<number> {
        const key = name.slice(0, 120);
        const meta = (await this.dal.kv.get<{ versions: number }>(`prompts/${key}/meta`)) ?? { versions: 0 };
        const version = meta.versions + 1;
        await this.dal.kv.set(`prompts/${key}/${version}`, template.slice(0, 12000));
        await this.dal.kv.set(`prompts/${key}/meta`, { versions: version });
        return version;
    }

    async render(name: string, vars: Record<string, string> = {}, version?: number): Promise<string> {
        const key = name.slice(0, 120);
        const meta = (await this.dal.kv.get<{ versions: number }>(`prompts/${key}/meta`)) ?? { versions: 0 };
        if (meta.versions === 0) throw new Error(`Prompt not found: ${name}`);
        const v = version ?? meta.versions;
        const template = await this.dal.kv.get<string>(`prompts/${key}/${v}`);
        if (typeof template !== 'string') throw new Error(`Prompt ${name} v${v} not found`);
        const missing: string[] = [];
        const out = template.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
            if (vars[k] === undefined) {
                missing.push(k);
                return _m;
            }
            return vars[k] as string;
        });
        if (missing.length > 0) throw new Error(`Missing prompt vars: ${[...new Set(missing)].join(', ')}`);
        return out;
    }

    async listPrompts(): Promise<Array<{ name: string; versions: number }>> {
        const rows = await this.dal.kv.list('prompts/');
        const byName = new Map<string, number>();
        for (const r of rows) {
            const parts = r.id.split('/');
            if (parts.length === 3 && parts[2] === 'meta') {
                byName.set(parts[1] as string, (r.value as { versions: number }).versions);
            }
        }
        return [...byName.entries()].map(([name, versions]) => ({ name, versions }));
    }
}
