import type { IInsightEngine, LLMAnalysisResult, AdvisorMetrics } from '../../contracts/advisor';
import type { KeyState } from '../../contracts/key-state';
import { safeJsonParse } from '../../../kernel/utils/safe-json';
import { PROVIDER_DEFAULT_MODELS } from '../../../kernel/utils/provider-default-models';

export interface InsightEngineDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    keyService: {
        getKeys: () => Array<{
            id: string;
            provider: string;
            key: string;
            status: string;
            label?: string;
            availableModels?: string[];
        }>;
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
    keyStateStore?: {
        get: (id: string) => KeyState | undefined;
    };
}

const FAILURE_CACHE_TTL_MS = 300_000;
const CIRCUIT_BREAKER_CACHE_TTL_MS = 120_000;

export class InsightEngine implements IInsightEngine {
    private deps: InsightEngineDeps;
    private metrics: AdvisorMetrics = {
        avgLatency: 0,
        errorRate: 0,
        costPerRequest: 0,
        providerReliability: {},
        bottleneckNodes: [],
    };

    private providerFailureCache = new Map<string, number>();
    private providerCbOpenCache = new Map<string, number>();

    constructor(deps: InsightEngineDeps) {
        this.deps = deps;
    }

    analyzeTraces(traces: unknown[]) {
        const recent = (
            traces as Array<{
                totalLatency?: number;
                semanticConfidence?: number;
                steps?: Array<{ id: string; duration?: number }>;
            }>
        ).slice(0, 10);
        if (recent.length === 0) return;

        const totalLatency = recent.reduce((sum, t) => sum + (t.totalLatency || 0), 0);
        this.metrics.avgLatency = totalLatency / recent.length;

        const nodeLatencies = new Map<string, { total: number; count: number }>();
        for (const trace of recent) {
            for (const step of trace.steps || []) {
                const existing = nodeLatencies.get(step.id) || { total: 0, count: 0 };
                existing.total += step.duration || 0;
                existing.count++;
                nodeLatencies.set(step.id, existing);
            }
        }

        this.metrics.bottleneckNodes = [];
        // B10-52: Divide by per-node occurrence count, not total trace count
        nodeLatencies.forEach(({ total, count }, nodeId) => {
            if (count > 0 && total / count > 2000) this.metrics.bottleneckNodes.push(nodeId);
        });
    }

    analyzeKernelState(state: unknown) {
        const s = state as {
            violations?: string[];
            estimatedCost?: number;
            totalRequests?: number;
        };
        if (s.violations?.length) {
            this.metrics.errorRate = Math.min(
                1,
                s.violations.length / Math.max(1, s.totalRequests || 1),
            );
        }
    }

    getMetrics(): AdvisorMetrics {
        return { ...this.metrics };
    }

    private isProviderCachedAsDead(provider: string): { dead: boolean; reason: string } {
        const now = Date.now();
        const lastFail = this.providerFailureCache.get(provider);
        if (lastFail && now - lastFail < FAILURE_CACHE_TTL_MS) {
            return { dead: true, reason: `failed at ${new Date(lastFail).toISOString()}` };
        }
        const lastCbOpen = this.providerCbOpenCache.get(provider);
        if (lastCbOpen && now - lastCbOpen < CIRCUIT_BREAKER_CACHE_TTL_MS) {
            return { dead: true, reason: `circuit open at ${new Date(lastCbOpen).toISOString()}` };
        }
        return { dead: false, reason: '' };
    }

    async generateLLMAnalysis(): Promise<LLMAnalysisResult | null> {
        const keys = this.deps.keyService.getKeys().filter((k) => k.status === 'active');
        if (keys.length === 0) return null;

        const ranked = this.deps.routerService.getRankedProviders(
            'performance',
            'System analysis and optimization',
        );
        const candidates = ranked.length > 0 ? ranked : keys;
        const triedProviders = new Set<string>();

        for (const candidate of candidates) {
            if (triedProviders.has(candidate.provider)) continue;
            triedProviders.add(candidate.provider);

            const kss = this.deps.keyStateStore?.get(candidate.id);
            if (kss?.flags.authFailed) continue;
            if (kss?.flags.circuitOpen) continue;
            if (kss?.flags.rateLimited && !kss?.lastProbe?.error) continue;
            if (kss?.status === 'broken') continue;

            const cached = this.isProviderCachedAsDead(candidate.provider);
            if (cached.dead) continue;

            const adapter = this.deps.adapterRegistry.getAdapter(candidate.provider);
            if (!adapter) continue;

            const key = candidate;

            const topology = this.deps.orchestrator.getActiveTopology();
            const topologySummary = topology?.nodes?.length
                ? `\n### Active Topology Nodes\n${topology.nodes.map((n) => `- [NODE] (model: ${n.model || 'auto'}, provider: ${n.provider || 'auto'})`).join('\n')}`
                : '\n### Active Topology\nNone mounted';

            const metricsSummary = `
## Current System Metrics
### Latency
- Average: ${Math.round(this.metrics.avgLatency)}ms
### Cost
- Current: $${this.metrics.costPerRequest.toFixed(4)}/request
### Provider Reliability
${
    Object.entries(this.metrics.providerReliability)
        .map(([p, r]) => `- ${p}: ${(r * 100).toFixed(0)}%`)
        .join('\n') || 'No data'
}
### Error Rate
${(this.metrics.errorRate * 100).toFixed(1)}%
`;

            const prompt = `Analyze these system metrics and provide optimization suggestions.
${metricsSummary}
${topologySummary}
Provide a JSON response with:
{
  "suggestions": [
    {
      "type": "latency|cost|accuracy|security",
      "title": "Brief title",
      "description": "Detailed description",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": ["action1", "action2"]
}
Focus on actionable, specific improvements.`;

            try {
                const messages = [
                    {
                        role: 'system' as const,
                        content:
                            'You are a system optimization expert. Respond with valid JSON only.',
                    },
                    { role: 'user' as const, content: prompt },
                ];
                const PROVDER_DEFAULTS: Record<string, string> = {
                    ...PROVIDER_DEFAULT_MODELS,
                    gemini: 'gemini-3.1-flash-lite',
                    groq: 'llama-3.3-70b-versatile',
                    openrouter: PROVIDER_DEFAULT_MODELS.openrouter!,
                    nvidia: 'meta/llama-3.3-70b-instruct',
                    deepseek: 'deepseek-chat',
                    cohere: 'command-r-plus',
                };
                const modelId =
                    PROVDER_DEFAULTS[key.provider.toLowerCase()] ||
                    key.availableModels?.[0] ||
                    'auto';
                const response = await adapter.sendMessage(messages, modelId, key.key);
                const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = safeJsonParse(jsonMatch[0]) as
                        Record<string, unknown> | undefined;
                    const r = (parsed ?? {}) as Record<string, unknown>;
                    return {
                        suggestions: (Array.isArray(r.suggestions)
                            ? r.suggestions
                            : []) as LLMAnalysisResult['suggestions'],
                        bottlenecks: (Array.isArray(r.bottlenecks)
                            ? r.bottlenecks
                            : []) as string[],
                        recommendations: (Array.isArray(r.recommendations)
                            ? r.recommendations
                            : []) as string[],
                    };
                }
            } catch {
                this.providerFailureCache.set(candidate.provider, Date.now());
            }
        }

        return null;
    }
}
