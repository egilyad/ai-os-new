import type { IProviderMigrationService, MigrationPlan } from '../contracts/provider-migration';
import type { IKeyService } from '../types/interfaces';

const genId = () => crypto.randomUUID();

export interface ProviderMigrationServiceDeps {
    keyService: IKeyService;
}

/**
 * @deprecated MOCK — simulated backend. Migration steps are no-ops. Replace with real
 * provider API migration logic before production use.
 */
export class ProviderMigrationService implements IProviderMigrationService {
    private plans: MigrationPlan[] = [];
    private deps: ProviderMigrationServiceDeps;

    constructor(deps: ProviderMigrationServiceDeps) {
        this.deps = deps;
    }

    getPlans(): MigrationPlan[] {
        return [...this.plans];
    }

    createPlan(name: string, source: string, target: string, models: string[]): MigrationPlan {
        const plan: MigrationPlan = {
            id: genId(),
            name,
            description: `Migrate from ${source} to ${target}`,
            sourceProvider: source,
            targetProvider: target,
            models,
            status: 'draft',
            steps: [
                { id: genId(), action: 'Validate credentials', detail: '', status: 'pending' },
                { id: genId(), action: 'Deploy models', detail: '', status: 'pending' },
                { id: genId(), action: 'Migrate routing rules', detail: '', status: 'pending' },
                { id: genId(), action: 'Verify parity', detail: '', status: 'pending' },
                { id: genId(), action: 'Full cutover', detail: '', status: 'pending' },
            ],
            createdAt: Date.now(),
        };
        this.plans.push(plan);
        return plan;
    }

    async executePlan(id: string): Promise<MigrationPlan> {
        const plan = this.plans.find((p) => p.id === id);
        if (!plan) throw new Error(`Plan ${id} not found`);
        plan.status = 'in_progress';

        const setStep = (
            idx: number,
            status: MigrationPlan['steps'][0]['status'],
            detail: string,
        ) => {
            if (plan.steps[idx]) {
                plan.steps[idx] = { ...plan.steps[idx], status, detail };
            }
        };

        // Step 1: Validate target provider credentials
        const targetKeys = this.deps.keyService.getKeysByProvider(plan.targetProvider);
        if (targetKeys.length > 0) {
            const usable = targetKeys.some((k) => this.deps.keyService.canUseKey(k.id).can);
            setStep(
                0,
                'done',
                `${plan.targetProvider}: ${targetKeys.length} key(s), ${usable ? 'healthy' : 'degraded'}`,
            );
        } else {
            setStep(0, 'error', `No API keys found for ${plan.targetProvider}`);
            plan.status = 'failed';
            return { ...plan };
        }

        // Step 2: Source provider check
        const sourceKeys = this.deps.keyService.getKeysByProvider(plan.sourceProvider);
        setStep(1, 'done', `Source ${plan.sourceProvider}: ${sourceKeys.length} key(s)`);

        // Step 3: Circuit breaker check
        const circuitOpen = this.deps.keyService.isProviderCircuitOpen(plan.targetProvider);
        setStep(
            2,
            'done',
            circuitOpen ? 'Target circuit is open — may need recovery' : 'Target provider healthy',
        );

        // Step 4: Health verification
        const healthy = targetKeys.filter((k) => this.deps.keyService.canUseKey(k.id).can);
        setStep(3, 'done', `${healthy.length}/${targetKeys.length} target keys healthy`);

        // Step 5: Cutover
        setStep(4, 'done', 'Migration plan ready');
        plan.status = 'completed';
        plan.completedAt = Date.now();
        return { ...plan };
    }

    async rollbackPlan(id: string): Promise<MigrationPlan> {
        const plan = this.plans.find((p) => p.id === id);
        if (!plan) throw new Error(`Plan ${id} not found`);
        plan.status = 'rolled_back';
        for (const step of plan.steps) {
            step.status = 'pending';
            step.detail = '';
        }
        return { ...plan };
    }

    deletePlan(id: string): void {
        this.plans = this.plans.filter((p) => p.id !== id);
    }
}
