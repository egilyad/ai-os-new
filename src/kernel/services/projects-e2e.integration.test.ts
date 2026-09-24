/**
 * End-to-end integration test — First Control Experiment (roadmapp.md §34).
 *
 * "Create a beautiful one-page space website inside SuperAgents OS."
 *
 * Proves: Project → Workspace → Agent Runtime → Files → Preview → QA → Pipeline
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- integration stubs cast to real types */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuperAgentsDB } from './dexie-schema';
import { ProjectRepository } from '../dal/project-repository';
import { ProjectService } from './project-service';
import { ProjectWorkspaceService } from './project-workspace-service';
import { WebsitePreviewService } from './website-preview-service';
import { BrowserInspectorService } from './browser-inspector-service';
import { MultiAgentProjectService } from './multi-agent-project-service';
import { PythonRunnerService } from './python-runner-service';
import { ArtifactService } from './artifact-service';
import { ProjectTemplateService } from './project-template-service';
import { ProjectDebateIntegration } from './project-debate-integration';
import { AutonomyOrchestrator } from './autonomy-orchestrator';

vi.mock('./logger-service', () => ({
    rootLogger: { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));

function mockEventBus() {
    return {
        on: vi.fn(), off: vi.fn(), emit: vi.fn(), emitOnce: vi.fn(), once: vi.fn(),
        onSafe: vi.fn().mockReturnValue(vi.fn()), subscribeAll: vi.fn().mockReturnValue(vi.fn()),
        getSubscriptionStats: vi.fn(),
    } as any;
}

let db: SuperAgentsDB;
let repo: ProjectRepository;
let pm: ProjectService;
let ws: ProjectWorkspaceService;
let preview: WebsitePreviewService;
let qa: BrowserInspectorService;
let pipeline: MultiAgentProjectService;
let python: PythonRunnerService;
let artifacts: ArtifactService;
let templates: ProjectTemplateService;
let debate: ProjectDebateIntegration;
let autonomy: AutonomyOrchestrator;

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

    const bus = mockEventBus();
    repo = new ProjectRepository(db as any);
    pm = new ProjectService(repo, bus);
    ws = new ProjectWorkspaceService(db as any, bus);
    preview = new WebsitePreviewService(ws);
    qa = new BrowserInspectorService(ws);
    pipeline = new MultiAgentProjectService(pm as any, bus);
    python = new PythonRunnerService(ws);
    artifacts = new ArtifactService(ws);
    templates = new ProjectTemplateService(ws);
    debate = new ProjectDebateIntegration();
    autonomy = new AutonomyOrchestrator(pm as any, ws);
});

describe('First Control Experiment — Space Website', () => {
    it('full end-to-end: create → files → preview → QA → pipeline → template', async () => {
        // ── Step 1: Create project ──
        const project = await pm.create({ name: 'Space Website', description: 'Beautiful one-page site about space', type: 'website' });
        const PID = project.id;

        // ── Step 2: Apply landing page template ──
        const appliedFiles = await templates.applyTemplate('tpl-landing-page', PID);
        expect(appliedFiles).toBe(3);

        // ── Step 3: Verify files exist ──
        const tree = await ws.getTree(PID);
        const flatFiles = tree.map((e) => e.path).sort();
        expect(flatFiles).toContain('/index.html');
        expect(flatFiles).toContain('/style.css');
        expect(flatFiles).toContain('/script.js');

        // ── Step 4: Read files — they have real content ──
        const html = await ws.readFile(PID, '/index.html');
        expect(html!.content).toContain('<!DOCTYPE');
        expect(html!.content).toContain('Welcome');
        expect(html!.content).toContain('Features');

        const css = await ws.readFile(PID, '/style.css');
        expect(css!.content).toContain('font-family');

        // ── Step 5: Generate preview ──
        const previewResult = await preview.generatePreview(PID);
        expect(previewResult.html).toContain('<!DOCTYPE');
        expect(previewResult.html).toContain('Welcome');
        expect(previewResult.fileCount).toBe(3);

        // ── Step 6: Run QA inspection ──
        const qaReport = await qa.inspect(PID);
        expect(qaReport.score).toBeGreaterThan(50);
        expect(qaReport.visual.hasHeadings).toBe(true);
        expect(qaReport.visual.hasForms).toBe(true);
        expect(qaReport.text.hasTitle).toBe(true);
        expect(qaReport.visual.hasCharset).toBe(true);
        expect(qaReport.visual.hasViewport).toBe(true);

        // ── Step 7: Create pipeline ──
        const pipe = await pipeline.createPipeline(PID);
        expect(pipe.currentStage).toBe('research');
        expect(pipe.assignments).toHaveLength(4);

        await pipeline.assignAgent(PID, 'research', 'research-agent');
        await pipeline.assignAgent(PID, 'design', 'designer-agent');
        await pipeline.assignAgent(PID, 'development', 'developer-agent');
        await pipeline.assignAgent(PID, 'qa', 'qa-agent');

        // Complete research
        await pipeline.completeStage(PID, 'research', 'Analyzed space themes');
        const next = await pipeline.advancePipeline(PID);
        expect(next).toBe('design');

        // Complete design
        await pipeline.completeStage(PID, 'design', 'Created dark theme layout');
        await pipeline.advancePipeline(PID);

        // Complete development
        await pipeline.completeStage(PID, 'development', 'HTML/CSS/JS built');
        await pipeline.advancePipeline(PID);

        // Complete QA
        await pipeline.completeStage(PID, 'qa', 'All checks passed');
        await pipeline.advancePipeline(PID);

        const finalPipeline = await pipeline.getPipeline(PID);
        expect(finalPipeline!.currentStage).toBe('done');

        // ── Step 8: Build artifact ──
        const build = await artifacts.build(PID, 'Space Website v1');
        expect(build.success).toBe(true);
        expect(build.outputFiles.length).toBeGreaterThan(0);

        // ── Step 9: Create snapshot ──
        const snap = await artifacts.createSnapshot(PID, 'Before deploy');
        expect(snap.fileCount).toBeGreaterThan(0);

        // ── Step 10: Export ──
        const bundle = await artifacts.exportProject(PID);
        expect(bundle.files.length).toBeGreaterThan(0);

        // ── User sees the site ──
        const finalPreview = await preview.generatePreview(PID);
        expect(finalPreview.html).toContain('Welcome');
        expect(finalPreview.html).toContain('Features');
        expect(finalPreview.fileCount).toBeGreaterThanOrEqual(3);
    });
});

describe('Second Control Experiment — Python CSV', () => {
    it('full end-to-end: create → Python project → write code → run → validate', async () => {
        // ── Step 1: Create project ──
        const project = await pm.create({ name: 'CSV Analyzer', description: 'Python CSV analyzer', type: 'python' });
        const PID = project.id;

        // ── Step 1: Create Python project ──
        const pyProject = await python.createPythonProject(PID, { name: 'CSV Analyzer' });
        expect(pyProject.projectId).toBe(PID);

        // ── Step 2: Write main.py ──
        const mainPy = `import csv
import sys

def analyze_csv(filepath):
    with open(filepath, 'r') as f:
        reader = csv.reader(f)
        rows = list(reader)
        headers = rows[0]
        data = rows[1:]
        print(f"Headers: {headers}")
        print(f"Rows: {len(data)}")
        for row in data[:5]:
            print(row)

if __name__ == '__main__':
    analyze_csv('data.csv')
`;
        await ws.writeFile(PID, '/main.py', mainPy);

        // ── Step 3: Validate ──
        const validation = await python.validateFile(PID, '/main.py');
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);

        // ── Step 4: Run (simulated) ──
        const run = await python.run(PID);
        expect(run.exitCode).toBe(0);

        // ── Step 5: Add requirements ──
        await python.addRequirement(PID, 'pandas');
        await python.addRequirement(PID, 'matplotlib');
        const updated = await python.getPythonProject(PID);
        expect(updated!.requirements).toContain('pandas');
        expect(updated!.requirements).toContain('matplotlib');

        // ── Step 6: Run history ──
        const history = python.getRunHistory(PID);
        expect(history.length).toBeGreaterThanOrEqual(1);

        // ── Step 7: Create snapshot ──
        const snap = await artifacts.createSnapshot(PID, 'CSV analyzer v1');
        expect(snap.fileCount).toBeGreaterThanOrEqual(1);
    });
});

describe('Debate Integration', () => {
    it('decision → debate → verdict → task', () => {
        const d = debate.startDebate('proj-1', 'Use TypeScript or JavaScript?');
        expect(d.status).toBe('debating');

        debate.submitVerdict(d.id, {
            debateId: d.id,
            summary: 'TypeScript recommended',
            recommendation: 'Use TypeScript for type safety',
            confidence: 0.9,
            dissentingViews: ['JS is simpler'],
            consensusReached: true,
        });

        expect(debate.getDebate(d.id)!.status).toBe('verdict');

        debate.createTaskFromVerdict(d.id, 'task-ts-setup');
        expect(debate.getDebate(d.id)!.status).toBe('task-created');
        expect(debate.getDebate(d.id)!.createdTaskId).toBe('task-ts-setup');
    });
});

describe('Autonomy Orchestrator', () => {
    it('goal → plan → decompose → assign → execute → test → complete', async () => {
        // Create a real project so autonomy can reference it
        const proj = await pm.create({ name: 'API Project', description: 'REST API', type: 'node' });

        const goal = autonomy.createGoal(proj.id, 'Build a REST API', ['Works', 'Tests pass']);
        const plan = autonomy.createPlan(goal.id, 'Sequential: design then build', 2);
        const tasks = autonomy.decomposeTasks(goal.id, plan.id, [
            { title: 'Design API', description: 'Define endpoints', requiredCapabilities: ['design'], estimatedDurationMs: 1000, dependencies: [], order: 0 },
            { title: 'Implement API', description: 'Write code', requiredCapabilities: ['dev'], estimatedDurationMs: 2000, dependencies: [], order: 1 },
        ]);

        // Advance to execution
        autonomy.advanceGoal(goal.id); // planning
        autonomy.advanceGoal(goal.id); // decomposition
        autonomy.advanceGoal(goal.id); // assignment
        autonomy.advanceGoal(goal.id); // execution

        // Execute task 1
        autonomy.assignTask(tasks[0].id, 'designer');
        autonomy.startTask(tasks[0].id);
        autonomy.completeTask(tasks[0].id, 'Design done');
        autonomy.runTests(tasks[0].id, true);

        // Execute task 2
        autonomy.assignTask(tasks[1].id, 'developer');
        autonomy.startTask(tasks[1].id);
        autonomy.completeTask(tasks[1].id, 'Code done');
        autonomy.runTests(tasks[1].id, true);

        // Complete
        const result = autonomy.advanceGoal(goal.id);
        expect(result).toBe('completed');
        expect(autonomy.getGoal(goal.id)!.status).toBe('completed');

        const run = autonomy.getRun(goal.id)!;
        expect(run.tasksCompleted).toBe(2);
        expect(run.tasksFailed).toBe(0);
        expect(run.phase).toBe('completed');
    });
});
