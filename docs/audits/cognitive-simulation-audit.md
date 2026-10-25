# Аудит подсистемы «Когнитивная оркестрация / Симуляция / Тайм-тревел» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[NV]` — не проверено.

---

## 0. Карта подтверждённых фактов

- **CognitiveService** (`cognitive-service.ts`, 626 ст.): трассировка узлов, `executeAgentNode` (buildPrompt → evaluateAlternatives → makeDecision → executeWithFallback), OOM-лимиты (MAX_TRACES=30, MAX_STEPS=20, buffer 8k, throttle 500 мс).
- **OrchestrationService** (`orchestration-service.ts`, 700 ст.): обход топологии, ветки батчами по 3, rate-limit, lifecycle.
- **CognitiveIntelligenceService** (207 ст.): метрики/давление/диагностика/what-if — **только по событиям дебатов**.
- **Симуляция:** `WorldStateService` + `SimulationEngineService` + `AgentActAdapterService` (Simulation Lab); дефолт — `StubActPort` (без LLM).
- **Тайм-тревел:** `CausalScopeManager` → `CausalTimelineService` → `TemporalReplayService`; `CounterfactualEngine/Explanation/Narrative`.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| C1 | `CognitiveService.makeDecision` всегда возвращает `alts[0]` — «решение» не выбирает между альтернативами | [V] | `cognitive-service.ts:543-545` |
| C2 | `CausalTimelineService.getTrace` возвращает пустой `timeline: []` — массив никогда не заполняется | [V] | `causal-timeline-service.ts:68-84` |
| C3 | Симуляция без реального LLM: `StubActPort` по умолчанию; `agentActAdapterService` — fallback на stub; UI подключает адаптер вручную | [V] | `simulation-engine-service.ts:21-37`, `agent-act-adapter-service.ts` |
| C4 | Когнитивные метрики только по дебатам текущего процесса; неизвестные sessionId игнорируются | [V] | `cognitive-intelligence-service.ts:184-191` |
| C5 | OOM-обрезки занижают токен-метрики (оценка только по последнему окну 8k) | [V] | `cognitive-service.ts:314,619` |
| C6 | `TemporalReplayService` использует `recorder.getAll()` без фильтрации объёма — O(n) на большое окно | [SA] | `temporal-replay-service.ts:261` |
| C7 | `cognitive:decision:made` эмитится, но внешнего потребителя не найдено | [NV] | `cognitive-service.ts:452` |
| C8 | Нет unit-тестов на ядро (CognitiveService, OrchestrationService, CI, causal/temporal/counterfactual) | [NV] | отсутствие `*.test.ts` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):**
  - C2 — заполнять `timeline` в `getTrace` через `getRelevantEvents` (нужен доступ к журналу событий).
  - C1 — либо реализовать селекцию альтернатив в `makeDecision`, либо явно задокументировать, что решение принимает routerService.
- **P1 (средние):**
  - C3 — автоматически подключать `agentActAdapterService` в `SimulationEngineService` (а не только через UI).
  - C6 — добавить фильтрацию/лимит при `getAll()`.
  - C8 — добавить unit-тесты на ключевые сервисы.
- **P2 (крупные):**
  - C4 — расширить когнитивные метрики на память/прочие источники.
  - C5 — честная оценка токенов по полному тексту, а не только по последнему окну.

Подробный план — `docs/roadmap/cognitive-simulation-improvements-roadmap.md`.
