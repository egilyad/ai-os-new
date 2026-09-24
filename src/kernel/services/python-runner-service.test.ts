/**
 * PythonRunnerService tests — Python execution sandbox (roadmapp.md A7).
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- raw Dexie passed where wrapper expected */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PythonRunnerService } from './python-runner-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { SuperAgentsDB } from './dexie-schema';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

let db: SuperAgentsDB;
let ws: ProjectWorkspaceService;
let runner: PythonRunnerService;
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
    runner = new PythonRunnerService(ws);
});

describe('PythonRunnerService', () => {
    describe('createPythonProject', () => {
        it('creates a Python project', async () => {
            const py = await runner.createPythonProject(PID);
            expect(py.projectId).toBe(PID);
            expect(py.pythonVersion).toBe('3.12');
            expect(py.entryPoint).toBe('main.py');
        });

        it('customizes config', async () => {
            const py = await runner.createPythonProject(PID, {
                pythonVersion: '3.11',
                entryPoint: 'app.py',
                requirements: ['numpy'],
            });
            expect(py.pythonVersion).toBe('3.11');
            expect(py.entryPoint).toBe('app.py');
            expect(py.requirements).toContain('numpy');
        });
    });

    describe('requirements', () => {
        it('adds a requirement', async () => {
            await runner.createPythonProject(PID);
            await runner.addRequirement(PID, 'requests');
            const py = await runner.getPythonProject(PID);
            expect(py!.requirements).toContain('requests');
        });

        it('does not duplicate requirements', async () => {
            await runner.createPythonProject(PID);
            await runner.addRequirement(PID, 'requests');
            await runner.addRequirement(PID, 'requests');
            const py = await runner.getPythonProject(PID);
            expect(py!.requirements.filter((r) => r === 'requests')).toHaveLength(1);
        });

        it('removes a requirement', async () => {
            await runner.createPythonProject(PID);
            await runner.addRequirement(PID, 'requests');
            await runner.removeRequirement(PID, 'requests');
            const py = await runner.getPythonProject(PID);
            expect(py!.requirements).not.toContain('requests');
        });
    });

    describe('validateFile', () => {
        it('validates a good Python file', async () => {
            await ws.writeFile(PID, '/main.py', 'print("Hello")\n');
            const result = await runner.validateFile(PID, '/main.py');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects blocked modules', async () => {
            await ws.writeFile(PID, '/bad.py', 'import subprocess\nsubprocess.run(["ls"])\n');
            const result = await runner.validateFile(PID, '/bad.py');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Blocked module: subprocess');
        });

        it('detects unmatched parentheses', async () => {
            await ws.writeFile(PID, '/bad.py', 'print("hello"\n');
            const result = await runner.validateFile(PID, '/bad.py');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Unmatched parentheses');
        });

        it('rejects non-.py files', async () => {
            await ws.writeFile(PID, '/script.txt', 'print("hello")');
            const result = await runner.validateFile(PID, '/script.txt');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('File does not have .py extension');
        });
    });

    describe('run', () => {
        it('runs a valid Python file', async () => {
            await runner.createPythonProject(PID);
            await ws.writeFile(PID, '/main.py', 'print("Hello World")\nprint("Line 2")');
            const run = await runner.run(PID);
            expect(run.exitCode).toBe(0);
            expect(run.stdout).toContain('Hello World');
            expect(run.stdout).toContain('Line 2');
        });

        it('returns error for invalid file', async () => {
            await runner.createPythonProject(PID);
            const run = await runner.run(PID);
            expect(run.exitCode).toBe(1);
            expect(run.stderr).toContain('File not found');
        });

        it('tracks run history', async () => {
            await runner.createPythonProject(PID);
            await ws.writeFile(PID, '/main.py', 'print("1")');
            await runner.run(PID);
            await ws.writeFile(PID, '/main.py', 'print("2")');
            await runner.run(PID);
            const history = runner.getRunHistory(PID);
            expect(history).toHaveLength(2);
        });
    });
});
