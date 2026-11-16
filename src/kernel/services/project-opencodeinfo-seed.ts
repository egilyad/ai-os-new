import type { ProjectRepository } from '../dal/project-repository';
import type { ProjectGraphService } from './project-graph/project-graph-service';
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
        path: 'docs/server-api.md',
        title: 'OpenCode Server API',
        body: `# OpenCode Server API

Local HTTP server endpoints: /global/health, /session, /project,
/session/:id/command, /session/:id/prompt_async, /event (SSE). OpenAPI at /doc.`,
    },
    {
        path: 'docs/mcp.md',
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
        path: 'docs/workflow.md',
        title: 'GitHub Workflow',
        body: `# GitHub Workflow

GitHub rules and commands: /sync (ff-only pull), /pr (PR, base=main), /ci
(Actions status). Commits go through commitlint, no force-push.`,
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
  Linked articles: CLI, Server API, MCP, Sidekick, Workflow.</div>
<div class="card"><strong>Project site</strong> - this demo site is created
  by the OpenCodeInfo seed.</div>
</main></body></html>`;

export async function seedOpenCodeInfo(
    graph: ProjectGraphService,
    repo: ProjectRepository,
): Promise<{ files: number }> {
    let before = -1;
    try {
        const { nodes } = await graph.listProject(OPENCODE_INFO_PROJECT_ID);
        before = nodes.length;
    } catch (e) {
        LOGGER.warn('OpenCodeInfoSeed', 'listProject failed', { error: String(e) });
    }
    if (before !== 0) {
        LOGGER.info('OpenCodeInfoSeed', 'clearing previous graph', { before });
    }
    await graph.clearProject(OPENCODE_INFO_PROJECT_ID);

    const nowMs = Date.now();

    const files: Array<{ path: string; content: string }> = [
        { path: CENTER_PATH, content: CENTER_BODY },
        { path: 'index.html', content: DEMO_SITE_HTML },
        ...ARTICLES.map((a) => ({ path: a.path, content: a.body })),
    ];
    for (const f of files) {
        await repo.putFile({
            projectId: OPENCODE_INFO_PROJECT_ID,
            path: f.path,
            content: f.content,
            createdAt: nowMs,
            updatedAt: nowMs,
        });
    }

    const center = await graph.upsertNode({
        projectId: OPENCODE_INFO_PROJECT_ID,
        kind: 'concept',
        label: 'OpenCode',
        refType: 'project-file',
        refId: CENTER_PATH,
    });
    for (const a of ARTICLES) {
        const node = await graph.upsertNode({
            projectId: OPENCODE_INFO_PROJECT_ID,
            kind: 'knowledge',
            label: a.title,
            refType: 'project-file',
            refId: a.path,
        });
        await graph.link({
            projectId: OPENCODE_INFO_PROJECT_ID,
            from: center.id,
            to: node.id,
            relation: 'cites',
        });
    }

    const siteNode = await graph.upsertNode({
        projectId: OPENCODE_INFO_PROJECT_ID,
        kind: 'website',
        label: 'OpenCodeInfo Site',
        refType: 'project-file',
        refId: 'index.html',
    });
    await graph.link({
        projectId: OPENCODE_INFO_PROJECT_ID,
        from: center.id,
        to: siteNode.id,
        relation: 'produces',
    });
    await graph.link({
        projectId: OPENCODE_INFO_PROJECT_ID,
        from: OPENCODE_INFO_PROJECT_ID,
        to: siteNode.id,
        relation: 'contains',
    });

    LOGGER.info('OpenCodeInfoSeed', 'seeded', { files: files.length });
    return { files: files.length };
}
