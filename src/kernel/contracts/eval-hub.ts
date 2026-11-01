/**
 * Eval-хаб (SPEC_04 / ROADMAP_06).
 *
 * Сводит датасеты, прогоны и метрики в единый интерфейс (поверх существующих
 * EvalDatasetService / ScorerRegistryService / LlmJudgeService). Позволяет
 * оценивать систему (не только модель): task completion, step efficiency,
 * tool correctness, llm rubric, cost/latency пороги.
 */

export interface EvalCase {
    id: string;
    name: string;
    prompt: string;
    /** Ожидаемый эталон (опционально). */
    expected?: string;
    /** Мультиагентный состав (опционально). */
    agents?: string[];
    /** Метрики для оценки: task_completion | step_efficiency | tool_correctness | llm_rubric | ... */
    metrics?: string[];
    /** Пороги: costMaxUsd / latencyMaxMs. */
    thresholds?: { costMaxUsd?: number; latencyMaxMs?: number };
    /** Число повторов (из-за недетерминизма; default 1). */
    repeat?: number;
    /** Рубрика для LLM-as-judge. */
    rubric?: string;
}

export interface EvalCaseResult {
    caseId: string;
    passed: boolean;
    score: number;
    metrics: Record<string, number>;
    latencyMs: number;
    error?: string;
}

export interface EvalRunSummary {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
    avgLatency: number;
}

export interface EvalRunReport {
    results: EvalCaseResult[];
    summary: EvalRunSummary;
}

export interface EvalPromptResult {
    output: string;
    latencyMs?: number;
    costUsd?: number;
}

export interface IEvalHubDeps {
    /** Один прогон промпта (LLM). */
    runPrompt(prompt: string, opts?: { signal?: AbortSignal }): Promise<EvalPromptResult>;
    /** Скоринг по метрике (default — token_f1). */
    score?(output: string, expected: string | undefined, metric: string): { score: number; passed: boolean };
    /** LLM-as-judge для метрики llm_rubric. */
    judgeLLM?(output: string, rubric: string): Promise<{ score: number; passed: boolean }>;
}

export interface IEvalHub {
    run(cases: EvalCase[], opts?: { signal?: AbortSignal }): Promise<EvalRunReport>;
}
