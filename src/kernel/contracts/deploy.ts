import type { ILifecycle } from './lifecycle';

export type DeployTarget = 'vercel' | 'docker' | 'custom';

export type DeployEnvironment = 'development' | 'staging' | 'production';

export type DeployStatus =
    'pending' | 'building' | 'deploying' | 'verifying' | 'live' | 'failed' | 'rolled_back';

export interface DeployConfig {
    id: string;
    name: string;
    target: DeployTarget;
    environment: DeployEnvironment;
    domain: string;
    apiKeys: string[];
    envVars: Record<string, string>;
    buildCommand: string;
    outputDir: string;
    region: string;
    autoDeploy: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface DeployLog {
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
}

export interface Deployment {
    id: string;
    configId: string;
    environment: DeployEnvironment;
    version: string;
    status: DeployStatus;
    progress: number;
    logs: DeployLog[];
    url: string | null;
    commitHash: string | null;
    startedAt: number;
    completedAt: number | null;
    rollbackTarget: string | null;
}

export interface IDeployService extends ILifecycle {
    getConfigs(): DeployConfig[];
    addConfig(config: Omit<DeployConfig, 'id' | 'createdAt' | 'updatedAt'>): DeployConfig;
    updateConfig(id: string, updates: Partial<DeployConfig>): void;
    removeConfig(id: string): void;

    getDeployments(configId?: string): Deployment[];
    deploy(configId: string): Promise<Deployment>;
    rollback(deploymentId: string): Deployment;
    cancelDeploy(deploymentId: string): void;

    getEnvironments(): DeployEnvironment[];
    getDomains(): string[];
}
