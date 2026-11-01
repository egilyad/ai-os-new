import type { IEventBus } from '../../types/interfaces';
import type { IMetricsService } from '../../contracts/metrics';
import { EVENTS } from '../../events/event-names';

/**
 * MetricsCollector — мост «события → metricsService» (SPEC_03).
 *
 * Слушает ключевые события рантайма и пишет серии в единый MetricsService,
 * чтобы панели (useMetrics/RuntimeMetricsView) получали живые данные.
 * Автономен и безопасен: лишние события не ломают основной поток.
 */
export class MetricsCollector {
    private unsubs: Array<() => void> = [];
    private started = false;
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private static readonly FLUSH_INTERVAL_MS = 30_000;

    constructor(
        private events: IEventBus,
        private metrics: IMetricsService,
    ) {}

    start(): void {
        if (this.started) return;
        this.started = true;

        // Периодический flush в персистентное хранилище (Dexie).
        this.flushTimer = setInterval(() => {
            void this.metrics.flush().catch(() => {});
        }, MetricsCollector.FLUSH_INTERVAL_MS);

        this.unsubs.push(
            this.events.on(EVENTS.CHAT_STREAM_END, (data: unknown) => {
                const d = data as { latency?: number; tokens?: { input?: number; output?: number } };
                this.metrics.inc('llm.request');
                if (typeof d?.latency === 'number') {
                    this.metrics.record('llm.latency', d.latency);
                }
                if (typeof d?.tokens?.input === 'number') {
                    this.metrics.record('llm.tokens_input', d.tokens.input);
                }
                if (typeof d?.tokens?.output === 'number') {
                    this.metrics.record('llm.tokens_output', d.tokens.output);
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.CHAT_STREAM_ERROR, () => {
                this.metrics.inc('llm.error');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.TOOL_EXECUTION_ERROR, () => {
                this.metrics.inc('tool.error');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.TOOL_EXECUTION_ERROR, () => {
                this.metrics.inc('tool.error');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.TOOL_EXECUTION_ERROR, () => {
                this.metrics.inc('tool.error');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.TOOL_EXECUTED, (data: unknown) => {
                const d = data as { tool?: string; ok?: boolean; latencyMs?: number };
                this.metrics.inc('tool.exec', 1, { tool: String(d?.tool ?? 'unknown') });
                if (typeof d?.latencyMs === 'number') {
                    this.metrics.record('tool.latency', d.latencyMs);
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.MEMORY_UPDATED, () => {
                this.metrics.inc('memory.writes');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.MEMORY_REMEMBERED, () => {
                this.metrics.inc('memory.reads');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.DEBATE_AGENT_RESPONDED, () => {
                this.metrics.inc('debate.agent_turns');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.ROUTER_SIGNAL, (data: unknown) => {
                const d = data as { wasFallback?: boolean };
                this.metrics.inc('router.decision');
                if (d?.wasFallback) {
                    this.metrics.inc('router.fallback');
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.KEY_HEALTH_CHECK_FAILED, () => {
                this.metrics.inc('provider.health_failed');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.KEY_PROBE_RESULT, (data: unknown) => {
                const d = data as { status?: string; provider?: string; latency?: number };
                this.metrics.inc('provider.probe');
                const p = String(d?.provider ?? 'unknown');
                if (d?.status === 'active') {
                    this.metrics.gauge('provider.active', 1, { provider: p });
                } else {
                    this.metrics.gauge('provider.active', 0, { provider: p });
                }
                if (typeof d?.latency === 'number') {
                    this.metrics.record('provider.latency', d.latency, { provider: p });
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.DEBATE_ROUND_ENDED, () => {
                this.metrics.inc('debate.rounds');
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.DEBATE_VERDICT_GENERATED, (data: unknown) => {
                const d = data as { confidence?: number };
                this.metrics.inc('debate.verdicts');
                if (typeof d?.confidence === 'number') {
                    this.metrics.record('debate.verdict_confidence', d.confidence);
                }
            }),
        );

        this.unsubs.push(
            this.events.on(EVENTS.POLICY_VIOLATION, () => {
                this.metrics.inc('policy.violations');
            }),
        );
    }

    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        this.started = false;
    }
}
