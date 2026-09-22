import type { ILifecycle } from '../contracts/lifecycle';
import type { IEventBus } from '../types/interfaces';
import type { IHypothesisService } from '../contracts/hypothesis';
import type { IDiagnosticService } from '../contracts/diagnostic-service';
import type { ResearchRunService } from './research-run-service';
import type { JournalEntry } from './agent-journal-service';
import type { HypothesisCategory } from '../types/research-types';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('InvestigationBridge');

/**
 * B1: investigation-bridge — первый живой junction ядра.
 *
 * Детектор (событие) → runDiagnostic → propose(hypothesis) + startRun.
 * Подписано: METRICS_ALERT(critical) / DIAGNOSTIC_COMPLETE(critical|degraded) /
 * AGENT_JOURNAL_ADDED(outcome=failure).
 *
 * Страховка Фазы 0: enabled-флаг (дефолт ON, см. phase68), дневной кап
 * расследований (дефолт 10, персист в KV), дедуп по ключу источника (1ч),
 * только propose+startRun — исполнения/мутаций мост НЕ делает.
 */
export interface InvestigationBridgeDeps {
    eventBus: IEventBus;
    hypothesis: IHypothesisService;
    runs: ResearchRunService;
    diagnostic: IDiagnosticService;
    database?: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
    enabled?: boolean;
    maxPerDay?: number;
}

interface MetricAlertPayload {
    id: string;
    metric: string;
    value: number;
    severity: string;
    timestamp: number;
}

interface DiagnosticCompletePayload {
    id: string;
    scope: string;
    health: string;
    score: number;
    issueCount: number;
    timestamp: number;
}

const KV_KEY = 'investigation_bridge_state';
const COOLDOWN_MS = 3600000;
const DEFAULT_MAX_PER_DAY = 10;

function dayKey(ts: number): string {
    return new Date(ts).toISOString().slice(0, 10);
}

export class InvestigationBridgeService implements ILifecycle {
    private deps: InvestigationBridgeDeps;
    private unsubs: Array<() => void> = [];
    private lastBySource = new Map<string, number>();
    private started = false;
    // Синхронный гейт дневного капа: check+increment атомарны в рамках тика
    // event-loop (KV — только персист для наблюдаемости, не источник правды).
    private capDay = '';
    private capUsed = 0;

    constructor(deps: InvestigationBridgeDeps) {
        this.deps = deps;
    }

    async init(): Promise<void> {
        await this.start();
    }

    async start(): Promise<void> {
        if (this.started) return;
        this.started = true;
        const bus = this.deps.eventBus;
        this.unsubs.push(
            bus.onSafe<MetricAlertPayload>(EVENTS.METRICS_ALERT, (data) => {
                if (data.severity !== 'critical') return;
                void this.investigate('metrics', `${data.metric}=${data.value}`, [`metric:${data.metric}`]);
            }),
        );
        this.unsubs.push(
            bus.onSafe<DiagnosticCompletePayload>(EVENTS.DIAGNOSTIC_COMPLETE, (data) => {
                if (data.health !== 'critical' && data.health !== 'degraded') return;
                if (data.issueCount <= 0) return;
                void this.investigate('diagnostic', `${data.scope} ${data.health} (${data.issueCount} issues)`, [
                    `diagnostic:${data.id}`,
                ]);
            }),
        );
        this.unsubs.push(
            bus.onSafe<JournalEntry>(EVENTS.AGENT_JOURNAL_ADDED, (data) => {
                if (data.outcome !== 'failure') return;
                void this.investigate(
                    'journal',
                    `${data.agentName} ${data.taskType} failed`,
                    [`journal:${data.id}`, `agent:${data.agentId}`],
                );
            }),
        );
    }

    destroy(): void {
        for (const u of this.unsubs) {
            try {
                u();
            } catch {
                /* ignore teardown errors */
            }
        }
        this.unsubs = [];
        this.started = false;
    }

    isEnabled(): boolean {
        return this.deps.enabled ?? true;
    }

    private categoryFor(source: string, summary: string): HypothesisCategory {
        if (/rout|model|provider|key/i.test(summary)) return 'routing';
        if (/govern|approv|policy/i.test(summary)) return 'gov';
        if (/prompt|debat|argu/i.test(summary)) return 'prompt';
        void source;
        return 'arch';
    }

    private async persistBudget(): Promise<void> {
        if (!this.deps.database) return;
        try {
            await this.deps.database.setKv(KV_KEY, { day: this.capDay, used: this.capUsed });
        } catch {
            /* budget best-effort */
        }
    }

    async investigate(source: string, summary: string, evidence: string[]): Promise<string | null> {
        if (!this.isEnabled()) return null;
        // Всё решение — синхронно до первого await: дедуп и кап атомарны.
        const key = `${source}:${summary}`;
        const last = this.lastBySource.get(key) || 0;
        if (Date.now() - last < COOLDOWN_MS) return null;
        const max = this.deps.maxPerDay ?? DEFAULT_MAX_PER_DAY;
        const today = dayKey(Date.now());
        if (this.capDay !== today) {
            this.capDay = today;
            this.capUsed = 0;
        }
        if (this.capUsed >= max) {
            LOGGER.warn('investigate', 'daily budget exhausted', { source });
            return null;
        }
        this.lastBySource.set(key, Date.now());
        this.capUsed += 1;
        try {
            const diag = await this.deps.diagnostic.runDiagnostic('system');
            const hypothesis = await this.deps.hypothesis.propose({
                title: `[auto] ${summary}`.slice(0, 200),
                description: `Auto-investigation from ${source}. Diagnostic: ${diag.health} score=${diag.score} issues=${diag.issueCount}.`,
                category: this.categoryFor(source, summary),
                evidenceRefs: evidence.slice(0, 10),
            });
            const run = this.deps.runs.startRun('investigation', {
                source,
                summary: summary.slice(0, 500),
                hypothesisId: hypothesis.id,
            });
            void this.persistBudget();
            LOGGER.info('investigate', 'opened', { hypothesisId: hypothesis.id, runId: run.id });
            return hypothesis.id;
        } catch (e) {
            LOGGER.warn('investigate', 'failed', { error: e instanceof Error ? e.message : String(e) });
            return null;
        }
    }
}
