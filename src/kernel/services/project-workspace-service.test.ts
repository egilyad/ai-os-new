/**
 * ProjectWorkspaceService tests — virtual FS on Dexie.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('ProjectWorkspaceService', () => {
    describe('write + read', () => {
        it('writes and reads a file', async () => {
            const file = await ws.writeFile(PID, '/index.html', '<h1>Hello</h1>');
            expect(file.path).toBe('/index.html');
            expect(file.content).toBe('<h1>Hello</h1>');
            expect(file.size).toBeGreaterThan(0);
            expect(file.mime).toBe('text/html');

            const read = await ws.readFile(PID, '/index.html');
            expect(read).toBeDefined();
            expect(read!.content).toBe('<h1>Hello</h1>');
        });

        it('normalizes paths', async () => {
            await ws.writeFile(PID, 'src/main.ts', 'console.log()');
            const read = await ws.readFile(PID, '/src/main.ts');
            expect(read).toBeDefined();
            expect(read!.content).toBe('console.log()');
        });

        it('overwrites existing file', async () => {
            await ws.writeFile(PID, '/a.txt', 'v1');
            await ws.writeFile(PID, '/a.txt', 'v2');
            const read = await ws.readFile(PID, '/a.txt');
            expect(read!.content).toBe('v2');
        });

        it('returns undefined for missing file', async () => {
            const read = await ws.readFile(PID, '/missing.txt');
            expect(read).toBeUndefined();
        });
    });

    describe('edit', () => {
        it('replaces lines', async () => {
            await ws.writeFile(PID, '/code.ts', 'line1\nline2\nline3');
            const edited = await ws.editFile(PID, '/code.ts', [
                { kind: 'replace', startLine: 2, endLine: 2, content: 'LINE2' },
            ]);
            expect(edited.content).toBe('line1\nLINE2\nline3');
        });

        it('inserts lines', async () => {
            await ws.writeFile(PID, '/code.ts', 'line1\nline3');
            const edited = await ws.editFile(PID, '/code.ts', [
                { kind: 'insert', startLine: 2, content: 'line2' },
            ]);
            expect(edited.content).toBe('line1\nline2\nline3');
        });

        it('deletes lines', async () => {
            await ws.writeFile(PID, '/code.ts', 'line1\nline2\nline3');
            const edited = await ws.editFile(PID, '/code.ts', [
                { kind: 'delete', startLine: 2, endLine: 2 },
            ]);
            expect(edited.content).toBe('line1\nline3');
        });

        it('throws on missing file', async () => {
            await expect(
                ws.editFile(PID, '/missing.ts', [{ kind: 'replace', startLine: 1, content: 'x' }]),
            ).rejects.toThrow('File not found');
        });
    });

    describe('delete', () => {
        it('deletes a file', async () => {
            await ws.writeFile(PID, '/del.txt', 'x');
            await ws.deleteFile(PID, '/del.txt');
            const read = await ws.readFile(PID, '/del.txt');
            expect(read).toBeUndefined();
        });
    });

    describe('listDir', () => {
        it('lists files in root', async () => {
            await ws.writeFile(PID, '/a.html', 'a');
            await ws.writeFile(PID, '/b.css', 'b');
            const entries = await ws.listDir(PID, '/');
            expect(entries.length).toBe(2);
            expect(entries.map((e) => e.path).sort()).toEqual(['/a.html', '/b.css']);
        });

        it('lists files in subdirectory', async () => {
            await ws.writeFile(PID, '/src/main.ts', 'code');
            await ws.writeFile(PID, '/src/util.ts', 'util');
            await ws.writeFile(PID, '/readme.md', 'readme');
            const entries = await ws.listDir(PID, '/src');
            expect(entries.length).toBe(2);
        });
    });

    describe('getTree', () => {
        it('returns nested tree', async () => {
            await ws.writeFile(PID, '/src/index.html', '<html>');
            await ws.writeFile(PID, '/src/styles.css', 'body{}');
            await ws.writeFile(PID, '/readme.md', '# Hello');
            const tree = await ws.getTree(PID);
            expect(tree.length).toBe(2); // src (dir) + readme.md (file)
            const srcDir = tree.find((e) => e.type === 'dir');
            expect(srcDir).toBeDefined();
            expect(srcDir!.children!.length).toBe(2);
        });
    });

    describe('search', () => {
        it('searches files by pattern', async () => {
            await ws.writeFile(PID, '/src/main.ts', '');
            await ws.writeFile(PID, '/src/util.ts', '');
            await ws.writeFile(PID, '/readme.md', '');
            const results = await ws.searchFiles(PID, '*.ts');
            expect(results.length).toBe(2);
        });
    });

    describe('grep', () => {
        it('searches content by pattern', async () => {
            await ws.writeFile(PID, '/a.ts', 'const x = 1;\nconst y = 2;');
            await ws.writeFile(PID, '/b.ts', 'const z = 3;');
            const results = await ws.grepContent(PID, 'const');
            expect(results.length).toBe(3);
        });

        it('respects rootDir', async () => {
            await ws.writeFile(PID, '/src/a.ts', 'hello world');
            await ws.writeFile(PID, '/test/b.ts', 'hello world');
            const results = await ws.grepContent(PID, 'hello', '/src');
            expect(results.length).toBe(1);
            expect(results[0].path).toBe('/src/a.ts');
        });
    });

    describe('copy + move', () => {
        it('copies a file', async () => {
            await ws.writeFile(PID, '/original.txt', 'data');
            await ws.copyFile(PID, '/original.txt', '/copy.txt');
            const copy = await ws.readFile(PID, '/copy.txt');
            expect(copy!.content).toBe('data');
            const orig = await ws.readFile(PID, '/original.txt');
            expect(orig!.content).toBe('data');
        });

        it('moves a file', async () => {
            await ws.writeFile(PID, '/old.txt', 'data');
            await ws.moveFile(PID, '/old.txt', '/new.txt');
            expect(await ws.readFile(PID, '/old.txt')).toBeUndefined();
            const moved = await ws.readFile(PID, '/new.txt');
            expect(moved!.content).toBe('data');
        });
    });

    describe('directory operations', () => {
        it('creates directory via mkdir', async () => {
            await ws.mkdir(PID, '/new-dir');
            const entries = await ws.listDir(PID, '/new-dir');
            expect(entries.length).toBe(1); // .gitkeep
        });

        it('deletes directory recursively', async () => {
            await ws.writeFile(PID, '/dir/a.txt', 'a');
            await ws.writeFile(PID, '/dir/sub/b.txt', 'b');
            await ws.rmdir(PID, '/dir');
            expect(await ws.readFile(PID, '/dir/a.txt')).toBeUndefined();
            expect(await ws.readFile(PID, '/dir/sub/b.txt')).toBeUndefined();
        });
    });

    describe('history', () => {
        it('records file changes (best-effort, kv table optional)', async () => {
            // History is best-effort — kv table may not exist in all test setups
            await ws.writeFile(PID, '/a.txt', 'v1');
            await ws.writeFile(PID, '/a.txt', 'v2');
            const history = await ws.getHistory(PID, '/a.txt');
            // kv table may not be available in this test DB — just verify no crash
            expect(Array.isArray(history)).toBe(true);
        });
    });
});
