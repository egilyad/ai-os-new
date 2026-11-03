# Спецификация: Eval-хаб (платформа оценки)

> Статус: готово к реализации. Приоритет: P1. Обоснование: `NEW_COMPONENTS №3`, `ROADMAP_06`, `RESEARCH_TOPICS`.
> Источники исследования: Promptfoo, DeepEval, OpenAI Evals, LangSmith, AgentBench, τ-bench.

---

## 1. Цель

- Централизованная оценка системы (не только модели): датасеты, прогоны, траектории, метрики, сравнение, CI-гейты.
- Позволяет доказывать ценность дебатов/агентов цифрами и отлавливать регрессии.

## 2. Три уровня оценки (по DeepEval)

1. **End-to-end (black-box)** — итоговый результат сценария.
2. **Trajectory-based** — упорядоченная трасса (план, tool-calls, handoffs).
3. **Component-level** — метрики на компонентах (tool-use, отдельный агент).

## 3. Контракты (в `src/kernel/contracts/eval.ts`)

### 3.1 Датасет

```ts
interface EvalCase {
  id: string;
  scenario: string; // 'debate' | 'chat' | 'agent' | ...
  name: string;
  prompt: string;
  agents?: string[]; // для мультиагентных сценариев
  vars?: Record<string, unknown>;
  expected: {
    finalState?: string;
    must?: string[]; // обязательные условия/события
    mustNot?: string[];
    expectedTools?: string[];
  };
  metrics?: string[]; // ['task_completion','step_efficiency','tool_correctness','llm_rubric',...]
  thresholds?: { costMaxUsd?: number; latencyMaxMs?: number };
  repeat?: number; // дефолт 1 (рекоменд. 3)
}
```

### 3.2 DEV

```ts
interface EvalRun {
  id: string;
  datasetId: string;
  startedAt: number;
  finishedAt?: number;
  status: 'pending' | 'running' | 'done' | 'failed';
  results: EvalCaseResult[];
}
interface EvalCaseResult {
  caseId: string;
  passed: boolean;
  metrics: Record<string, number>;
  trajectory: TraceStep[];
  error?: string;
  costUsd: number;
  latencyMs: number;
}
interface IEvalService {
  run(datasetId: string, opts?: { repeat?: number }): Promise<EvalRun>;
  listDatasets(): EvalDatasetMeta[];
  getReport(runId: string): Promise<EvalReport>;
  compare(runIds: string[]): Promise<EvalComparison>;
  subscribeEvents(cb): void;
}
```

## 4. Метрики (минимум, ≤5 базовых)

- `task_completion` (0/1 binary либо 0..1).
- `step_efficiency` (1 - redundant/total steps; из траектории).
- `tool_correctness` (доля корректных tool-calls).
- `argument_correctness` (для дебатов: согласованность аргументов с фактами).
- `llm_rubric` (LLM-as-judge по критерию в датасете; порог).
- Экономика: cost/latency как пороги (регрессионные ограничения).

## 5. Трассировка — фундамент

- Eval-хаб читает из `TimelineService`/`execution-trail` (уже есть) и `MetricsService` (SPEC_03).
- `TraceStep { step, agent?, tool?, input?, output?, costUsd?, latencyMs?, ts }` — собирать для каждого прогона.

## 6. Реализация

- `src/kernel/services/eval/eval-service.ts` + `eval-dataset-store.ts` (Dexie: `evalDatasets`, `evalRuns`).
- Прогон: через существующий роутер/`DebateEngine`/`IAgentRuntime` (SPEC_05). Для дебатов — `DebateEngine` + `DebateEvaluator`/`EloService`.
- Панели: `EvalPanel` (датасеты, запуск, отчёты), `EvalComparePanel` (сравнение), интеграция с `ABTestPanel`/`EvalDatasetPanel`/`EvalReportPanel` (уже частично есть).
- Экспорт: датасеты в JSONL (совместимо с Promptfoo/DeepEval), отчёты — JSON/MD.

## 7. CI-интеграция

- Новый скрипт `npm run eval` (головяет `eval/` набор).
- GitHub Action `evals.yml`: прогон на PR (пути `evals/**`, `src/agents/**`, `src/kernel/services/debate-runtime/**`), кэш LLM-вызовов, `--threshold` на регрессии (метрики не ниже baseline). Ночной полный прогон.

## 8. Тесты

- Датасет: валидация схем, versioning.
- Прогон: мок LLM (mock-adapter), траектория, метрики, thresholds.
- compare/report.

## 9. Definition of Done

- EvalService в DI; датасеты+прогоны+отчёты работают; метрики считаются; CI-гейт на регрессии; экспорт в JSONL.
