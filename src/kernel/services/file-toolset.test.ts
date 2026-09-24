/**
 * FileToolset tests — agent tools for workspace operations.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie + unknown tool results */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FILE_TOOLS, executeFileTool } from './file-toolset';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
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
});

describe('FileToolset', () => {
    it('defines 8 tools', () => {
        expect(FILE_TOOLS.length).toBe(8);
    });

    it('has required name+description on each tool', () => {
        for (const tool of FILE_TOOLS) {
            expect(tool.name).toBeTruthy();
            expect(tool.description).toBeTruthy();
        }
    });

    describe('workspace_file_read', () => {
        it('reads a file', async () => {
            await ws.writeFile(PID, '/test.txt', 'hello');
            const result = await executeFileTool(ws, 'workspace_file_read', { projectId: PID, path: '/test.txt' });
            expect(result).toEqual({ content: 'hello', mime: 'text/plain', size: expect.any(Number) });
        });

        it('returns error for missing file', async () => {
            const result = await executeFileTool(ws, 'workspace_file_read', { projectId: PID, path: '/missing.txt' });
            expect(result).toHaveProperty('error');
        });
    });

    describe('workspace_file_write', () => {
        it('writes a file', async () => {
            const result = await executeFileTool(ws, 'workspace_file_write', { projectId: PID, path: '/a.txt', content: 'data' });
            expect(result).toEqual({ success: true, path: '/a.txt', size: expect.any(Number) });
            const file = await ws.readFile(PID, '/a.txt');
            expect(file!.content).toBe('data');
        });
    });

    describe('workspace_list_dir', () => {
        it('lists files', async () => {
            await ws.writeFile(PID, '/a.txt', 'a');
            await ws.writeFile(PID, '/b.txt', 'b');
            const result = await executeFileTool(ws, 'workspace_list_dir', { projectId: PID, path: '/' }) as any;
            expect(result.length).toBe(2);
        });
    });

    describe('workspace_search', () => {
        it('searches files by pattern', async () => {
            await ws.writeFile(PID, '/src/main.ts', '');
            await ws.writeFile(PID, '/readme.md', '');
            const result = await executeFileTool(ws, 'workspace_search', { projectId: PID, pattern: '*.ts' }) as any;
            expect(result.files.length).toBe(1);
        });
    });

    describe('workspace_grep', () => {
        it('searches content', async () => {
            await ws.writeFile(PID, '/a.ts', 'const x = 1;');
            const result = await executeFileTool(ws, 'workspace_grep', { projectId: PID, pattern: 'const' }) as any;
            expect(result.matches.length).toBe(1);
        });
    });

    describe('workspace_delete', () => {
        it('deletes a file', async () => {
            await ws.writeFile(PID, '/del.txt', 'x');
            const result = await executeFileTool(ws, 'workspace_delete', { projectId: PID, path: '/del.txt' });
            expect(result).toEqual({ success: true });
            expect(await ws.readFile(PID, '/del.txt')).toBeUndefined();
        });
    });

    describe('workspace_mkdir', () => {
        it('creates a directory', async () => {
            const result = await executeFileTool(ws, 'workspace_mkdir', { projectId: PID, path: '/new-dir' });
            expect(result).toEqual({ success: true });
        });
    });

    it('throws on unknown tool', async () => {
        await expect(executeFileTool(ws, 'unknown_tool', { projectId: PID })).rejects.toThrow('Unknown file tool');
    });
});
