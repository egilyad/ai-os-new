/**
 * ProjectTemplateService tests — website + Python templates.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie passed where wrapper expected */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectTemplateService } from './project-template-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let svc: ProjectTemplateService;
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
    svc = new ProjectTemplateService(ws);
});

describe('ProjectTemplateService', () => {
    it('lists built-in templates', () => {
        const tpls = svc.listTemplates();
        expect(tpls.length).toBeGreaterThanOrEqual(4);
        expect(tpls.find((t) => t.id === 'tpl-landing-page')).toBeDefined();
    });

    it('filters by category', () => {
        const web = svc.listTemplates('website');
        expect(web.every((t) => t.category === 'website')).toBe(true);
        const py = svc.listTemplates('python');
        expect(py.every((t) => t.category === 'python')).toBe(true);
    });

    it('gets a template by id', () => {
        const tpl = svc.getTemplate('tpl-landing-page');
        expect(tpl).toBeDefined();
        expect(tpl!.files.length).toBeGreaterThan(0);
    });

    it('applies a template', async () => {
        const count = await svc.applyTemplate('tpl-landing-page', PID);
        expect(count).toBe(3);
        const file = await ws.readFile(PID, '/index.html');
        expect(file!.content).toContain('<!DOCTYPE');
    });

    it('creates a custom template', () => {
        const tpl = svc.createTemplate('My Template', 'website', [{ path: '/a.html', content: 'hi' }]);
        expect(tpl.id).toBeTruthy();
        expect(svc.getTemplate(tpl.id)).toBeDefined();
    });
});
