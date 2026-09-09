import { rootLogger } from './logger-service';
import type {
    IDeployService,
    DeployConfig,
    Deployment,
    DeployEnvironment,
    DeployStatus,
} from '../contracts/deploy';
import { ssrSafeStorage } from '../utils/ssr-storage';
import { isPrivateIP } from '../utils/network';

const LOGGER = rootLogger.child('DeployService');

const STORAGE_KEY = 'deploy_data';

function id(): string {
    return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

interface PersistedData {
    configs: DeployConfig[];
    deployments: Deployment[];
}

/**
 * @deprecated MOCK — simulated deployment. No real build, upload, or server interaction.
 * Replace with CI/CD webhook or SSH-based deployment before production use.
 */
export class DeployService implements IDeployService {
    private configs: DeployConfig[] = [];
    private deployments: Deployment[] = [];
    private timers = new Map<string, ReturnType<typeof setInterval>>();
    private _initialized = false;
    private readonly apiEndpoint: string | null;

    constructor(endpoint?: string) {
        this.apiEndpoint = endpoint ?? null;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw) as PersistedData;
                this.configs = data.configs ?? [];
                this.deployments = data.deployments ?? [];
            }
        } catch {
            this.configs = [];
            this.deployments = [];
        }
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): void {
        for (const t of this.timers.values()) clearInterval(t);
        this.timers.clear();
        this.configs = [];
        this.deployments = [];
    }

    private persist(): void {
        try {
            ssrSafeStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ configs: this.configs, deployments: this.deployments }),
            );
        } catch (e) {
            LOGGER.warn('DeployService', 'persist failed', { error: String(e) });
        }
    }

    getConfigs(): DeployConfig[] {
        return this.configs;
    }

    addConfig(data: Omit<DeployConfig, 'id' | 'createdAt' | 'updatedAt'>): DeployConfig {
        const cfg: DeployConfig = {
            ...data,
            id: id(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.configs.push(cfg);
        this.persist();
        return cfg;
    }

    updateConfig(id: string, updates: Partial<DeployConfig>): void {
        const cfg = this.configs.find((c) => c.id === id);
        if (!cfg) return;
        Object.assign(cfg, updates, { updatedAt: Date.now() });
        this.persist();
    }

    removeConfig(id: string): void {
        this.configs = this.configs.filter((c) => c.id !== id);
        this.persist();
    }

    getDeployments(configId?: string): Deployment[] {
        if (configId) return this.deployments.filter((d) => d.configId === configId);
        return this.deployments;
    }

    async deploy(configId: string): Promise<Deployment> {
        const cfg = this.configs.find((c) => c.id === configId);
        if (!cfg) throw new Error(`Deploy config ${configId} not found`);

        if (this.apiEndpoint) {
            // SSRF protection: validate endpoint before making any network request
            let parsed: URL;
            try {
                parsed = new URL(this.apiEndpoint);
            } catch {
                throw new Error(`Deploy endpoint is not a valid URL: ${this.apiEndpoint}`);
            }
            if (parsed.protocol !== 'https:') {
                throw new Error(`Deploy endpoint must use HTTPS, got: ${parsed.protocol}`);
            }
            if (isPrivateIP(parsed.hostname)) {
                throw new Error(
                    `Deploy endpoint resolves to a private/internal IP: ${parsed.hostname}`,
                );
            }
            const dep: Deployment = {
                id: id(),
                configId,
                environment: cfg.environment,
                version: `${cfg.environment === 'production' ? '1' : '0'}.0.0-${id()}`,
                status: 'pending',
                progress: 0,
                logs: [{ timestamp: Date.now(), level: 'info', message: 'Deployment queued...' }],
                url: null,
                commitHash: id().slice(0, 12),
                startedAt: Date.now(),
                completedAt: null,
                rollbackTarget: null,
            };
            this.deployments.push(dep);
            try {
                const res = await fetch(`${this.apiEndpoint}/deploy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        configId,
                        environment: cfg.environment,
                        domain: cfg.domain,
                    }),
                });
                if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
                const result = await res.json();
                Object.assign(dep, result, {
                    status: result.status ?? 'building',
                    error: undefined,
                });
            } catch (err: unknown) {
                dep.status = 'failed';
                dep.logs.push({
                    timestamp: Date.now(),
                    level: 'error',
                    message: `API call failed: ${err instanceof Error ? err.message : String(err)}`,
                });
            }
            this.persist();
            return dep;
        }

        LOGGER.warn(
            'DeployService',
            'deploy uses @deprecated MOCK backend — no real build, upload, or server interaction',
            { configId },
        );

        const dep: Deployment = {
            id: id(),
            configId,
            environment: cfg.environment,
            version: `${cfg.environment === 'production' ? '1' : '0'}.0.0-${id()}`,
            status: 'pending',
            progress: 0,
            logs: [{ timestamp: Date.now(), level: 'info', message: 'Deployment queued...' }],
            url: null,
            commitHash: id().slice(0, 12),
            startedAt: Date.now(),
            completedAt: null,
            rollbackTarget: null,
        };

        this.deployments.push(dep);
        this.persist();
        this.simulateDeploy(dep);
        return dep;
    }

    rollback(deploymentId: string): Deployment {
        const dep = this.deployments.find((d) => d.id === deploymentId);
        if (!dep || dep.status !== 'live') throw new Error('Cannot rollback: not live');

        const rollbackDep: Deployment = {
            id: id(),
            configId: dep.configId,
            environment: dep.environment,
            version: `${dep.version}-rollback`,
            status: 'pending',
            progress: 0,
            logs: [
                {
                    timestamp: Date.now(),
                    level: 'info',
                    message: `Rollback from ${dep.version}...`,
                },
            ],
            url: dep.url,
            commitHash: dep.commitHash,
            startedAt: Date.now(),
            completedAt: null,
            rollbackTarget: dep.id,
        };

        this.deployments.push(rollbackDep);
        this.persist();
        this.simulateDeploy(rollbackDep, true);
        return rollbackDep;
    }

    cancelDeploy(deploymentId: string): void {
        const dep = this.deployments.find((d) => d.id === deploymentId);
        if (!dep) return;
        const timer = this.timers.get(dep.id);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(dep.id);
        }
        dep.status = 'failed';
        dep.logs.push({ timestamp: Date.now(), level: 'warn', message: 'Deployment cancelled.' });
        this.persist();
    }

    getEnvironments(): DeployEnvironment[] {
        return ['development', 'staging', 'production'];
    }

    getDomains(): string[] {
        return ['app.example.com', 'api.example.com', 'staging.example.com', 'dev.example.com'];
    }

    private simulateDeploy(dep: Deployment, isRollback = false): void {
        const stages = isRollback
            ? [
                  {
                      status: 'building' as DeployStatus,
                      progress: 30,
                      msg: 'Restoring previous build...',
                  },
                  {
                      status: 'deploying' as DeployStatus,
                      progress: 60,
                      msg: 'Rolling back to previous version...',
                  },
                  {
                      status: 'verifying' as DeployStatus,
                      progress: 85,
                      msg: 'Verifying rollback...',
                  },
              ]
            : [
                  {
                      status: 'building' as DeployStatus,
                      progress: 25,
                      msg: 'Building application...',
                  },
                  { status: 'building' as DeployStatus, progress: 50, msg: 'Optimizing assets...' },
                  {
                      status: 'deploying' as DeployStatus,
                      progress: 70,
                      msg: 'Uploading to server...',
                  },
                  {
                      status: 'verifying' as DeployStatus,
                      progress: 90,
                      msg: 'Running health check...',
                  },
              ];

        let stageIndex = 0;
        const timer = setInterval(() => {
            if (stageIndex >= stages.length) {
                clearInterval(timer);
                this.timers.delete(dep.id);
                dep.status = 'live';
                dep.progress = 100;
                dep.completedAt = Date.now();
                dep.url = `https://${dep.environment === 'production' ? 'app' : dep.environment}.example.com`;
                dep.logs.push({
                    timestamp: Date.now(),
                    level: 'info',
                    message: isRollback ? 'Rollback complete.' : 'Deployment live!',
                });
                this.persist();
                return;
            }

            const stage = stages[stageIndex]!;
            dep.status = stage.status;
            dep.progress = stage.progress;
            dep.logs.push({ timestamp: Date.now(), level: 'info', message: stage.msg });
            stageIndex++;
        }, 2500);

        this.timers.set(dep.id, timer);
    }
}
