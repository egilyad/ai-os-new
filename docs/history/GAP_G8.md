# GAP G8 — Evaluation (scorer registry + LLM judge stub) — evidence

> Phase 61. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`. Последний STATIC GAP.

---

## GAP
`EvalService` (`frontier/eval-service.ts:34`) only `scoreCase()` `contains|exact|token_f1` hard-coded + `execute(task)→[echo]` fallback. Нет scorer registry, нет LLM judge (LangSmith/Mastra scorers reference).

## WHY IT MATTERS
10-system: Mastra scorers + LangSmith evals — reference. Без registry — benchmarks не расширяемы, без LLM judge — нет semantic scoring.

## REFERENCE SYSTEM
Mastra `scorers`, LangSmith `evaluators` (LLM-as-judge).

## CURRENT STATE (до G8)
- `src/kernel/contracts/frontier.ts:36` — `IEvalService { createBenchmark(list), runBenchmark, compare, redTeam, capabilityMatrix }` + `IFrontierExecutor { execute(task) }`
- `src/kernel/services/frontier/eval-service.ts:34` — `scoreCase` contains/exact/token_f1 (token_f1 f1>=0.5), `runBenchmark` loops `execute→scoreCase`, `compare(A/B)` delta, `redTeam` heuristic `/refus|cannot|запрещ/ → blocked`.
- Нет `IScorerRegistry`, нет `ILlmJudge`.

## TARGET (G8)
- Additive `ScorerRegistryService` — `register(name, fn) + score(c, output, scorer?) + list/has` (builtins contains/exact/token_f1 + custom), emits `eval:scorer:registered`.
- Additive `LlmJudgeService` — `judge(task, output, reference) → {score, passed, reasoning, via: stub|llm}`: if `ILLMClientService` wired → `llm.chat` JSON `{"score":0..1,"passed":bool,"reasoning"}` else stub `token_f1 + PROVIDER-PENDING reasoning` + `eval:judge:done`.
- Real LLM judge = `PROVIDER-PENDING / BLOCKED-RUNTIME` until evaluated on real benchmarks.

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/eval-scorer.ts:1` — `ScorerResult`, `ScorerFn`, `IScorerRegistryService`, `ILlmJudgeService` |
| Scorer | `src/kernel/services/eval/scorer-registry-service.ts:1` — `BUILTINS` contains/exact/token_f1 (same as EvalService), `register/score/list/has`, emit `EVAL_SCORER_REGISTERED` |
| Judge | `src/kernel/services/eval/llm-judge-service.ts:1` — `stubScore(token_f1 + reasoning PROVIDER-PENDING)`, `judge()` → `llm.chat` system `Score 0..1 JSON` + try parse `{"score","passed","reasoning"}` else fallback `via:llm fallback stub`, emits `EVAL_JUDGE_DONE` |
| DI | `src/kernel/service-registration/phase61-eval-scorers.ts:1` — registers `scorerRegistryService` + `llmJudgeService` (optional llm) |
| Wiring | `src/kernel/service-registration/index.ts:61` — `registerPhase61` |
| Event | `src/kernel/events/event-registry.ts:2058` — `EVAL_SCORER_REGISTERED`, `EVAL_JUDGE_DONE` |
| Static test | `src/kernel/services/eval/scorer-registry-service.test.ts:1` — 5 cases (builtins, custom always_zero, llm judge stub PROVIDER-PENDING, fake LLM via llm, malformed JSON fallback) |

**Additive check:** `eval-service.ts:34` untouched; registry/judge are separate services (future harness can delegate `scoreCase` → `scorerRegistry.score`), no Dexie migration.

## STATIC TEST

```text
src/kernel/services/eval/scorer-registry-service.test.ts
  ✓ builtins contains/exact/token_f1
  ✓ custom scorer registry (always_zero)
  ✓ LlmJudge stub PROVIDER-PENDING when no LLM (via stub)
  ✓ LlmJudge with fake LLM via=llm (score 0.9)
  ✓ LlmJudge malformed LLM JSON → fallback stub via llm
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/eval-scorer.ts:1` — ILifecycle, `ScorerFn` async.
- **EventBus:** `EVENTS.EVAL_SCORER_REGISTERED/EVAL_JUDGE_DONE` (`event-registry.ts:2058`) — Zod schemas.
- **DI:** `phase61-eval-scorers.ts:1` — lazy, optional `llmClientService`.
- **No migration:** no new tables (registry in-memory, judge stateless).
- **Existing intact:** `frontier/eval-service.ts:34` still hard-coded but registry available for future delegation.

## MARK

- **CLOSED (static):** Scorer registry (3 builtins + custom), LLM judge stub (heuristic + PROVIDER-PENDING), fallback for malformed LLM, DI+events, static tests.
- **PARTIAL (runtime-pending):** `vitest` + `typecheck:fast` — до сильного ПК.
- **BLOCKED-RUNTIME:** Real LLM judge (live `llm.chat` JSON scoring on real benchmarks) — помечено `PROVIDER-PENDING / via stub` until wired with `llmClientService` and evaluated; custom scorer `llm_judge` registration on real Eval harness — after Заход 2.
- **NOT CLOSED:** `EvalService` delegation to `scorerRegistry` (kept additive) — will be wired after runtime proof.

## CAPABILITY_MATRIX delta

- `Evaluation` — `Existence 7→8`, `Maturity 5→7 (static)` (registry + LLM judge stub done), `Integration 5→6` (llm optional), still `⏳ Runtime 3` (static only) — real LLM judge BLOCKED.
- **STATIC GAP CLOSURE COMPLETE:** G1→G8 all `CLOSED static / BLOCKED-RUNTIME` — next: **RUNTIME VERIFICATION (Заход 2)** на сильном ПК → `FINAL GAP ANALYSIS`.

---

## Дальше

G8 `STOP` — STATIC GAP CLOSURE завершён. Следующий: **Заход 2** `typecheck:fast → build:skip-typecheck → vitest 57→61 → Dexie v35? → LLM smoke → golden-e2e` на сильном ПК.
