/**
 * Phase 42 — Rival parity 10 (Roadmap Phase P, §RIVALS10_COMPARE.md).
 *
 * Registers (no Dexie changes — kv + existing tables only):
 *   - `a2aSpecService` (AgentCards, task states, artifacts, SSE, push)
 *   - `cacheRegistryService` (context-cache entries + TTL sweep)
 *   - `dotpromptService` (typed templates + validation)
 *   - `notebookService` (notebooks, audio scripts, mindmaps)
 *   - `liveBridgeService` (barge-in/resume + live tool bridge)
 *   - `assistService` (smart replies, next actions, knowledge)
 *   - `vertexSearchService` (datastore + boost/bury)
 *   - `deepResearchService` (plan + brief)
 *   - `quotaGuardService` (per-key quotas)
 *   - `studioPackService` (agent packs, MCP quick-add, KB, translate)
 *
 * Warehouse seeding (P.3): 3 safe tools into ToolRunner + 5 skill
 * manifests into SkillMarket, idempotent, best-effort (never throws).
 */
import type { Phase, PhaseContext } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal/types';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IKnowledgeService, IToolRunnerService } from '../contracts/parity';
import type { IRagService } from '../contracts/rivals2';
import type { IDatasetService } from '../contracts/rivals3';
import type { IGraphService } from '../contracts/graph';
import type { ICrewService } from '../contracts/crew';
import type { IPersonaService } from '../contracts/persona';
import type { MCPService } from '../services/mcp-service';
import type { ISkillMarketService } from '../contracts/ops';
import type { IMobileAccessService } from '../contracts/ops';
import { A2aSpecService } from '../services/rivals10/a2aspec-service';
import { CacheRegistryService } from '../services/rivals10/cache-service';
import { DotpromptService } from '../services/rivals10/dotprompt-service';
import { NotebookService } from '../services/rivals10/notebook-service';
import { LiveBridgeService } from '../services/rivals10/livebridge-service';
import { AssistService } from '../services/rivals10/assist-service';
import { VertexSearchService } from '../services/rivals10/vertexsearch-service';
import { DeepResearchService } from '../services/rivals10/deepresearch-service';
import { QuotaGuardService } from '../services/rivals10/quotaguard-service';
import { StudioPackService } from '../services/rivals10/studiopack-service';

function llmOf(c: IContainer): ILLMClientService | undefined {
    return c.has('llmClientService') ? c.get<ILLMClientService>('llmClientService') : undefined;
}

function dalOf(c: IContainer): DataAccessLayer {
    return c.get<DataAccessLayer>('dal');
}

function eventsOf(c: IContainer): IEventBus {
    return c.get<IEventBus>('eventBus');
}

const WAREHOUSE_SKILLS = [
    { name: 'Deep Researcher', description: 'Plan → gather → verify → brief with citations.', permissions: ['knowledge.search', 'http.fetch'] },
    { name: 'Code Reviewer', description: 'Security + perf + style review of diffs.', permissions: ['workspace.read', 'workspace.search'] },
    { name: 'Translator', description: 'Glossary-aware translation between languages.', permissions: [] },
    { name: 'Summarizer', description: 'Extractive + abstractive summaries with citations.', permissions: ['knowledge.search'] },
    { name: 'Repo Guide', description: 'Codebase Q&A with file:line citations.', permissions: ['workspace.search', 'workspace.read'] },
];

function seedWarehouses(c: IContainer): void {
    // Fire-and-forget: tools + skills must never break container boot.
    void (async () => {
        try {
            if (c.has('toolRunnerService')) {
                const runner = c.get<IToolRunnerService>('toolRunnerService');
                const existing = new Set(runner.listTools().map((t) => t.name));
                const str = (v: unknown): string => (typeof v === 'string' ? v : '');
                if (!existing.has('json.get')) {
                    runner.addTool({
                        name: 'json.get',
                        description: 'Get a value from a JSON document by dotted path.',
                        parameters: {
                            type: 'object',
                            properties: { doc: { type: 'string' }, path: { type: 'string' } },
                            required: ['doc', 'path'],
                        },
                        run: async (args) => {
                            let parsed: unknown;
                            try {
                                parsed = JSON.parse(str(args['doc']));
                            } catch {
                                throw new Error('Invalid JSON document');
                            }
                            let cur: unknown = parsed;
                            for (const part of str(args['path']).split('.')) {
                                if (typeof cur !== 'object' || cur === null) return 'undefined';
                                cur = (cur as Record<string, unknown>)[part];
                            }
                            return JSON.stringify(cur ?? null).slice(0, 4000);
                        },
                    });
                }
                if (!existing.has('text.stats')) {
                    runner.addTool({
                        name: 'text.stats',
                        description: 'Word/line/char counts and top terms of a text.',
                        parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
                        run: async (args) => {
                            const text = str(args['text']);
                            const words = text.toLowerCase().split(/[^a-zа-яё0-9]+/u).filter((w) => w.length > 2);
                            const counts = new Map<string, number>();
                            for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
                            const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
                            return JSON.stringify({
                                chars: text.length,
                                lines: text.split('\n').length,
                                words: words.length,
                                top,
                            });
                        },
                    });
                }
                if (!existing.has('list.unique')) {
                    runner.addTool({
                        name: 'list.unique',
                        description: 'Deduplicate a JSON array (primitives), preserving order.',
                        parameters: { type: 'object', properties: { items: { type: 'array' } }, required: ['items'] },
                        run: async (args) => {
                            const items = Array.isArray(args['items']) ? (args['items'] as unknown[]) : [];
                            const seen = new Set<string>();
                            const out: unknown[] = [];
                            for (const item of items.slice(0, 1000)) {
                                const key = JSON.stringify(item);
                                if (!seen.has(key)) {
                                    seen.add(key);
                                    out.push(item);
                                }
                            }
                            return JSON.stringify(out).slice(0, 6000);
                        },
                    });
                }
            }
        } catch {
            // best-effort seeding
        }
        try {
            if (c.has('skillMarketService')) {
                const market = c.get<ISkillMarketService>('skillMarketService');
                const existing = new Set((await market.list()).map((s) => s.name));
                for (const skill of WAREHOUSE_SKILLS) {
                    if (!existing.has(skill.name)) {
                        await market.publish({
                            name: skill.name,
                            version: '1.0.0',
                            description: skill.description,
                            permissions: skill.permissions,
                            entry: 'warehouse.ts',
                            author: 'warehouse-seed',
                        });
                    }
                }
            }
        } catch {
            // best-effort seeding
        }
    })();
}

export const registerPhase42: Phase = ({ register }, ctx: PhaseContext) => {
    register('a2aSpecService', (c: IContainer) => {
        return new A2aSpecService(dalOf(c), eventsOf(c));
    });

    register('cacheRegistryService', (c: IContainer) => {
        return new CacheRegistryService(dalOf(c), eventsOf(c));
    });

    register('dotpromptService', (c: IContainer) => {
        // 6.5 unify: dotprompt tries PromptHub first
        const hub = c.has('promptHubService') ? c.get<{ render(name: string, vars?: Record<string,string>): Promise<string> }>('promptHubService') : undefined;
        return new DotpromptService(dalOf(c), hub as never);
    });

    register('notebookService', (c: IContainer) => {
        return new NotebookService(
            dalOf(c),
            eventsOf(c),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
            llmOf(c),
        );
    });

    register('liveBridgeService', (c: IContainer) => {
        return new LiveBridgeService(
            dalOf(c),
            eventsOf(c),
            c.has('toolRunnerService') ? c.get<IToolRunnerService>('toolRunnerService') : undefined,
        );
    });

    register('assistService', (c: IContainer) => {
        return new AssistService(
            llmOf(c),
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
        );
    });

    register('vertexSearchService', (c: IContainer) => {
        return new VertexSearchService(
            dalOf(c),
            c.has('datasetService') ? c.get<IDatasetService>('datasetService') : undefined,
        );
    });

    register('deepResearchService', (c: IContainer) => {
        return new DeepResearchService(
            eventsOf(c),
            c.has('ragService') ? c.get<IRagService>('ragService') : undefined,
            llmOf(c),
        );
    });

    register('quotaGuardService', (c: IContainer) => {
        return new QuotaGuardService(
            dalOf(c),
            eventsOf(c),
            c.has('mobileAccessService') ? c.get<IMobileAccessService>('mobileAccessService') : undefined,
        );
    });

    register('studioPackService', (c: IContainer) => {
        return new StudioPackService(
            eventsOf(c),
            c.get<ICrewService>('crewService'),
            c.has('personaService') ? c.get<IPersonaService>('personaService') : undefined,
            c.has('mcpService') ? c.get<MCPService>('mcpService') : undefined,
            c.has('knowledgeService') ? c.get<IKnowledgeService>('knowledgeService') : undefined,
            llmOf(c),
        );
    });

    seedWarehouses(ctx.container);
};
