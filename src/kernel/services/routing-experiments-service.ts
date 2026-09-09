import { rootLogger } from './logger-service';
import { genId } from '../../utils/gen-id';
import type {
    IRoutingExperimentsService,
    RoutingExperimentConfig,
    RoutingExperimentResult,
    RoutingExperimentRun,
    StrategyComparison,
} from '../contracts/routing-experiments';

const STORAGE_KEY = 'routing_experiment_history';
const MAX_RUNS_PER_CELL = 3;
const COST_PER_RUN = 0.02;
const TEST_PROMPT = 'Reply only: OK';

export interface RoutingExperimentsServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    resolveApiKey: (provider: string) => string;
    getAdapter: (provider: string) => {
        sendMessage: (
            messages: Array<{ role: string; content: string }>,
            model: string,
            apiKey: string,
            temperature?: number,
            maxTokens?: number,
        ) => Promise<{ content?: string }>;
    } | null;
}

function clampRunsPerCell(runsPerCell: number): number {
    return Math.max(1, Math.min(MAX_RUNS_PER_CELL, runsPerCell));
}

export class RoutingExperimentsService implements IRoutingExperimentsService {
    constructor(private deps: RoutingExperimentsServiceDeps) {}

    totalRuns(config: RoutingExperimentConfig): number {
        const runs = clampRunsPerCell(config.runsPerCell);
        return config.providers.length * config.models.length * config.strategies.length * runs;
    }

    estimateCost(config: RoutingExperimentConfig): number {
        return this.totalRuns(config) * COST_PER_RUN;
    }

    generateMockResults(config: RoutingExperimentConfig, seed?: number): RoutingExperimentResult[] {
        const results: RoutingExperimentResult[] = [];
        let s = seed ?? Date.now();
        const rng = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
        for (const provider of config.providers) {
            for (const model of config.models) {
                for (const strategy of config.strategies) {
                    const latency = Math.round(200 + rng() * 3000);
                    results.push({
                        provider,
                        model,
                        strategy,
                        avgLatency: latency,
                        avgTokens: Math.round(100 + rng() * 900),
                        errorRate: Math.round(rng() * 30) / 100,
                        cost: Math.round((rng() * 5 + 0.1) * 100) / 100,
                        repetition: Math.round(rng() * 40) / 100,
                        uniqueness: Math.round((30 + rng() * 70) * 100) / 100,
                    });
                }
            }
        }
        return results;
    }

    computeComparison(results: RoutingExperimentResult[]): StrategyComparison[] {
        const grouped: Record<string, RoutingExperimentResult[]> = {};
        for (const r of results) {
            grouped[r.strategy] ??= [];
            grouped[r.strategy]!.push(r);
        }
        return Object.entries(grouped).map(([strategy, items]) => ({
            strategy,
            avgLatency: Math.round(items.reduce((sum, r) => sum + r.avgLatency, 0) / items.length),
            avgCost:
                Math.round((items.reduce((sum, r) => sum + r.cost, 0) / items.length) * 1000) /
                1000,
            avgErrorRate:
                Math.round((items.reduce((sum, r) => sum + r.errorRate, 0) / items.length) * 100) /
                100,
            avgUniqueness: Math.round(
                items.reduce((sum, r) => sum + r.uniqueness, 0) / items.length,
            ),
        }));
    }

    async getHistory(): Promise<RoutingExperimentRun[]> {
        const saved = await this.deps.database.getKv<RoutingExperimentRun[]>(STORAGE_KEY);
        return saved ?? [];
    }

    async saveRun(run: RoutingExperimentRun): Promise<void> {
        const history = await this.getHistory();
        await this.deps.database.setKv(STORAGE_KEY, [run, ...history]);
    }

    async deleteRun(id: string): Promise<void> {
        const history = await this.getHistory();
        await this.deps.database.setKv(
            STORAGE_KEY,
            history.filter((h) => h.id !== id),
        );
    }

    async runExperiment(
        config: RoutingExperimentConfig,
        onProgress?: (message: string) => void,
    ): Promise<RoutingExperimentRun> {
        const runsPerCell = clampRunsPerCell(config.runsPerCell);
        const normalized: RoutingExperimentConfig = { ...config, runsPerCell };
        const realMode = config.realMode ?? false;

        let results: RoutingExperimentResult[];

        if (realMode) {
            results = [];
            for (const provider of normalized.providers) {
                for (const model of normalized.models) {
                    const adapter = this.deps.getAdapter(provider);
                    if (!adapter) {
                        onProgress?.(`${provider}: no adapter`);
                        continue;
                    }
                    for (const strategy of normalized.strategies) {
                        onProgress?.(`${provider}/${model}/${strategy}...`);
                        const latencies: number[] = [];
                        let errorCount = 0;
                        for (let i = 0; i < runsPerCell; i++) {
                            const start = Date.now();
                            try {
                                const apiKey = this.deps.resolveApiKey(provider);
                                const resp = await adapter.sendMessage(
                                    [{ role: 'user', content: TEST_PROMPT }],
                                    model,
                                    apiKey,
                                    undefined,
                                    undefined,
                                );
                                latencies.push(Date.now() - start);
                                if (!resp.content) errorCount++;
                            } catch (e) {
                                rootLogger.warn('RoutingExperiments', 'Experiment cell failed', {
                                    error: e,
                                });
                                errorCount++;
                                latencies.push(Date.now() - start);
                            }
                        }
                        results.push({
                            provider,
                            model,
                            strategy,
                            avgLatency:
                                latencies.length > 0
                                    ? Math.round(
                                          latencies.reduce((a, b) => a + b, 0) / latencies.length,
                                      )
                                    : 0,
                            avgTokens: 10,
                            errorRate: runsPerCell > 0 ? errorCount / runsPerCell : 0,
                            cost: 0,
                            repetition: 0,
                            uniqueness: 100,
                        });
                    }
                }
            }
        } else {
            results = this.generateMockResults(normalized);
        }

        const run: RoutingExperimentRun = {
            id: genId('exp'),
            timestamp: Date.now(),
            providers: [...normalized.providers],
            models: [...normalized.models],
            strategies: [...normalized.strategies],
            runsPerCell,
            totalRuns: this.totalRuns(normalized),
            results,
            estimatedCost: this.estimateCost(normalized),
            realMode,
        };

        await this.saveRun(run);
        return run;
    }
}
