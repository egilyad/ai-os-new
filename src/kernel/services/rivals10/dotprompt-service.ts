/**
 * DotpromptService — P.1 (Genkit-style typed prompts, additive).
 *
 * Templates with `{{vars}}` plus input/output schemas as
 * `field: type` maps (string/number/boolean). Render validates inputs;
 * validateOutput checks outputs. Backed by PromptHubService storage
 * convention (own kv namespace `dotprompt/*` to keep schemas together).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IDotpromptService } from '../../contracts/rivals10';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Dotprompt');

interface DotpromptDoc {
    name: string;
    template: string;
    inputSchema: Record<string, string>;
    outputSchema: Record<string, string>;
}

const KNOWN = new Set(['string', 'number', 'boolean']);

export class DotpromptService implements IDotpromptService {
    constructor(private dal: DataAccessLayer, private promptHub?: { render(name: string, vars?: Record<string,string>): Promise<string> }) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async define(input: {
        name: string;
        template: string;
        inputSchema?: Record<string, string>;
        outputSchema?: Record<string, string>;
    }): Promise<void> {
        const check = (schema: Record<string, string> | undefined, label: string) => {
            for (const [k, t] of Object.entries(schema ?? {})) {
                if (!KNOWN.has(t)) throw new Error(`Bad ${label} type for ${k}: ${t} (string|number|boolean)`);
            }
        };
        check(input.inputSchema, 'input');
        check(input.outputSchema, 'output');
        const doc: DotpromptDoc = {
            name: input.name.slice(0, 120),
            template: input.template.slice(0, 12000),
            inputSchema: { ...(input.inputSchema ?? {}) },
            outputSchema: { ...(input.outputSchema ?? {}) },
        };
        await this.dal.kv.set(`dotprompt/${doc.name}`, doc);
    }

    async render(name: string, vars: Record<string, string> = {}): Promise<string> {
        // 6.5 unify: try PromptHub first (single source of truth when available)
        if (this.promptHub) {
            try { return await this.promptHub.render(name, vars); } catch { /* fall through to dotprompt */ }
        }
        const doc = await this.require(name);
        const missing: string[] = [];
        for (const [k, t] of Object.entries(doc.inputSchema)) {
            const v = vars[k];
            if (v === undefined) {
                missing.push(k);
                continue;
            }
            if (t === 'number' && Number.isNaN(Number(v))) missing.push(`${k} (not a number)`);
            if (t === 'boolean' && v !== 'true' && v !== 'false') missing.push(`${k} (not a boolean)`);
        }
        if (missing.length > 0) throw new Error(`Dotprompt ${name} missing/invalid inputs: ${missing.join(', ')}`);
        return doc.template.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => vars[k] ?? _m);
    }

    async validateOutput(name: string, output: unknown): Promise<{ ok: boolean; issues: string[] }> {
        const doc = await this.require(name);
        const issues: string[] = [];
        if (typeof output !== 'object' || output === null) {
            return { ok: Object.keys(doc.outputSchema).length === 0, issues: ['output is not an object'] };
        }
        const o = output as Record<string, unknown>;
        for (const [k, t] of Object.entries(doc.outputSchema)) {
            const v = o[k];
            if (v === undefined) {
                issues.push(`missing: ${k}`);
                continue;
            }
            if (t === 'string' && typeof v !== 'string') issues.push(`${k} not a string`);
            if (t === 'number' && typeof v !== 'number') issues.push(`${k} not a number`);
            if (t === 'boolean' && typeof v !== 'boolean') issues.push(`${k} not a boolean`);
        }
        return { ok: issues.length === 0, issues };
    }

    private async require(name: string): Promise<DotpromptDoc> {
        const doc = await this.dal.kv.get<DotpromptDoc>(`dotprompt/${name}`);
        if (!doc) throw new Error(`Dotprompt not found: ${name}`);
        return doc;
    }
}
