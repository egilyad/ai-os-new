export interface MigrationPlan {
    id: string;
    name: string;
    description: string;
    sourceProvider: string;
    targetProvider: string;
    models: string[];
    status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
    steps: MigrationStep[];
    createdAt: number;
    completedAt?: number;
}

export interface MigrationStep {
    id: string;
    action: string;
    detail: string;
    status: 'pending' | 'running' | 'done' | 'error';
    error?: string;
}

export interface IProviderMigrationService {
    getPlans(): MigrationPlan[];
    createPlan(name: string, source: string, target: string, models: string[]): MigrationPlan;
    executePlan(id: string): Promise<MigrationPlan>;
    rollbackPlan(id: string): Promise<MigrationPlan>;
    deletePlan(id: string): void;
}
