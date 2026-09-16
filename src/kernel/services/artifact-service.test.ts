/**
 * ArtifactService tests — registry, build, export/import, snapshots.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArtifactService } from './artifact-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let svc: ArtifactService;
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
    svc = new ArtifactService(ws);
});

describe('ArtifactService', () => {
    describe('createArtifact', () => {
        it('creates an artifact', () => {
            const art = svc.createArtifact(PID, 'build', 'v1', [{ path: '/a.html', content: '<h1>Hi</h1>', sizeBytes: 12, mimeType: 'text/html' }]);
            expect(art.id).toBeTruthy();
            expect(art.type).toBe('build');
            expect(art.files).toHaveLength(1);
        });
    });

    describe('listArtifacts', () => {
        it('lists and filters', () => {
            svc.createArtifact(PID, 'build', 'b1', []);
            svc.createArtifact(PID, 'snapshot', 's1', []);
            expect(svc.listArtifacts(PID)).toHaveLength(2);
            expect(svc.listArtifacts(PID, 'build')).toHaveLength(1);
        });
    });

    describe('deleteArtifact', () => {
        it('deletes', () => {
            const art = svc.createArtifact(PID, 'build', 'b1', []);
            expect(svc.deleteArtifact(art.id)).toBe(true);
            expect(svc.getArtifact(art.id)).toBeUndefined();
        });
    });

    describe('build', () => {
        it('builds a project', async () => {
            await ws.writeFile(PID, '/index.html', '<!DOCTYPE html>\n<html><body><h1>Hi</h1></body></html>');
            await ws.writeFile(PID, '/style.css', 'body { color: red; }');
            const result = await svc.build(PID, 'Build 1');
            expect(result.success).toBe(true);
            expect(result.outputFiles).toContain('/index.html');
            expect(result.outputFiles).toContain('/style.css');
        });
    });

    describe('snapshots', () => {
        it('creates and lists snapshots', async () => {
            await ws.writeFile(PID, '/index.html', '<h1>Hi</h1>');
            const snap = await svc.createSnapshot(PID, 'Snap 1', 'Before deploy');
            expect(snap.fileCount).toBe(1);
            expect(svc.listSnapshots(PID)).toHaveLength(1);
        });

        it('restores a snapshot', async () => {
            await ws.writeFile(PID, '/index.html', '<h1>V1</h1>');
            const snap = await svc.createSnapshot(PID, 'V1');
            await ws.writeFile(PID, '/index.html', '<h1>V2</h1>');
            await svc.restoreSnapshot(snap.id);
            const file = await ws.readFile(PID, '/index.html');
            expect(file!.content).toBe('<h1>V1</h1>');
        });
    });

    describe('export/import', () => {
        it('exports and imports a project', async () => {
            await ws.writeFile(PID, '/index.html', '<h1>Hi</h1>');
            const bundle = await svc.exportProject(PID);
            expect(bundle.files).toHaveLength(1);

            const newId = await svc.importProject(bundle);
            const file = await ws.readFile(newId, '/index.html');
            expect(file!.content).toBe('<h1>Hi</h1>');
        });
    });
});
