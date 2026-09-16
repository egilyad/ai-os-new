import type { ILifecycle } from '../contracts/lifecycle';
import type {
    Workflow,
    WorkflowStep,
    WorkflowRun,
    WorkflowStepResult,
} from '../contracts/workflow-types';
import { BUILT_IN_WORKFLOWS } from '../contracts/workflow-types';

const STORAGE_KEY_WORKFLOWS = 'workflows';
const STORAGE_KEY_RUNS = 'workflow_runs';
const MAX_RUNS = 50;

let nextId = Date.now();
function uid(): string {
    return `${nextId++}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveVariable(
    placeholder: string,
    input: string,
    stepResults: WorkflowStepResult[],
): string {
    const varKey = placeholder.trim();
    if (varKey === 'input') return input;
    const match = varKey.match(/^steps\.(\d+)\.output$/);
    if (match) {
        const idx = parseInt(match[1]!, 10);
        const sr = stepResults[idx]!;
        return sr?.status === 'success' ? sr.output : '';
    }
    const namedMatch = varKey.match(/^STEP_(\d+)_OUTPUT$/);
    if (namedMatch) {
        const idx = parseInt(namedMatch[1]!, 10);
        const sr = stepResults[idx]!;
        return sr?.status === 'success' ? sr.output : '';
    }
    return '';
}

function interpolatePrompt(
    template: string,
    input: string,
    stepResults: WorkflowStepResult[],
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        return resolveVariable(name!, input, stepResults) || `{{${name}}}`;
    });
}

export class WorkflowService implements ILifecycle {
    private workflows: Workflow[] = [];
    private runs: WorkflowRun[] = [];
    private loaded = false;
    private runningAborts = new Map<string, AbortController>();

    async init(): Promise<void> {
        // Lazy init via ensureLoaded() — nothing to do upfront
    }

    async destroy(): Promise<void> {
        this.cancelRun();
    }

    private async db(): Promise<import('../types/interfaces').IDatabaseService> {
        const { database } = await import('../instances/core-references');
        return database;
    }

    private async ensureLoaded(): Promise<void> {
        if (this.loaded) return;
        const d = await this.db();
        const [saved, savedRuns] = await Promise.all([
            d.getKv<Workflow[]>(STORAGE_KEY_WORKFLOWS),
            d.getKv<WorkflowRun[]>(STORAGE_KEY_RUNS),
        ]);
        this.workflows = saved ?? [];
        this.runs = savedRuns ?? [];
        this.loaded = true;
    }

    private async persist(): Promise<void> {
        const d = await this.db();
        await Promise.all([
            d.setKv(STORAGE_KEY_WORKFLOWS, this.workflows),
            d.setKv(STORAGE_KEY_RUNS, this.runs.slice(-MAX_RUNS)),
        ]);
    }

    async getAll(): Promise<Workflow[]> {
        await this.ensureLoaded();
        return [...this.workflows];
    }

    async getById(id: string): Promise<Workflow | undefined> {
        await this.ensureLoaded();
        return this.workflows.find((w) => w.id === id);
    }

    async create(data: {
        title: string;
        description: string;
        steps: Omit<WorkflowStep, 'id'>[];
        tags?: string[];
    }): Promise<Workflow> {
        await this.ensureLoaded();
        const now = Date.now();
        const wf: Workflow = {
            id: uid(),
            title: data.title,
            description: data.description,
            steps: data.steps.map((s) => ({ ...s, id: uid() })),
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            isBuiltIn: false,
            tags: data.tags ?? [],
        };
        this.workflows.push(wf);
        await this.persist();
        return wf;
    }

    async update(
        id: string,
        data: Partial<Pick<Workflow, 'title' | 'description' | 'steps' | 'tags'>>,
    ): Promise<void> {
        await this.ensureLoaded();
        const wf = this.workflows.find((w) => w.id === id);
        if (!wf || wf.isBuiltIn) return;
        Object.assign(wf, data, { updatedAt: Date.now() });
        await this.persist();
    }

    async remove(id: string): Promise<void> {
        await this.ensureLoaded();
        this.workflows = this.workflows.filter((w) => w.id !== id);
        await this.persist();
    }

    async incrementUsage(id: string): Promise<void> {
        const wf = this.workflows.find((w) => w.id === id);
        if (wf) {
            wf.usageCount++;
            await this.persist();
        }
    }

    async getRuns(): Promise<WorkflowRun[]> {
        await this.ensureLoaded();
        return [...this.runs].reverse();
    }

    async runWorkflow(
        workflowId: string,
        input: string,
        onProgress?: (run: WorkflowRun) => void,
    ): Promise<WorkflowRun> {
        await this.ensureLoaded();
        const wf =
            this.workflows.find((w) => w.id === workflowId) ||
            BUILT_IN_WORKFLOWS.find((w) => w.id === workflowId);
        if (!wf) throw new Error(`Workflow ${workflowId} not found`);

        const { adapterRegistry, keyService } = await import('../instances/core-references');
        const abortController = new AbortController();

        const run: WorkflowRun = {
            id: uid(),
            workflowId: wf.id,
            workflowTitle: wf.title,
            status: 'running',
            startedAt: Date.now(),
            stepResults: [],
            currentStepIndex: 0,
        };
        this.runs.push(run);
        this.runningAborts.set(run.id, abortController);
        await this.persist();

        const allKeys = keyService.getKeys();

        try {
            for (let i = 0; i < wf.steps.length; i++) {
                if (abortController.signal.aborted) {
                    run.status = 'cancelled';
                    break;
                }

                const step = wf.steps[i]!;
                run.currentStepIndex = i;
                const prompt = interpolatePrompt(step.promptTemplate, input, run.stepResults);
                const startTime = Date.now();

                try {
                    const adapter = adapterRegistry.getAdapter(step.provider);
                    if (!adapter) throw new Error(`Adapter not found: ${step.provider}`);
                    const key = allKeys.find((k) => k.provider === step.provider);
                    if (!key) throw new Error(`No key for ${step.provider}`);

                    const response = await adapter.sendMessage(
                        [{ role: 'user', content: prompt }],
                        step.model,
                        key.key,
                        abortController.signal,
                        {
                            temperature: step.temperature ?? 0.7,
                            maxOutputTokens: step.maxOutputTokens ?? 2048,
                        },
                    );

                    const result: WorkflowStepResult = {
                        stepId: step.id,
                        label: step.label,
                        output: response.content ?? '',
                        latency: Date.now() - startTime,
                        tokens: response.tokens ?? 0,
                        status: 'success',
                    };
                    run.stepResults.push(result);
                } catch (err) {
                    const result: WorkflowStepResult = {
                        stepId: step.id,
                        label: step.label,
                        output: '',
                        latency: Date.now() - startTime,
                        tokens: 0,
                        error: String(err),
                        status: 'error',
                    };
                    run.stepResults.push(result);
                    run.status = 'failed';
                    break;
                }

                onProgress?.(run);
            }

            if (run.status === 'running') {
                run.status = 'completed';
                wf.usageCount++;
            }
        } finally {
            run.completedAt = Date.now();
            this.runningAborts.delete(run.id);
            await this.persist();
        }

        return run;
    }

    cancelRun(runId?: string): void {
        if (runId) {
            const ctrl = this.runningAborts.get(runId);
            if (ctrl) {
                ctrl.abort();
                this.runningAborts.delete(runId);
            }
        } else {
            for (const [, ctrl] of this.runningAborts) ctrl.abort();
            this.runningAborts.clear();
        }
    }
}
