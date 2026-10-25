# Аудит «LLM-мост» и «Invocation/Мета-агент» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[NV]` — не проверено.

---

## 1. LLM-мост (`llm-task-executor.ts`, 266 ст.)

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| L1 | Нет центральной DI-фабрики `llmBridge` — дублирование сборки в 5 фазах | [V] | `phase23/24/25/26/31` |
| L2 | Echo-маскировка ошибок: `CrewExecutor` при сбое LLM возвращает `[role] completed: ...` — молчаливый успех | [V] | `llm-task-executor.ts:115` |
| L3 | Наивный JSON-парсинг (`indexOf('{')`/`lastIndexOf('}')`) без валидации | [V] | `llm-task-executor.ts:159-160,234-235` |
| L4 | `LlmGraphPort` игнорирует scope (`{}`) — кэш не скоуплен (отклонение от B-20) | [SA] | `llm-task-executor.ts:179` |
| L5 | Жёсткие обрезки: system 6000 / user 12000 / transcript 800 / lastOutput 2000 | [V] | `llm-task-executor.ts:52-53` |
| L6 | Нет тестов на `CrewExecutor`/`CouncilPort`/`GraphPort`/`FrontierExecutor` | [NV] | только `llm-persona-port.test.ts` |

## 2. Invocation/Мета-агент

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| I1 | Нет юнит-тестов на ядро (engine/repository/meta/strategy/cog/cost) | [NV] | отсутствие `*.test.ts` |
| I2 | `ProjectInvocationBridge` — заглушка: фикс. строка, `filesChanged=[]`, `success:true` всегда | [V] | `project-invocation-bridge.ts:66,73-78` |
| I3 | История `invocations` в RAM (Map) — не персистентна | [V] | `project-invocation-bridge.ts:36` |
| I4 | `MetaAgentService` — детерминированные эвристики (confidence `0.4+n*0.1`), без LLM | [V] | `meta-agent-service.ts:62` |

---

## 3. Рекомендуемые приоритеты

- **P0:** статья2 — убрать echo-fallback (или явно флагать ошибку).
- **P1:** L3 — валидировать JSON-парсинг; L4 — скоуплить `GraphPort`; I1 — добавить юнит-тесты.
- **P2:** L1 — единая DI-фабрика `llmBridge`; L5 — умные обрезки; I2 — реальный мост в проекты.

Подробный план — `docs/roadmap/llm-bridge-invocation-improvements-roadmap.md`.
