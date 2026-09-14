/**
 * PythonRunnerService — manages Python execution within projects (roadmapp.md §P7).
 *
 * Scenario: Agent → write Python → run → inspect output → fix → rerun
 *
 * Uses ProjectWorkspaceService for file I/O and a simulated execution engine.
 * Real execution would use a WebWorker or server sandbox; here we validate + simulate.
 */
import type {
    PythonProject,
    PythonRun,
    PythonSandboxConfig,
} from '../types/python-runtime-types';
import type { ProjectWorkspaceService } from './project-workspace-service';
import { DEFAULT_SANDBOX_CONFIG } from '../types/python-runtime-types';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('PythonRunnerService');

export interface IPythonRunnerService {
    createPythonProject(projectId: string, config?: Partial<PythonProject>): Promise<PythonProject>;
    getPythonProject(projectId: string): Promise<PythonProject | undefined>;
    addRequirement(projectId: string, requirement: string): Promise<void>;
    removeRequirement(projectId: string, requirement: string): Promise<void>;
    validateFile(projectId: string, filePath: string): Promise<{ valid: boolean; errors: string[] }>;
    run(projectId: string, command?: string): Promise<PythonRun>;
    getRunHistory(projectId: string): PythonRun[];
}

export class PythonRunnerService implements IPythonRunnerService {
    private workspace: ProjectWorkspaceService;
    private pythonProjects = new Map<string, PythonProject>();
    private runHistory = new Map<string, PythonRun[]>();
    private config: PythonSandboxConfig;

    constructor(workspace: ProjectWorkspaceService, config?: Partial<PythonSandboxConfig>) {
        this.workspace = workspace;
        this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    }

    async createPythonProject(projectId: string, overrides?: Partial<PythonProject>): Promise<PythonProject> {
        const project: PythonProject = {
            id: `py-${projectId}`,
            name: overrides?.name || 'Python Project',
            projectId,
            pythonVersion: overrides?.pythonVersion || '3.12',
            requirements: overrides?.requirements || [],
            entryPoint: overrides?.entryPoint || 'main.py',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.pythonProjects.set(projectId, project);
        LOGGER.info('createPythonProject', `Created Python project for ${projectId}`);
        return project;
    }

    async getPythonProject(projectId: string): Promise<PythonProject | undefined> {
        return this.pythonProjects.get(projectId);
    }

    async addRequirement(projectId: string, requirement: string): Promise<void> {
        const project = this.pythonProjects.get(projectId);
        if (!project) throw new Error(`Python project not found: ${projectId}`);
        if (!project.requirements.includes(requirement)) {
            project.requirements.push(requirement);
            project.updatedAt = Date.now();
        }
    }

    async removeRequirement(projectId: string, requirement: string): Promise<void> {
        const project = this.pythonProjects.get(projectId);
        if (!project) throw new Error(`Python project not found: ${projectId}`);
        project.requirements = project.requirements.filter((r) => r !== requirement);
        project.updatedAt = Date.now();
    }

    async validateFile(projectId: string, filePath: string): Promise<{ valid: boolean; errors: string[] }> {
        const file = await this.workspace.readFile(projectId, filePath);
        if (!file) return { valid: false, errors: [`File not found: ${filePath}`] };

        const errors: string[] = [];
        const content = file.content;

        // Check for blocked modules
        for (const mod of this.config.blockedModules) {
            const importRegex = new RegExp(`(?:^|\\n)\\s*(?:import|from)\\s+${mod}\\b`, 'g');
            if (importRegex.test(content)) {
                errors.push(`Blocked module: ${mod}`);
            }
        }

        // Check for syntax issues (basic: unmatched parens/brackets)
        let openParens = 0, openBrackets = 0, openBraces = 0;
        for (const ch of content) {
            if (ch === '(') openParens++;
            if (ch === ')') openParens--;
            if (ch === '[') openBrackets++;
            if (ch === ']') openBrackets--;
            if (ch === '{') openBraces++;
            if (ch === '}') openBraces--;
        }
        if (openParens !== 0) errors.push('Unmatched parentheses');
        if (openBrackets !== 0) errors.push('Unmatched brackets');
        if (openBraces !== 0) errors.push('Unmatched braces');

        // Check file extension
        if (!filePath.endsWith('.py')) {
            errors.push('File does not have .py extension');
        }

        return { valid: errors.length === 0, errors };
    }

    async run(projectId: string, command?: string): Promise<PythonRun> {
        const project = this.pythonProjects.get(projectId);
        if (!project) throw new Error(`Python project not found: ${projectId}`);

        const cmd = command || `python ${project.entryPoint}`;
        const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        // Validate the entry point
        const validation = await this.validateFile(projectId, project.entryPoint);
        if (!validation.valid) {
            const run: PythonRun = {
                id: runId,
                projectId,
                command: cmd,
                exitCode: 1,
                stdout: '',
                stderr: validation.errors.join('\n'),
                durationMs: 0,
                startedAt: Date.now(),
                completedAt: Date.now(),
            };
            const runs = this.runHistory.get(projectId) || [];
            runs.push(run);
            this.runHistory.set(projectId, runs);
            return run;
        }

        // Simulated execution
        const startedAt = Date.now();
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        try {
            const file = await this.workspace.readFile(projectId, project.entryPoint);
            const content = file?.content || '';

            // Simple simulation: check for print statements
            const printRegex = /print\s*\(([^)]*)\)/g;
            let match;
            while ((match = printRegex.exec(content)) !== null) {
                stdout += match[1].replace(/['"]/g, '') + '\n';
            }

            if (!stdout) {
                stdout = '(no output)';
            }
        } catch (e) {
            exitCode = 1;
            stderr = String(e);
        }

        const durationMs = Date.now() - startedAt;
        const run: PythonRun = {
            id: runId,
            projectId,
            command: cmd,
            exitCode,
            stdout: stdout.trim(),
            stderr,
            durationMs,
            startedAt,
            completedAt: Date.now(),
        };

        const runs = this.runHistory.get(projectId) || [];
        runs.push(run);
        this.runHistory.set(projectId, runs);

        LOGGER.info('run', `Python run completed: exit ${exitCode}, ${durationMs}ms`);
        return run;
    }

    getRunHistory(projectId: string): PythonRun[] {
        return this.runHistory.get(projectId) || [];
    }
}
