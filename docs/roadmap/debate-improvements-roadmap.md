# Roadmap улучшений Debates

> **Источник-основа:** архивная монография `debates-deep-research-monograph.md` (гл. 15, 17).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Статусы:** `[V]` — дефект подтверждён на ветке (см. `docs/audits/debate-audit.md`); `[SA]` — подтверждён чтением кода.
> **Статус реализации:** P0 (D1, D4, D6-D7, D28, D13), а также D8 и D9 уже реализованы на ветке (2026-10). Остальное — план к выполнению.

---

## Принцип

Начать с быстрых фиксов, не нарушающих контракты (P0), затем умеренные улучшения (P1), и только потом изменения контрактов (P2-P3).

## Sprint 1 (P0) — быстрые фиксы

| Задача | Дефект | Сложность | Статус |
|---|---|---|---|
| `startDebate` → map strategy→topology (judge/tree-of-thought/red-blue/linear) | D1 | низкая | [V] |
| Починить битый `strategyRef` в режиме `scientific_review` | D4 | низкая | [V] |
| Слить дубликаты `concession`/`concession-engine`, `triangulation`/`evidence-triangulation` | D6-D7 | низкая | [V] |
| Динамический список debate-провайдеров вместо хардкода | D28 | низкая | [V] |
| Вызвать `JustificationEnforcer` в промпт-контексте (вместо stub `MultiHopService`) | D13 | низкая | [V] |

## Sprint 2 (P1) — умеренные улучшения + наблюдаемость

| Задача | Дефект | Сложность | Статус |
|---|---|---|---|
| Удалить 33 BUILTIN_STRATEGIES (или реализовать DSL-runtime) | D2 | средняя | [V] |
| Удалить/реализовать stub-сервисы | D5 | средняя | [V] |
| Заменить inline best-of-N на `BestOfNSelector` | D8 | низкая | [V] |
| Динамическое history window (`min(maxRounds*participants, 12)`) | D9 | низкая | [V] |
| Prompt-size budget (лимит на systemContent) | — | средняя | [SA] |
| Prompt-size inspector в UI (DebateRuntimePanel) | — | низкая | — |
| Quality-техника effectiveness dashboard | — | средняя | — |

## Sprint 3 (P2) — изменения контрактов/сервисов

- Policy-engine для 8 режимов (D3).
- Streaming-персистентность: `agent:responded` → запись в timeline (D15).
- Интеграция `crossDebateMemory` (D14).
- Position-change tracking (C2), FactCheckStatus в DebateArgument (C3), VerdictType (C4).
- LLM-based counterfactual / hegelian-synthesis (D20/D21).
- WikiBrain как RAG-source (E1), mid-debate memory sync (E3).

## Sprint 4 (P3) — значимые изменения

- Structured propositions в DebateArgument (C1).
- Verdict provenance (C6).
- Embedding-based contradiction detection (D5).
- Параллельный первый раунд (E4).
- LLM-based fact-check с авто-rety (B4).

## Sprint 5 (P4 + G) — эксперименты и интеграции

- Программа экспериментов — `docs/roadmap/debate-experiments.md`.
- Junction Engine integration (E5).

---

## Ссылки

- Реестр дефектов/рисков: `docs/audits/debate-audit.md`.
- Богатый технический овервью: `src/components/WikiPanel/wiki-components.ts` → статьи `comp-debate-runtime`, `comp-debate-techniques`, `comp-flow-debate`.
- Архивная монография: `debates-deep-research-monograph.md`.
