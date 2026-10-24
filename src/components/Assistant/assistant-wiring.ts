/**
 * Assistant wiring — the interface side of the assistant.
 *
 * The kernel owns the assistant's brain and its kernel-level actions. Two
 * things can only come from here:
 *  1. the wiki corpus — the kernel must not import `src/components`;
 *  2. the UI-owned actions (keys, MCP, skills) and the navigation channel —
 *     they drive the application, not the runtime.
 */
import {
    assistantActionRegistry,
    panelActionRegistry,
    projectKnowledgeService,
    keyService,
    mcpService,
    skillService,
} from '../../kernel/instances/services-core';
import { WIKI_ARTICLES } from '../WikiPanel/wiki-articles';
import {
    ensurePanelActionCatalog,
    setPanelActionExtrasServices,
} from './panel-actions-catalog';
import {
    auditService,
    federatedMemoryService,
    promptLibraryService,
    promptVersionService,
} from '../../kernel/instances/services-extras';

let wired = false;

function articleCorpus() {
    return WIKI_ARTICLES.map((a) => ({
        slug: a.slug,
        title: a.title,
        section: a.section,
        body: a.body,
        freshness: String(a.freshness ?? ''),
        sources: a.sources,
        related: a.related,
        tags: a.tags,
    }));
}

/** Idempotent: safe to call from every mount of the assistant panel. */
export function ensureAssistantWiring(): void {
    if (wired) return;
    wired = true;

    try {
        projectKnowledgeService.setCorpusProvider(articleCorpus);
    } catch {
        /* container not ready — the assistant works without articles */
    }

    // The panels can only advertise their capabilities from here: the kernel
    // must not import UI singletons. `panel.list/read/act` reach all of them.
    try {
        // The prompts / federation services are injected rather than imported
        // by the catalog, so the catalog stays cheap for its unit test.
        setPanelActionExtrasServices({
            federated: federatedMemoryService,
            prompts: promptLibraryService,
            promptVersions: promptVersionService,
            audit: auditService,
        });
        ensurePanelActionCatalog(panelActionRegistry);
    } catch {
        /* catalog is optional — the kernel actions still work */
    }

    try {
        assistantActionRegistry.attachUiActions({
                keys: {
                    getKeys: () =>
                        keyService.getKeys().map((k) => ({
                            id: k.id,
                            provider: k.provider,
                            status: String(k.status ?? 'unknown'),
                        })),
                    checkHealth: async (keyId?: string) => {
                        const health = await keyService.checkHealth(keyId);
                        return {
                            id: health.id,
                            status: String(health.status ?? 'unknown'),
                            latency: health.latency,
                        };
                    },
                },
                mcp: {
                    listServers: async () => {
                        const servers = mcpService.getServers();
                        return servers.map((s) => ({
                            id: s.id,
                            name: s.name,
                            status: s.status,
                            tools: s.capabilities,
                        }));
                    },
                },
                skills: {
                    getSkills: () =>
                        skillService.getSkills().map((s) => ({
                            id: s.id,
                            name: s.name,
                            description: s.description,
                        })),
                },
            });
    } catch {
        /* UI services are optional; the kernel actions still work */
    }
}
