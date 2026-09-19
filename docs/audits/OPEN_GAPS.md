# OPEN GAPS — открытые гэпы из исторических аудитов

> Собрано 2026-09-18 из `docs/history/` (N-серия, T/D-постаудиты, D1, REAUDIT_POST_N4).
> Статус **UNVERIFIED** — сверка с кодом текущей ветки НЕ проводилась.
> Перед работой по пункту: проверить в коде, открыт ли он ещё.
> Закрытое помечать здесь же (`CLOSED <дата> <коммит>`), а не удалять строку.

## D1 — debate/council гэпы (источник: `DEBATE_SYSTEM_AUDIT_D1.md`)

| ID | Суть | Приоритет | Статус |
|---|---|---|---|
| GAP-01 | ArgTech dead code (0 callers) | P0 | UNVERIFIED (план D2.2 в history/) |
| GAP-02 | CouncilPanel missing (route без файла) | P0 | UNVERIFIED (план D2.1 в history/) |
| GAP-03 | Council без resume/failed/paused | P0 | UNVERIFIED |
| GAP-04 | Evidence provenance разорван | P1 | UNVERIFIED (план D2.3 в history/) |
| GAP-05 | Brier/Kialo не питают judging | P1 | UNVERIFIED |
| GAP-06 | Council LLM advisory игнорируется | P1 | UNVERIFIED |
| GAP-07 | Дублирующиеся сторы (4) | P2 | UNVERIFIED |
| GAP-08 | N+1 listSessions | P2 | UNVERIFIED |
| GAP-09 | Timeline truncated + alias leak | P2 | UNVERIFIED |
| GAP-10 | Toulmin copy-paste дубликат | P3 | UNVERIFIED |
| GAP-11 | Lens vs archetype дубликат | P3 | UNVERIFIED |

## R — runtime гэпы (источник: `DEBATE_RUNTIME_REAUDIT_POST_N4.md`)

Приоритет из ре-аудита: R-GAP-03 → затем R-GAP-02.

| ID | Суть | Статус |
|---|---|---|
| R-GAP-01 | CouncilAware singleton race | UNVERIFIED (аудит не рекомендует сейчас — архитектура) |
| R-GAP-02 | `finalizeSession` double call + degraded payload | UNVERIFIED — **следующий по leverage** |
| R-GAP-03 | Bridge `processFactCheck` dead (shared Set) | CLOSED-static 2026-09-08 (`R-GAP-03_POST_AUDIT.md`, регресс-тест `debate-post-processor.rgap03.test.ts`, runtime НЕ гонялся) |
| R-GAP-04 | `awaitPending` dead code | UNVERIFIED |
| R-GAP-05 | `MAX_TOKENS` divergence (5 мест) | UNVERIFIED |
| R-GAP-06 | `DebateSession` без `maxRounds`/`strategy` | UNVERIFIED (аудит: дизайн, не сейчас) |
| R-GAP-07 | Lossy `TOPOLOGY_TO_STRATEGY` | UNVERIFIED (аудит: дизайн, не сейчас) |
| R-GAP-08 | `earlyExitConfidence` vs `convergenceThreshold` дубль | UNVERIFIED |
| R-GAP-09 | Тройной `0.85` fallback | UNVERIFIED |
| R-GAP-10 | `participants` never populated | UNVERIFIED |
| R-GAP-11 | `restoreSession` без 4 deps | UNVERIFIED |
| R-GAP-12 | UI/Runtime/Strategy triple divergence (3 пути создания) | UNVERIFIED (аудит: продукт, не сейчас) |
| R-GAP-13 | `TopicStep` temperature dead | UNVERIFIED |
| R-GAP-14 | Методы вне контракта | UNVERIFIED |
| R-GAP-15 | Нет `failedProviders` getter | UNVERIFIED |
| R-GAP-16 | Early-exit без guards | UNVERIFIED |
| R-GAP-17 | `blindEval` throw без fallback | UNVERIFIED |
| R-GAP-18 | Triple GC divergence | UNVERIFIED |

## T — остатки T-серии

| ID | Суть | Источник | Статус |
|---|---|---|---|
| T-A | Persona-сиды пусты (`debate-archetypes`, `historical-figures`, `PersonaPickerPanel`) | `T3.1_POST_AUDIT.md` | UNVERIFIED |
| T-B | Нет single-runner «Test» для агента топологии | `T3.2_POST_AUDIT.md` | UNVERIFIED |
| T-C | Debate provider order только readout, нужна конфигурируемость | `T1.2_POST_AUDIT.md` | UNVERIFIED |

## Закрытые цепочки (история, не трогать)

- N1→N4d POST-аудиты: все `PASS static` (цепочка ArgTech→Consensus→Evaluator→early-exit).
- T1.2→T3.2: `STOP`/done-батчи (rotation, привязка агента, чаты, RU-роли, карточка агента).
- D4.5/D4.6 PREFLIGHT: планы миграции council→DebateStore (спроектированы, bulk на слабом ПК не запускался).
- D3_UNIFICATION_PLAN: план унификации council/debate (миграция, без кода).
