import type { ProjectRepository } from '../dal/project-repository';
import type { ProjectGraphService } from './project-graph/project-graph-service';
import { ensureFilePathTree } from './project-graph/file-tree-projection';
import { OPENCODE_INFO_PROJECT_ID } from './project-bootstrap';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('OpenCodeInfoSeed');

const CENTER_PATH = 'README.md';

interface ProjectArticle {
    path: string;
    title: string;
    body: string;
}

const ARTICLES: ProjectArticle[] = [
    {
        path: 'docs/cli.md',
        title: 'OpenCode CLI',
        body: `# OpenCode CLI

The \`opencode\` command starts the TUI and a local server. Key commands are
documented in Sidekick: /context, /status, /checkpoint, /sessions, /wiki,
/vault, /sync, /pr, /ci, /check.`,
    },
    {
        path: 'docs/api/server.md',
        title: 'OpenCode Server API',
        body: `# OpenCode Server API

Local HTTP server endpoints: /global/health, /session, /project,
/session/:id/command, /session/:id/prompt_async, /event (SSE). OpenAPI at /doc.`,
    },
    {
        path: 'docs/mcp/index.md',
        title: 'OpenCode MCP',
        body: `# MCP in OpenCode

MCP servers configured: Playwright, desk-mcp, codebase-memory, context7,
aios-tasks. Sidekick simplifies working with them. MCP status at /mcp.`,
    },
    {
        path: 'docs/sidekick.md',
        title: 'OpenCode Sidekick',
        body: `# OpenCode Sidekick

A lightweight external app: command cards, Skills/Tools/Hooks, Roadmaps,
Audits, Prompts. Run with: npm start (opencode-sidekick folder).`,
    },
    {
        path: 'docs/workflow/github.md',
        title: 'GitHub Workflow',
        body: `# GitHub Workflow

GitHub rules and commands: /sync (ff-only pull), /pr (PR, base=main), /ci
(Actions status). Commits go through commitlint, no force-push.`,
    },
    {
        path: 'docs/research/notes/paper.md',
        title: 'Research Notes',
        body: `# Research Notes

A nested article to demonstrate deep file hierarchy: project -> docs ->
research -> notes -> paper.md.`,
    },
    {
        path: 'docs/tools/runbook.md',
        title: 'Tools Runbook',
        body: `# Tools Runbook

Nested file: project -> docs -> tools -> runbook.md.`,
    },
];

const CENTER_BODY = `# OpenCode

OpenCode is the local AI agent and the foundation of our system. It manages
code access, sessions, MCP servers and integrations. In the OpenCodeInfo
project it is the central graph node, with links to articles and the site.

## Key subsystems

- CLI and server (HTTP API, OpenAPI)
- MCP integrations (Playwright, desk-mcp, codebase-memory, context7)
- Sidekick - command cheat sheet
- Workflows: /context, /status, /checkpoint, /sync, /pr, /ci
`;

const DEMO_SITE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>OpenCodeInfo</title>
<style>
 body { font-family: system-ui, sans-serif; background:#0e1016; color:#e8ebf4; margin:0; }
 main { max-width:720px; margin:0 auto; padding:2rem 1rem; }
 h1 { color:#5b8cff; } a { color:#7aa2ff; } .card { border:1px solid #2a3042; border-radius:12px; padding:1rem 1.25rem; margin:0.75rem 0; }
</style></head>
<body><main>
<h1>OpenCodeInfo</h1>
<p>Project-graph of the system: central OpenCode node + articles + site.</p>
<div class="card"><strong>OpenCode</strong> - the central node.
  Linked articles: CLI, API, MCP, Sidekick, Workflow and nested docs.</div>
<div class="card"><strong>Project site</strong> - this demo site is created
  by the OpenCodeInfo seed.</div>
</main></body></html>`;

export async function seedOpenCodeInfo(
    graph: ProjectGraphService,
    repo: ProjectRepository,
): Promise<{ files: number; nodes: number }> {
    const nowMs = Date.now();
    let filesCreated = 0;

    const files: Array<{ path: string; content: string }> = [
        { path: CENTER_PATH, content: CENTER_BODY },
        { path: 'index.html', content: DEMO_SITE_HTML },
        ...ARTICLES.map((a) => ({ path: a.path, content: a.body })),
    ];
    for (const f of files) {
        const existing = await repo.getFile(OPENCODE_INFO_PROJECT_ID, f.path);
        if (existing) continue;
        await repo.putFile({
            projectId: OPENCODE_INFO_PROJECT_ID,
            path: f.path,
            content: f.content,
            createdAt: nowMs,
            updatedAt: nowMs,
        });
        filesCreated++;
    }

    const pid = OPENCODE_INFO_PROJECT_ID;
    const { nodes } = await graph.listProject(pid);

    // Удаляем старые «прямые» contains-рёбра от проекта к демо-узлам
    // (файлы/папки), чтобы граф отражал только новую иерархию от центра.
    const demoIds = new Set(
        nodes
            .filter((n) => n.refType === 'project-file' || n.refType === 'project-dir')
            .map((n) => n.id),
    );
    const edges = await graph.listEdges(pid);
    for (const e of edges) {
        if (e.relation === 'contains' && e.from === pid && demoIds.has(e.to)) {
            await graph.removeEdge(e.id);
        }
    }

    // Центр: README.md — корень дерева.
    const center = await graph.upsertNode({
        projectId: pid,
        kind: 'concept',
        label: 'OpenCode',
        refType: 'project-file',
        refId: CENTER_PATH,
    });
    await graph.link({ projectId: pid, from: pid, to: center.id, relation: 'contains' });

    // Строим дерево от центра для всех демо-файлов (в т.ч. старых путей).
    const existingFiles = nodes
        .filter((n) => n.refType === 'project-file' && n.refId)
        .map((n) => n.refId as string);
    const paths = [...new Set([...existingFiles, ...files.map((f) => f.path)])];

    const fileIds = new Map<string, string>();
    fileIds.set(CENTER_PATH, center.id);
    for (const p of paths) {
        if (p === CENTER_PATH) continue;
        const { fileNodeId } = await ensureFilePathTree(graph, pid, p, { rootId: center.id });
        fileIds.set(p, fileNodeId);
    }

    // Убираем любые прямые рёбра от центра к не-корневым элементам
    // (путь содержит '/'), чтобы связи шли только через папки.
    const fresh = await graph.listProject(pid);
    const freshNodeById = new Map(fresh.nodes.map((n) => [n.id, n] as const));
    for (const e of fresh.edges) {
        if (e.from !== center.id) continue;
        const target = freshNodeById.get(e.to);
        if (
            target &&
            (target.refType === 'project-file' || target.refType === 'project-dir') &&
            target.refId &&
            target.refId.includes('/')
        ) {
            await graph.removeEdge(e.id);
        }
    }

    // Центр → сайт (корневой файл): семантическая связь «производит».
    const siteId = fileIds.get('index.html');
    if (siteId) {
        await graph.link({ projectId: pid, from: center.id, to: siteId, relation: 'produces' });
    }

    LOGGER.info('OpenCodeInfoSeed', 'seeded idempotently', {
        filesCreated,
        files: files.length,
        paths: paths.length,
    });
    return { files: filesCreated, nodes: paths.length };
}

/**
 * Контролируемый сброс демо-данных: полностью очищает граф OpenCodeInfo и
 * заново создаёт стартовый набор. Вызывать только явно (например, ручной
 * сброс из админки) — НЕ при обычном старте.
 */
export async function resetOpenCodeInfoDemo(
    graph: ProjectGraphService,
    repo: ProjectRepository,
): Promise<{ files: number; nodes: number }> {
    await graph.clearProject(OPENCODE_INFO_PROJECT_ID);
    return seedOpenCodeInfo(graph, repo);
}
