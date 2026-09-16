import { CONFIG } from './config-registry';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('AdvisorService');
import type { CognitiveTrace } from '../types/domain-types';
import type { SystemState } from '../types/metrics-types';
import type { AdvisorServiceDeps } from '../types/advisor-deps';
import type {
    AdvisorConfig,
    AdvisorMetrics,
    DiagnosticFinding,
    OptimizationSuggestion,
    PressureMapSnapshot,
} from '../contracts/advisor';
import { PressureEngine } from './advisor/pressure-engine';
import type { PressureEngineDeps } from './advisor/pressure-engine';
import { DiagnosticsEngine } from './advisor/diagnostics-engine';
import type { DiagnosticsEngineDeps } from './advisor/diagnostics-engine';
import { WhatIfEngine } from './advisor/whatif-engine';
import type { WhatIfEngineDeps } from './advisor/whatif-engine';
import { InsightEngine } from './advisor/insight-engine';
import type { InsightEngineDeps } from './advisor/insight-engine';
import { OptimizationEngine } from './advisor/optimization-engine';
import type { OptimizationEngineDeps } from './advisor/optimization-engine';
import { EVENTS } from '../events/event-names';

export type { AdvisorServiceDeps } from '../types/advisor-deps';
export type { ProposedChange } from '../contracts/advisor';
export type { OptimizationSuggestion, AdvisorMetrics, AdvisorConfig } from '../contracts/advisor';
export type {
    PressureMapSnapshot,
    ProviderPressure,
    GlobalPressure,
    AdvisorPressureLevel,
} from '../contracts/advisor';
export type { DiagnosticFinding, ProviderDiagnostic } from '../contracts/advisor';
export type { WhatIfScenario, RuntimeScenario } from '../contracts/advisor';

const DEFAULT_FREE_TIER_LIMITS: Record<string, { requestsPerDay: number; tokensPerDay: number }> = {
    ...CONFIG.keys.freeTierLimits,
    OpenRouter: { requestsPerDay: 0, tokensPerDay: 0 },
    Together: { requestsPerDay: 0, tokensPerDay: 0 },
    Cerebras: { requestsPerDay: 0, tokensPerDay: 0 },
    Cloudflare: { requestsPerDay: 0, tokensPerDay: 0 },
};

export class AdvisorService {
    private pressure: PressureEngine;
    private diagnostics: DiagnosticsEngine;
    private whatIf: WhatIfEngine;
    private insight: InsightEngine;
    private optimizer: OptimizationEngine;

    private config: AdvisorConfig = {
        enableAutoFix: false,
        latencyThreshold: CONFIG?.services?.advisor?.latencyThreshold ?? 4000,
        costThreshold: CONFIG?.services?.advisor?.costThreshold ?? 10,
        minConfidence: CONFIG?.services?.advisor?.minConfidence ?? 0.7,
        analysisIntervalMs: CONFIG?.services?.advisor?.analysisIntervalMs ?? 300000,
    };
    private lastAnalysis: number = 0;
    private unsubs: Array<() => void> = [];
    private periodicInterval: ReturnType<typeof setInterval> | null = null;
    private staggerTimeout: ReturnType<typeof setTimeout> | null = null;
    private deps: AdvisorServiceDeps;
    private _initialized = false;

    constructor(deps: AdvisorServiceDeps) {
        this.deps = deps;

        this.pressure = new PressureEngine({
            keyService: deps.keyService satisfies PressureEngineDeps['keyService'],
            kernel: deps.kernel satisfies PressureEngineDeps['kernel'],
            routerService: deps.routerService satisfies PressureEngineDeps['routerService'],
            budgetService: deps.budgetService satisfies PressureEngineDeps['budgetService'],
            metricsService: deps.metricsService satisfies PressureEngineDeps['metricsService'],
        });

        this.diagnostics = new DiagnosticsEngine({
            keyService: deps.keyService satisfies DiagnosticsEngineDeps['keyService'],
            freeTierLimits: DEFAULT_FREE_TIER_LIMITS,
        });

        this.whatIf = new WhatIfEngine({
            keyService: deps.keyService satisfies WhatIfEngineDeps['keyService'],
            budgetService: deps.budgetService satisfies WhatIfEngineDeps['budgetService'],
            freeTierLimits: DEFAULT_FREE_TIER_LIMITS,
        });

        this.insight = new InsightEngine({
            eventBus: deps.eventBus satisfies InsightEngineDeps['eventBus'],
            keyService: deps.keyService satisfies InsightEngineDeps['keyService'],
            routerService: deps.routerService satisfies InsightEngineDeps['routerService'],
            adapterRegistry: deps.adapterRegistry satisfies InsightEngineDeps['adapterRegistry'],
            orchestrator: deps.orchestrator satisfies InsightEngineDeps['orchestrator'],
            keyStateStore: deps.keyStateStore satisfies
                InsightEngineDeps['keyStateStore'] | undefined,
        });

        this.optimizer = new OptimizationEngine({
            eventBus: deps.eventBus satisfies OptimizationEngineDeps['eventBus'],
            routerService: deps.routerService satisfies OptimizationEngineDeps['routerService'],
            keyService: deps.keyService satisfies OptimizationEngineDeps['keyService'],
            budgetService: deps.budgetService satisfies OptimizationEngineDeps['budgetService'],
            freeTierLimits: DEFAULT_FREE_TIER_LIMITS,
        });
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.setupListeners();
        await this.loadState();
        this.startPeriodicAnalysis();
        
        // POC Integration Slice: Prove CapabilityManager connectivity
        const tools = this.deps.capabilityManager.listTools();
        LOGGER.info('SRE Agent (AdvisorService) initialized with capability manager', { toolCount: tools.length });
    }

    private setupListeners() {
        this.unsubs.push(
            this.deps.eventBus.onSafe<CognitiveTrace>(EVENTS.COGNITIVE_STEP_COMPLETED, (d) => {
                this.analyzeTraces([d]);
            }),
            this.deps.eventBus.onSafe<SystemState>(EVENTS.KERNEL_UPDATED, (d) => {
                this.analyzeKernel(d);
            }),
            this.deps.eventBus.onSafe<{ provider: string; error?: string }>(
                EVENTS.KEY_HEALTH_CHECK_FAILED,
                (d) => {
                    this.analyzeError(d);
                },
            ),
        );
    }

    destroy() {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        if (this.periodicInterval) {
            clearInterval(this.periodicInterval);
            this.periodicInterval = null;
        }
        if (this.staggerTimeout) {
            clearTimeout(this.staggerTimeout);
            this.staggerTimeout = null;
        }
        this.optimizer.destroy();
    }

    private async loadState() {
        try {
            const data = await this.deps.database.getKv<Record<string, unknown>>(
                'super_agents_advisor_state',
            );
            if (data) {
                if (data.config)
                    this.config = { ...this.config, ...(data.config as Partial<AdvisorConfig>) };
                if (data.lastAnalysis) this.lastAnalysis = data.lastAnalysis as number;
            }
        } catch (e) {
            LOGGER.error('AdvisorService', 'Failed to load state', { error: e });
        }
    }

    private startPeriodicAnalysis() {
        const stagger = Math.random() * 60000;
        this.staggerTimeout = setTimeout(() => {
            this.periodicInterval = setInterval(
                () => this.performDeepAnalysis(),
                this.config.analysisIntervalMs,
            );
        }, stagger);
    }

    private analyzeTraces(traces: CognitiveTrace[]) {
        if (traces.length === 0) return;
        const metrics = this.insight.getMetrics();

        if (metrics.avgLatency > this.config.latencyThreshold) {
            this.optimizer.propose({
                type: 'latency',
                title: 'High Average Latency Detected',
                description: `Recent traces average ${Math.round(metrics.avgLatency)}ms.`,
                impact: 'high',
                estimatedSavings: { latency: metrics.avgLatency * 0.3 },
            });
        }

        if (metrics.bottleneckNodes.length > 0) {
            this.optimizer.propose({
                type: 'latency',
                title: 'Bottleneck Nodes Identified',
                description: `Nodes ${metrics.bottleneckNodes.join(', ')} are slow.`,
                impact: 'medium',
                bottleneckNodes: metrics.bottleneckNodes,
            });
        }
    }

    private analyzeKernel(state: SystemState) {
        if (state.violations?.length) {
            this.optimizer.propose({
                type: 'security',
                title: 'Provider Reliability Issues',
                description: `${state.violations.length} violations detected.`,
                impact: 'high',
                autoExecutable: this.config.enableAutoFix,
            });
        }
        if ((state.estimatedCost || 0) > this.config.costThreshold) {
            this.optimizer.propose({
                type: 'cost',
                title: 'Cost Threshold Exceeded',
                description: `Estimated cost $${(state.estimatedCost || 0).toFixed(2)} exceeds threshold.`,
                impact: 'medium',
                estimatedSavings: { cost: (state.estimatedCost || 0) * 0.4 },
                autoExecutable: this.config.enableAutoFix,
            });
        }
    }

    private analyzeError(res: { provider: string; error?: string }) {
        const errorMsg = res.error || '';
        const diagnostic = this.diagnostics.analyzeProviderError(res.provider, errorMsg);
        this.optimizer.propose({
            type: diagnostic.impact === 'high' ? 'security' : 'topology',
            title: diagnostic.title,
            description: diagnostic.description,
            impact: diagnostic.impact,
            autoExecutable:
                (errorMsg.includes('429') || errorMsg.includes('Rate limit')) &&
                this.config.enableAutoFix,
        });
    }

    private async performDeepAnalysis() {
        if (Date.now() - this.lastAnalysis < this.config.analysisIntervalMs) return;
        this.lastAnalysis = Date.now();

        this.optimizer.checkBudgetHealth();
        this.optimizer.triggerAnalysis();

        this.whatIf.setAvgLatency(this.insight.getMetrics().avgLatency);
        const scenarios = this.whatIf.getRuntimeScenarios();
        for (const s of scenarios.filter((s) => s.impact === 'high')) {
            this.optimizer.propose({
                type: 'topology',
                title: `Opportunity: ${s.scenario}`,
                description: `${s.details} ${s.improvement}`,
                impact: 'medium',
                autoExecutable: this.config.enableAutoFix,
            });
        }

        const analysis = await this.insight.generateLLMAnalysis();
        if (analysis) {
            for (const suggestion of analysis.suggestions) {
                this.optimizer.propose({
                    type: suggestion.type,
                    title: suggestion.title,
                    description: suggestion.description,
                    impact: suggestion.impact,
                    autoExecutable: this.config.enableAutoFix,
                });
            }
        }
    }

    // ── Public API (backward-compatible) ──────────────────────────────

    getSuggestions(): OptimizationSuggestion[] {
        return this.optimizer.getSuggestions();
    }
    getMetrics(): AdvisorMetrics {
        return this.insight.getMetrics();
    }
    getSREAlerts() {
        return this.optimizer.getSREAlerts();
    }

    dismissSuggestion(suggestionId: string) {
        this.optimizer.dismissSuggestion(suggestionId);
    }
    executeFix(suggestionId: string) {
        this.optimizer.executeFix(suggestionId);
    }

    // ── Pressure Map ───────────────────────────────────────────────────
    getPressureSnapshot() {
        return this.pressure.generateSnapshot();
    }
    getLastPressureSnapshot() {
        return this.pressure.getLastSnapshot();
    }
    getProviderPressure(id: string) {
        return this.pressure.getProviderPressure(id);
    }
    onPressureUpdate(cb: (snapshot: PressureMapSnapshot) => void) {
        return this.pressure.onUpdate(cb);
    }
    startAutoRefresh(intervalMs?: number) {
        this.pressure.startAutoRefresh(intervalMs);
    }
    stopAutoRefresh() {
        this.pressure.stopAutoRefresh();
    }

    // ── Diagnostics ────────────────────────────────────────────────────
    analyzeKey(keyId: string) {
        return this.diagnostics.analyzeKey(keyId);
    }
    analyzeProviderError(provider: string, error: string) {
        return this.diagnostics.analyzeProviderError(provider, error);
    }
    getDiagnosticSummary(findings: DiagnosticFinding[]) {
        return this.diagnostics.generateSummary(findings);
    }
    getHealthScore(findings: DiagnosticFinding[]) {
        return this.diagnostics.getHealthScore(findings);
    }

    // ── What-If ─────────────────────────────────────────────────────────
    getWhatIfAnalysis() {
        return this.whatIf.getRuntimeScenarios();
    }
    analyzeAddKey(provider: string) {
        return this.whatIf.analyzeAddKey(provider);
    }
    analyzeSwitchProvider(from: string, to: string) {
        return this.whatIf.analyzeSwitchProvider(from, to);
    }
    analyzeBudgetChange(current: number, newBudget: number) {
        return this.whatIf.analyzeBudgetChange(current, newBudget);
    }
    getPromptCachingAdvice() {
        return this.whatIf.getPromptCachingAdvice();
    }

    // ── Config ─────────────────────────────────────────────────────────
    getConfig(): AdvisorConfig {
        return this.config;
    }
    updateConfig(config: Partial<AdvisorConfig>) {
        this.config = { ...this.config, ...config };
    }

    generateReport(): string {
        const metrics = this.insight.getMetrics();
        let report = `# Advisor Report - ${new Date().toLocaleString()}\n\n`;
        report += `## Current Metrics\n`;
        report += `- Avg Latency: ${Math.round(metrics.avgLatency)}ms\n`;
        report += `- Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%\n`;
        report += `- Cost/Request: $${metrics.costPerRequest.toFixed(4)}\n\n`;
        report += `## Active Suggestions (${this.optimizer.getSuggestions().length})\n`;
        for (const s of this.optimizer.getSuggestions().slice(0, 10)) {
            report += `### [${s.impact.toUpperCase()}] ${s.title}\n${s.description}\n\n`;
        }
        return report;
    }
}
