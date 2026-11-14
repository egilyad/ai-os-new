import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('AssistantPlanner');

export type PlanStepStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
export type PlanStatus = 'draft' | 'running' | 'completed' | 'failed' | 'paused';

export interface PlanStep {
    id: string;
    order: number;
    title: string;
    /** Optional action to invoke when the step runs. */
    actionId?: string;
    args?: Record<string, unknown>;
    status: PlanStepStatus;
    result?: string;
    error?: string;
    startedAt?: number;
    finishedAt?: number;
}

export interface WorkPlan {
    id: string;
    projectId?: string;
    goal: string;
    status: PlanStatus;
    steps: PlanStep[];
    createdAt: number;
    updatedAt: number;
    currentStep?: number;
}

export interface AssistantPlannerDeps {
    runAction?(
        actionId: string,
        args: Record<string, unknown>,
    ): Promise<{
        ok: boolean;
        detail?: string;
    }>;
    llm?: {
        chat(
            messages: Array<{ role: string; content: string }>,
            opts?: { model?: string },
        ): Promise<{ content: string }>;
    };
}

export interface PlanStepInput {
    title: string;
    actionId?: string;
    args?: Record<string, unknown>;
}

const STEP_ID = (() => {
    let n = 0;
    return () => `plan-step-${Date.now()}-${++n}`;
})();

const PLAN_ID = (() => {
    let n = 0;
    return () => `plan-${Date.now()}-${++n}`;
})();

/**
 * AssistantPlannerService — M4: structured planner + plan-execution loop.
 *
 * Splits a goal into ordered steps (explicit or LLM-decomposed) and executes
 * them sequentially. Each step may invoke an assistant action; results are
 * accumulated back into the plan.
 */
export class AssistantPlannerService {
    private plans = new Map<string, WorkPlan>();

    constructor(private deps: AssistantPlannerDeps = {}) {}

    async createPlan(goal: string, steps?: PlanStepInput[], projectId?: string): Promise<WorkPlan> {
        const own = steps ?? (await this.decompose(goal));
        const plan: WorkPlan = {
            id: PLAN_ID(),
            projectId,
            goal,
            status: 'draft',
            steps: own.map((s, i) => ({
                id: STEP_ID(),
                order: i + 1,
                title: s.title,
                actionId: s.actionId,
                args: s.args,
                status: 'queued',
            })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.plans.set(plan.id, plan);
        return plan;
    }

    private async decompose(goal: string): Promise<PlanStepInput[]> {
        if (this.deps.llm) {
            try {
                const res = await this.deps.llm.chat([
                    {
                        role: 'system',
                        content:
                            'You are a structured planner. Return ONLY a JSON array of step titles: ["step1","step2",...]. No prose.',
                    },
                    { role: 'user', content: goal },
                ]);
                const match = res.content.match(/\[[\s\S]*\]/);
                if (match) {
                    const titles = JSON.parse(match[0]) as string[];
                    if (Array.isArray(titles) && titles.length > 0) {
                        return titles.map((t) => ({ title: String(t) }));
                    }
                }
            } catch (e) {
                LOGGER.warn('decompose llm failed', String(e));
            }
        }
        return [{ title: 'execute goal as a single step' }];
    }

    list(projectId?: string): WorkPlan[] {
        const all = [...this.plans.values()];
        return projectId ? all.filter((p) => p.projectId === projectId) : all;
    }

    get(planId: string): WorkPlan | undefined {
        return this.plans.get(planId);
    }

    async run(planId: string): Promise<WorkPlan | undefined> {
        const plan = this.plans.get(planId);
        if (!plan) return undefined;
        plan.status = 'running';
        plan.updatedAt = Date.now();
        for (let i = 0; i < plan.steps.length; i++) {
            if (plan.status !== 'running') break;
            plan.currentStep = i;
            const step = plan.steps[i]!;
            step.status = 'running';
            step.startedAt = Date.now();
            try {
                if (step.actionId && this.deps.runAction) {
                    const out = await this.deps.runAction(step.actionId, step.args ?? {});
                    step.result = out.detail ?? (out.ok ? 'ok' : 'failed');
                    step.status = out.ok ? 'completed' : 'failed';
                    if (!out.ok) step.error = out.detail;
                } else {
                    step.status = 'completed';
                    step.result = 'step completed (no action bound)';
                }
            } catch (e) {
                step.status = 'failed';
                step.error = e instanceof Error ? e.message : String(e);
            }
            step.finishedAt = Date.now();
            plan.updatedAt = Date.now();
        }
        plan.currentStep = undefined;
        const failed = plan.steps.some((s) => s.status === 'failed');
        plan.status = failed ? 'failed' : 'completed';
        plan.updatedAt = Date.now();
        return plan;
    }

    pause(planId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan || plan.status !== 'running') return false;
        plan.status = 'paused';
        plan.updatedAt = Date.now();
        return true;
    }

    async step(planId: string): Promise<WorkPlan | undefined> {
        const plan = this.plans.get(planId);
        if (!plan) return undefined;
        const current = plan.steps.find((s) => s.status === 'queued');
        if (!current) return plan;
        plan.status = 'running';
        plan.currentStep = plan.steps.indexOf(current);
        current.status = 'running';
        current.startedAt = Date.now();
        try {
            if (current.actionId && this.deps.runAction) {
                const out = await this.deps.runAction(current.actionId, current.args ?? {});
                current.result = out.detail ?? (out.ok ? 'ok' : 'failed');
                current.status = out.ok ? 'completed' : 'failed';
                if (!out.ok) current.error = out.detail;
            } else {
                current.status = 'completed';
                current.result = 'step completed (no action bound)';
            }
        } catch (e) {
            current.status = 'failed';
            current.error = e instanceof Error ? e.message : String(e);
        }
        current.finishedAt = Date.now();
        plan.updatedAt = Date.now();
        if (!plan.steps.some((s) => s.status === 'queued' || s.status === 'running')) {
            plan.status = plan.steps.some((s) => s.status === 'failed') ? 'failed' : 'completed';
            plan.currentStep = undefined;
        }
        return plan;
    }
}
