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
    assistantService,
    auditService,
    autonomyService,
    characterService,
    councilService,
    crewService,
    crystalVault,
    datasetService,
    dyadService,
    employeeService,
    evalService,
    federatedMemoryService,
    fleetMonitorService,
    flowApiService,
    frontierOpsService,
    guardrailService,
    groupChatService,
    hierarchyService,
    integrationsService,
    junctionEngine,
    knowledgeService,
    lensEngine,
    memoryBlocksService,
    metaAgentService,
    mobileAccessService,
    modesService,
    plannerService,
    promptLibraryService,
    promptVersionService,
    researchRunService,
    runQueueService,
    sandboxBrokerService,
    skillMarketService,
    sopService,
    sweService,
    toolGovernanceService,
    trainingService,
    wikiBrainService,
    searchService,
    writerService,
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
            research: researchRunService,
            wiki: {
                stats: async () => {
                    const [pages, sources] = await Promise.all([
                        wikiBrainService.store.listPages({ limit: 10000 }),
                        wikiBrainService.store.listSources({ limit: 10000 }),
                    ]);
                    return { pages: pages.length, sources: sources.length };
                },
                recentPages: async (limit = 10) => {
                    const pages = await wikiBrainService.store.listPages({ limit });
                    return pages.map((p) => ({
                        slug: p.slug,
                        title: p.frontmatter.title,
                        type: p.frontmatter.type,
                    }));
                },
                runLint: async () => (await wikiBrainService.lint.runAll()).length,
                enqueueSource: async ({ title, content }) => {
                    const encoder = new TextEncoder();
                    const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
                    const sha256 = Array.from(new Uint8Array(buffer))
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');
                    const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
                    const sourceId = `src-${uid()}`;
                    const taskId = `task-${uid()}`;
                    await wikiBrainService.store.putSource({
                        id: sourceId,
                        kind: 'markdown',
                        title,
                        origin: title,
                        sha256,
                        sizeBytes: content.length,
                        language: 'auto',
                        contentText: content,
                        meta: {},
                        importedAt: new Date().toISOString(),
                    });
                    await wikiBrainService.store.enqueue({
                        id: taskId,
                        sourceId,
                        status: 'pending',
                        attempts: 0,
                        priority: 0,
                    });
                    return { sourceId, taskId };
                },
                queueSummary: async () => {
                    const all = await wikiBrainService.store.listQueue();
                    const pending = all.filter((t) => t.status === 'pending').length;
                    return { pending, total: all.length };
                },
                search: async (query) => {
                    const results = await wikiBrainService.query.search(query, { topK: 5 });
                    return results.map((r) => ({
                        slug: r.page.slug,
                        title: r.page.frontmatter.title,
                        snippet: r.snippet.slice(0, 120),
                    }));
                },
                putCuratedPage: async ({ slug, title, body }) => {
                    const now = new Date().toISOString();
                    await wikiBrainService.store.putPage({
                        id: `pg-${crypto.randomUUID?.() ?? `${Date.now()}`}`,
                        slug,
                        frontmatter: {
                            slug,
                            title,
                            type: 'curated',
                            sources: [],
                            aliases: [],
                            tags: [],
                            language: 'en',
                            createdAt: now,
                            updatedAt: now,
                            reviewState: 'auto',
                            graphIn: 0,
                            graphOut: 0,
                        },
                        body,
                        sha256: '',
                        rawMarkdown: body,
                    });
                    return { slug };
                },
                runWorker: async () => {
                    await wikiBrainService.ingest.startQueueWorker();
                    const all = await wikiBrainService.store.listQueue();
                    const pending = all.filter((t) => t.status === 'pending').length;
                    return { pending, total: all.length };
                },
            },
            crews: {
                list: async () => {
                    const crews = await crewService.listCrews();
                    return crews.map((c) => ({
                        id: c.id,
                        name: c.name,
                        status: c.status,
                        process: c.process,
                    }));
                },
            },
            hierarchy: {
                tree: async () => {
                    const nodes = await hierarchyService.tree();
                    return nodes.map((n) => ({
                        id: n.id,
                        name: n.name,
                        parentId: n.parentId,
                        budgetCap: n.budgetCap,
                    }));
                },
            },
            governance: {
                servers: async () => {
                    const servers = await toolGovernanceService.listServers();
                    return servers.map((s) => ({
                        id: s.id,
                        name: s.name,
                        url: s.url,
                        enabled: s.enabled,
                    }));
                },
                grants: async () => {
                    const grants = await toolGovernanceService.listGrants();
                    return grants.map((g) => ({
                        agentId: g.agentId,
                        pattern: g.pattern,
                        allow: g.allow,
                    }));
                },
            },
            crystal: {
                list: async () => {
                    const crystals = await crystalVault.list();
                    return crystals.map((c) => ({
                        id: c.crystalId,
                        status: c.status,
                        domain: c.applicableDomain,
                        confidence: c.confidence,
                    }));
                },
                search: async (query) => {
                    const hits = await crystalVault.search(query);
                    return hits.map((h) => ({
                        id: h.crystalId,
                        domain: h.applicableDomain,
                        confidence: h.confidence,
                    }));
                },
            },
            junction: {
                list: async () => {
                    const junctions = await junctionEngine.list();
                    return junctions.map((j) => ({
                        id: j.id,
                        status: j.status,
                        synthesisType: j.synthesisType,
                        content: j.content,
                    }));
                },
            },
            lens: {
                list: async () => {
                    const lenses = lensEngine.listLenses();
                    return lenses.map((l) => ({
                        id: l.id,
                        name: l.name,
                        category: l.category,
                    }));
                },
            },
            meta: {
                proposals: async () => {
                    const proposals = await metaAgentService.listProposals();
                    return proposals.map((p) => ({
                        id: p.id,
                        kind: p.kind,
                        target: p.target,
                        status: p.status,
                    }));
                },
            },
            sandbox: {
                list: async () => {
                    const tickets = await sandboxBrokerService.list();
                    return tickets.map((t) => ({
                        id: t.id,
                        kind: t.kind,
                        agentId: t.agentId,
                        status: t.status,
                        purpose: t.purpose,
                    }));
                },
                request: async ({ kind, agentId, purpose }) => {
                    const ticket = await sandboxBrokerService.request({
                        kind: kind as 'browser' | 'computer',
                        agentId,
                        purpose,
                    });
                    return { id: ticket.id, status: ticket.status };
                },
            },
            skillMarket: {
                list: async () => {
                    const skills = await skillMarketService.list();
                    return skills.map((s) => ({
                        id: s.id,
                        name: s.name,
                        version: s.version,
                        installed: s.installed,
                    }));
                },
                install: async (id) => {
                    const skill = await skillMarketService.install(id);
                    return { id: skill.id, installed: skill.installed };
                },
            },
            fleet: {
                watches: async () => {
                    const watches = await fleetMonitorService.list();
                    return watches.map((w) => ({
                        id: w.id,
                        kind: w.kind,
                        label: w.label,
                        status: w.status,
                    }));
                },
            },
            mobile: {
                sessions: async () => {
                    const sessions = await mobileAccessService.listSessions();
                    return sessions.map((s) => ({
                        id: s.id,
                        deviceName: s.deviceName,
                        status: s.status,
                    }));
                },
                notifications: async () => {
                    const notifications = await mobileAccessService.listNotifications();
                    return notifications.map((n) => ({
                        id: n.id,
                        title: n.title,
                        read: n.read,
                    }));
                },
            },
            autonomy: {
                loops: async () => {
                    const loops = await autonomyService.listLoops();
                    return loops.map((l) => ({
                        id: l.id,
                        kind: l.kind,
                        goal: l.goal,
                        status: l.status,
                        iterations: l.iterations,
                    }));
                },
            },
            runQueue: {
                runs: async () => {
                    const runs = await runQueueService.list();
                    return runs.map((r) => ({
                        id: r.id,
                        kind: r.kind,
                        refId: r.refId,
                        status: r.status,
                    }));
                },
                toolkits: async () => {
                    const toolkits = await runQueueService.listToolkits();
                    return toolkits.map((t) => ({
                        id: t.id,
                        name: t.name,
                        prefixes: t.prefixes,
                    }));
                },
            },
            planner: {
                filters: async () => {
                    const filters = await plannerService.listFilters();
                    return filters;
                },
            },
            knowledge: {
                sources: async () => {
                    const sources = await knowledgeService.listSources();
                    return sources.map((s) => ({
                        id: s.id,
                        kind: s.kind,
                        title: s.title,
                        chunks: s.chunks.length,
                    }));
                },
            },
            training: {
                guides: async () => {
                    const guides = await trainingService.listGuides();
                    return guides.map((g) => ({
                        id: g.id,
                        role: g.role,
                        quality: g.quality,
                        runs: g.runs,
                    }));
                },
            },
            guardrails: {
                rules: async () => {
                    const rules = await guardrailService.listRules();
                    return rules.map((r) => ({
                        id: r.id,
                        name: r.name,
                        kind: r.kind,
                        tripwire: r.tripwire,
                    }));
                },
                check: async (text) => {
                    const result = await guardrailService.check(text);
                    return { ok: result.ok, hits: result.hits };
                },
            },
            sops: {
                list: async () => {
                    const sops = await sopService.listSops();
                    return sops.map((s) => ({
                        id: s.id,
                        name: s.name,
                        phases: s.phases.length,
                    }));
                },
            },
            modes: {
                list: async () => {
                    const modes = await modesService.listModes();
                    return modes.map((m) => ({
                        id: m.id,
                        name: m.name,
                        custom: m.custom,
                    }));
                },
            },
            memoryBlocks: {
                blocks: async (ownerId) => {
                    const blocks = await memoryBlocksService.getBlocks(ownerId);
                    return blocks.map((b) => ({
                        id: b.id,
                        section: b.section,
                        content: b.content,
                    }));
                },
            },
            integrations: {
                catalog: async () => {
                    const apps = await integrationsService.catalog();
                    return apps.map((a) => ({ name: a.name, auth: a.auth }));
                },
                connections: async () => {
                    const connections = await integrationsService.listConnections();
                    return connections.map((c) => ({
                        id: c.id,
                        app: c.app,
                        label: c.label,
                    }));
                },
            },
            datasets: {
                list: async () => {
                    const datasets = await datasetService.listDatasets();
                    return datasets;
                },
            },
            flowApi: {
                tokens: async () => {
                    const tokens = await flowApiService.listTokens();
                    return tokens;
                },
            },
            characters: {
                clients: async () => {
                    const clients = await characterService.listClients();
                    return clients;
                },
            },
            groupChat: {
                chats: async () => {
                    const chats = await groupChatService.listChats();
                    return chats.map((c) => ({
                        id: c.id,
                        name: c.name,
                        members: c.members.length,
                        status: c.status,
                    }));
                },
            },
            aiEmployees: {
                employees: async () => {
                    const employees = await employeeService.listEmployees();
                    return employees;
                },
            },
            aiAssistants: {
                assistants: async () => {
                    const assistants = await assistantService.listAssistants();
                    return assistants;
                },
            },
            webSearch: {
                search: async (query, limit = 5) => {
                    const hits = await searchService.search(query, limit);
                    return hits;
                },
            },
            writer: {
                check: async (text) => {
                    const result = await writerService.check(text);
                    return result;
                },
            },
            council: {
                sessions: async () => {
                    const sessions = await councilService.listSessions();
                    return sessions.map((s) => ({
                        id: s.id,
                        topic: s.topic,
                        phase: s.phase,
                        status: s.status,
                    }));
                },
            },
            eval: {
                benchmarks: async () => {
                    const benchmarks = await evalService.listBenchmarks();
                    return benchmarks.map((b) => ({
                        id: b.id,
                        name: b.name,
                        cases: b.cases.length,
                    }));
                },
                runs: async () => {
                    const runs = await evalService.listRuns();
                    return runs.map((r) => ({
                        id: r.id,
                        benchmarkId: r.benchmarkId,
                        subject: r.subject,
                        total: r.total,
                    }));
                },
                findings: async () => {
                    const findings = await evalService.listFindings();
                    return findings.map((f) => ({
                        id: f.id,
                        target: f.target,
                        attack: f.attack,
                        result: f.result,
                    }));
                },
            },
            frontierOps: {
                orgs: async () => {
                    const orgs = await frontierOpsService.listOrgs();
                    return orgs.map((o) => ({
                        id: o.id,
                        name: o.name,
                        status: o.status,
                        members: o.members.length,
                    }));
                },
                modals: async () => {
                    const modals = await frontierOpsService.listModals();
                    return modals.map((m) => ({
                        id: m.id,
                        modality: m.modality,
                        agentId: m.agentId,
                    }));
                },
            },
            dyads: {
                loops: async () => {
                    const loops = await dyadService.listLoops();
                    return loops.map((l) => ({
                        id: l.id,
                        kind: l.kind,
                        goal: l.goal,
                        status: l.status,
                    }));
                },
            },
            swe: {
                find: async (pattern) => {
                    const matches = await sweService.find(pattern);
                    return matches;
                },
            },
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
