/**
 * BrowserInspectorService tests — QA inspection of website projects.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie passed where wrapper expected */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserInspectorService } from './browser-inspector-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let inspector: BrowserInspectorService;
const PID = 'test-project';

beforeEach(async () => {
    try { await db?.delete(); } catch { /* first test */ }
    db = new SuperAgentsDB();
    db.version(999).stores({
        projects: 'id, status, type, createdAt, updatedAt',
        projectTasks: 'id, projectId, agentId, status, priority, createdAt',
        projectRuns: 'id, taskId, projectId, agentId, status, createdAt',
        projectFiles: '[projectId+path], projectId, path',
        projectArtifacts: 'id, projectId, type, createdAt',
        projectAssignments: '[projectId+agentId], projectId, agentId',
        keyValue: 'id',
    });
    await db.open();
    ws = new ProjectWorkspaceService(db as any);
    inspector = new BrowserInspectorService(ws);
});

const GOOD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="A test page">
    <title>Test Page</title>
</head>
<body>
    <nav><a href="/about">About</a></nav>
    <h1>Welcome</h1>
    <h2>Section</h2>
    <img src="logo.png" alt="Logo">
    <p>Hello world this is a test page with some content</p>
    <a href="#section2">Jump to section</a>
    <div id="section2">Section 2 content here</div>
    <form><input type="text" name="q"><button>Search</button></form>
    <footer>Footer</footer>
</body>
</html>`;

const BAD_HTML = `<html>
<head></head>
<body>
    <a href="/missing">Link</a>
    <img src="pic.jpg">
    <a href="#nowhere">Broken anchor</a>
    <button></button>
    <a></a>
</body>
</html>`;

describe('BrowserInspectorService', () => {
    describe('checkLinks', () => {
        it('finds valid and broken links', async () => {
            await ws.writeFile(PID, '/index.html', GOOD_HTML);
            const links = await inspector.checkLinks(PID);
            expect(links.length).toBeGreaterThan(0);
            // /about is a relative link — file doesn't exist → broken
            const aboutLink = links.find((l) => l.url === '/about');
            expect(aboutLink).toBeDefined();
            expect(aboutLink!.valid).toBe(false);
        });

        it('validates anchor links', async () => {
            await ws.writeFile(PID, '/index.html', GOOD_HTML);
            const links = await inspector.checkLinks(PID);
            const anchorLink = links.find((l) => l.url === '#section2');
            expect(anchorLink).toBeDefined();
            expect(anchorLink!.valid).toBe(true);
        });
    });

    describe('checkVisual', () => {
        it('detects visual structure in good HTML', async () => {
            await ws.writeFile(PID, '/index.html', GOOD_HTML);
            const visual = await inspector.checkVisual(PID);
            expect(visual.hasHeadings).toBe(true);
            expect(visual.headingCount).toBe(2);
            expect(visual.hasImages).toBe(1);
            expect(visual.hasForms).toBe(true);
            expect(visual.hasNavigation).toBe(true);
            expect(visual.hasFooter).toBe(true);
            expect(visual.hasViewport).toBe(true);
            expect(visual.hasCharset).toBe(true);
        });

        it('detects missing structure in bad HTML', async () => {
            await ws.writeFile(PID, '/index.html', BAD_HTML);
            const visual = await inspector.checkVisual(PID);
            expect(visual.hasHeadings).toBe(false);
            expect(visual.hasForms).toBe(false);
        });
    });

    describe('checkText', () => {
        it('counts words and checks meta tags', async () => {
            await ws.writeFile(PID, '/index.html', GOOD_HTML);
            const text = await inspector.checkText(PID);
            expect(text.wordCount).toBeGreaterThan(0);
            expect(text.hasTitle).toBe(true);
            expect(text.hasMetaDescription).toBe(true);
            expect(text.missingAltCount).toBe(0);
            expect(text.emptyLinks).toBe(0);
        });

        it('detects issues in bad HTML', async () => {
            await ws.writeFile(PID, '/index.html', BAD_HTML);
            const text = await inspector.checkText(PID);
            expect(text.hasTitle).toBe(false);
            expect(text.missingAltCount).toBe(1);
            expect(text.emptyLinks).toBe(1);
            expect(text.emptyButtons).toBe(1);
        });
    });

    describe('checkFunctionality', () => {
        it('detects scripts and event listeners', async () => {
            await ws.writeFile(PID, '/index.html', GOOD_HTML);
            const func = await inspector.checkFunctionality(PID);
            expect(func.hasForms).toBe(true);
            expect(func.hasInternalLinks).toBe(true);
        });

        it('detects broken anchors', async () => {
            await ws.writeFile(PID, '/index.html', BAD_HTML);
            const func = await inspector.checkFunctionality(PID);
            expect(func.brokenAnchors).toContain('nowhere');
        });
    });

    describe('inspect (full)', () => {
        it('generates a QA report with score', async () => {
            await ws.writeFile(PID, '/index.html', GOOD_HTML);
            const report = await inspector.inspect(PID);
            expect(report.projectId).toBe(PID);
            expect(report.score).toBeGreaterThan(50);
            expect(report.issues).toBeDefined();
            expect(report.passed).toBeDefined();
        });

        it('flags bad HTML as failing', async () => {
            await ws.writeFile(PID, '/index.html', BAD_HTML);
            const report = await inspector.inspect(PID);
            expect(report.score).toBeLessThan(80);
            expect(report.issues.length).toBeGreaterThan(0);
        });
    });
});
