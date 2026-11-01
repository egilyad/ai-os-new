import type {
    EvalCase,
    EvalCaseResult,
    EvalRunReport,
    IEvalHub,
    IEvalHubDeps,
} from '../../contracts/eval-hub';

/**
 * По умолчанию: token_f1 (простая F1 по токенам).
 */
function defaultTokenF1(output: string, expected: string): { score: number; passed: boolean } {
    const tok = (s: string) =>
        s.toLowerCase().split(/[^a-zа-яё0-9]+/).filter(Boolean);
    const a = tok(output);
    const b = tok(expected);
    if (a.length === 0 || b.length === 0) {
        return { score: 0, passed: false };
    }
    const setB = new Set(b);
    const hits = a.filter((t) => setB.has(t)).length;
    const precision = hits / a.length;
    const recall = hits / b.length;
    const score = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return { score, passed: score >= 0.5 };
}

/**
 * EvalHub — единый движок оценки (SPEC_04).
 */
export class EvalHub implements IEvalHub {
    constructor(private deps: IEvalHubDeps) {}

    async run(cases: EvalCase[], opts?: { signal?: AbortSignal }): Promise<EvalRunReport> {
        const results: EvalCaseResult[] = [];
        for (const c of cases) {
            if (opts?.signal?.aborted) break;
            const repeat = Math.max(1, c.repeat ?? 1);
            let bestScore = -1;
            let bestResult: EvalCaseResult | null = null;
            for (let i = 0; i < repeat; i++) {
                const r = await this.runCase(c, opts);
                if (r.score > bestScore) {
                    bestScore = r.score;
                    bestResult = r;
                }
            }
            results.push(bestResult ?? (await this.runCase(c, opts)));
        }

        const passed = results.filter((r) => r.passed).length;
        const summary = {
            total: results.length,
            passed,
            failed: results.length - passed,
            avgScore: results.length ? results.reduce((s, r) => s + r.score, 0) / results.length : 0,
            avgLatency: results.length
                ? results.reduce((s, r) => s + r.latencyMs, 0) / results.length
                : 0,
            totalCost: results.reduce((s, r) => s + (r.costUsd ?? 0), 0),
        };

        // SPEC_03: запись результатов в единый MetricsService.
        if (this.deps.metrics) {
            this.deps.metrics.inc('eval.runs');
            this.deps.metrics.inc('eval.passed', passed);
            this.deps.metrics.record('eval.score', summary.avgScore);
            this.deps.metrics.record('eval.latency', summary.avgLatency);
        }

        return { results, summary };
    }

    private async runCase(c: EvalCase, opts?: { signal?: AbortSignal }): Promise<EvalCaseResult> {
        const started = Date.now();
        try {
            const { output, latencyMs, costUsd } = await this.deps.runPrompt(c.prompt, opts);
            const latency = latencyMs ?? Date.now() - started;
            const metrics: Record<string, number> = {};

            for (const metric of c.metrics ?? ['task_completion']) {
                if (metric === 'llm_rubric' && c.rubric && this.deps.judgeLLM) {
                    const j = await this.deps.judgeLLM(output, c.rubric);
                    metrics[metric] = j.score;
                } else {
                    const s = this.deps.score
                        ? this.deps.score(output, c.expected, metric)
                        : defaultTokenF1(output, c.expected ?? '');
                    metrics[metric] = s.score;
                }
            }

            const score = Object.values(metrics).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(metrics).length);
            let passed = score >= 0.5;
            if (c.thresholds?.latencyMaxMs && latency > c.thresholds.latencyMaxMs) {
                passed = false;
            }
            if (
                c.thresholds?.costMaxUsd !== undefined &&
                costUsd !== undefined &&
                costUsd > c.thresholds.costMaxUsd
            ) {
                passed = false;
            }

            return {
                caseId: c.id,
                passed,
                score,
                metrics,
                latencyMs: latency,
                costUsd,
            };
        } catch (e) {
            return {
                caseId: c.id,
                passed: false,
                score: 0,
                metrics: {},
                latencyMs: Date.now() - started,
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }
}
