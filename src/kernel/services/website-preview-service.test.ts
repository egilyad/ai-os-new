/**
 * WebsitePreviewService tests — assembles project files into a preview.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie passed where wrapper expected */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebsitePreviewService } from './website-preview-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let preview: WebsitePreviewService;
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
    preview = new WebsitePreviewService(ws);
});

describe('WebsitePreviewService', () => {
    describe('generatePreview', () => {
        it('generates preview from HTML file', async () => {
            await ws.writeFile(PID, '/index.html', '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><h1>Hello</h1></body></html>');
            const result = await preview.generatePreview(PID);
            expect(result.html).toContain('<h1>Hello</h1>');
            expect(result.fileCount).toBe(1);
            expect(result.errors).toEqual([]);
        });

        it('injects CSS into HTML', async () => {
            await ws.writeFile(PID, '/index.html', '<!DOCTYPE html><html><head></head><body></body></html>');
            await ws.writeFile(PID, '/style.css', 'body { color: red; }');
            const result = await preview.generatePreview(PID);
            expect(result.html).toContain('body { color: red; }');
            expect(result.html).toContain('<style');
        });

        it('injects JS into HTML', async () => {
            await ws.writeFile(PID, '/index.html', '<!DOCTYPE html><html><head></head><body></body></html>');
            await ws.writeFile(PID, '/app.js', 'console.log("hello");');
            const result = await preview.generatePreview(PID);
            expect(result.html).toContain('console.log("hello");');
            expect(result.html).toContain('<script');
        });

        it('creates placeholder when no HTML exists', async () => {
            await ws.writeFile(PID, '/readme.md', '# Hello');
            const result = await preview.generatePreview(PID);
            expect(result.html).toContain('No HTML file found');
            expect(result.fileCount).toBe(1);
        });
    });

    describe('validate', () => {
        it('validates project with HTML', async () => {
            await ws.writeFile(PID, '/index.html', '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body></body></html>');
            const result = await preview.validate(PID);
            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('reports missing HTML', async () => {
            await ws.writeFile(PID, '/app.js', 'console.log()');
            const result = await preview.validate(PID);
            expect(result.valid).toBe(false);
            expect(result.errors[0]).toContain('No HTML files found');
        });

        it('reports missing DOCTYPE', async () => {
            await ws.writeFile(PID, '/index.html', '<html><head><meta charset="UTF-8"></head><body></body></html>');
            const result = await preview.validate(PID);
            expect(result.errors.some((e) => e.includes('DOCTYPE'))).toBe(true);
        });
    });
});
