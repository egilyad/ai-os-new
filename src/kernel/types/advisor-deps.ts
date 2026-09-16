import type { SystemState } from './metrics-types';
import type { KeyState } from '../contracts/key-state';
import type { ICapabilityManager } from '../contracts/capability-manager';

export interface AdvisorServiceDeps {
    capabilityManager: ICapabilityManager;
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    kernel: { getState: () => SystemState };
    keyService: {
        getKeys: () => Array<{
            id: string;
            provider: string;
            key: string;
            status: string;
            label?: string;
            createdAt?: number;
            latency?: number;
            availableModels?: string[];
            stats?: {
                successCount?: number;
                errorCount?: number;
                extended?: {
                    usageToday?: { requests: number };
                    fourSignals?: {
                        latency: number;
                        throughput: number;
                        errorRate: number;
                        saturation: number;
                    };
                    rules?: { quota?: { requestsPerDay: number } };
                    alerts?: Array<{ resolved: boolean; severity: string }>;
                    stabilityForecast?: string;
                    reputationScore?: number;
                    estimatedCost?: number;
                    errorBreakdown?: { rateLimit?: number; timeout?: number };
                };
            };
        }>;
        updateKeyStatus: (id: string, status: string, latency?: number) => void;
        setLatencyThreshold?: (ms: number) => void;
        getPoolStatus: (provider: string) => { status: string };
        getAlerts: () => Array<{ severity: string }>;
    };
    routerService: {
        getRankedProviders: (
            strategy: string,
            prompt: string,
            priority?: string,
            agentId?: string,
        ) => Array<{
            id: string;
            provider: string;
            key: string;
            label: string;
            availableModels?: string[];
        }>;
        setStrategy: (strategy: string) => void;
        getProviderStats: () => Array<{
            id: string;
            status: string;
            reliability: number;
            avgTTFT: number;
        }>;
    };
    adapterRegistry: {
        getAdapter: (provider: string) =>
            | {
                  sendMessage: (
                      messages: { role: string; content: string }[],
                      model: string,
                      apiKey: string,
                      signal?: AbortSignal,
                  ) => Promise<{ content: string }>;
              }
            | undefined;
        getAllAdapters: () => Record<
            string,
            {
                sendMessage: (
                    messages: { role: string; content: string }[],
                    model: string,
                    apiKey: string,
                ) => Promise<{ content: string }>;
                checkHealth?: (
                    key: string,
                ) => Promise<{ status: string; error?: string; models?: string[] }>;
            }
        >;
    };
    orchestrator: {
        getActiveTopology: () => {
            nodes: Array<{
                id: string;
                label: string;
                type: string;
                config: Record<string, unknown>;
                model?: string;
                provider?: string;
            }>;
        } | null;
    };
    keyStateStore?: { get: (id: string) => KeyState | undefined };
    budgetService: {
        getBudgetInfo: () => {
            monthlyBudget: number;
            spentThisMonth: number;
            remainingBudget: number;
            dailyAverage: number;
            projectedMonthly: number;
            providerBudgets: Array<{
                provider: string;
                monthlyBudget: number;
                spentThisMonth: number;
                remainingBudget: number;
            }>;
        };
        getSpendSummary: () => {
            global: { pct: number; remaining: number };
            providers: Array<{ provider: string; pct: number }>;
        };
    };
    metricsService: {
        generateReport: () => {
            aggregated: {
                totalRequests: number;
                totalTokens: number;
                estimatedCost: number;
                avgLatency: number;
                successRate: number;
                errorRate: number;
            };
            providers: Array<{ id: string; status: string; reliability: number; avgTTFT: number }>;
        };
    };
}
