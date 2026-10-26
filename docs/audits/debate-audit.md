# Аудит компонента Debates — реестр дефектов и рисков

> **Источник-основа:** архивная монография `debates-deep-research-monograph.md` (гл. 12).
> **Ветка:** `ai-os-new-fix-debate-text-truncation` (текущая рабочая).
> **Метод проверки:** чтение кода/grep + запуск целевых тестов (vitest), 2026-10.
> **Статусы в колонке «Проверено»:** `[V]` — подтверждено на текущей ветке; `[SA]` — подтверждено чтением кода (статический анализ, не исполнялось); `[H]` — гипотеза; `[NV]` — не проверено.

---

## 0. Как проверялось

- Сверены ключевые утверждения монографии с кодом ветки: enum-стратегии, BUILTIN_STRATEGIES, режимы, топологии, ветки промпт-сборки, регистрация DI и call-graph, путь исполнения, LLM-вызовы, ошибки, персистентность, тесты.
- Запущены целевые kernel-тесты дебатов (7 файлов, 61 тест — прошли): `debate-conclusion-engine`, `debate-budget`, `debate-evaluator`, `debate-llm-errors`, `debate-persistence-manager`, `debate-orchestrator-bidding`, `debate-preflight`. `debate-orchestrator.test.ts` не стартовал из-за таймаута worker'а vitest (инфраструктурная проблема, не провал теста).

### Ключевые подтверждённые числа ветки

| Сущность | Монография | Ветка | Статус |
|---|---|---|---|
| `DebateSessionStrategy` enum | 13 | 13 | [V] |
| `BUILTIN_STRATEGIES` | 24 | **33** | [V] расхождение |
| `BUILTIN_MODES` | 8 | 8 | [V] |
| `TopologyType` | 5 | 5 | [V] |
| `QUALITY_TECHNIQUES` | ~60 | **77** | [V] расхождение |

---

## 1. Реестр дефектов (D1–D30)

| ID | Дефект | Проверено | Доказательство на ветке |
|---|---|---|---|
| D1 | `startDebate` игнорирует `strategy` для топологии — всегда roundtable | [V]→**исправлено** | `debate-sync-manager.ts` → `resolveStrategyConfig` (strategy→топология) |
| D2 | BUILTIN_STRATEGIES (33) не имеют runtime-интерпретатора DSL | [V]→**lёгкий интерпретатор** | `debate-session-bridge.ts` → `resolveStrategyConfig` (root→топология+quality) |
| D3 | 8 режимов: policies не применяются движком | [V]→**исправлено** | `applyModeToSession` (mode→температура/лимиты/quality) в `startDebate` |
| D4 | `builtin.peer_review` — битый strategyRef в режиме `scientific_review` | [V] | `debate-mode-system.ts` ссылается на id, которого нет среди 33 |
| D5 | Stub-сервисы зарегистрированы, но не вызываются runtime'ом | [V] | MultiHop/AbstractionLadder/RoleReversal/Counterfactual/SemanticBlending/JudgeDeliberation/Concession/Hegelian + BestOfNSelector (не регистрируется) |
| D6 | `concession` ≡ `concession-engine` — дублирующий гейт | [V] | оба ведут в `buildConcessionPrompt` (prompt-builder:440-445) |
| D7 | `triangulation` ≡ `evidence-triangulation` — дублирующий гейт | [V] | оба ведут в `buildTriangulationPrompt` (prompt-builder:408-411) |
| D8 | `best-of-n` — inline-эвристика вместо `BestOfNSelector` | [V] | `debate-engine.ts:563-604`; класс не зарегистрирован |
| D9 | `DEBATE_HISTORY_WINDOW=6` — фиксированное окно | [V] | `debate-llm-caller.ts:29` |
| D10 | `preferredExtensions` ограничен 12 аргументами | [V] | `argtech-service.ts` — `throw` при >12 |
| D11 | 5 enum-стратегий (`cross-examination`, `tournament`, `moderated`, `free_for_all`, `jury_trial`) без обработчиков | [V]→**исправлено** | `buildTopologyForStrategy`+`strategyQualityForced` (топология+quality) |
| D12 | Две параллельные системы стратегий (33 DSL против 13 enum) | [V] | `debate-strategy-definitions.ts` vs `debate-types.ts:61-74` |
| D13 | `JustificationEnforcer` зарегистрирован, но не вызывается в промпт-контексте | [V] | подключён в engine:543, в prompt-context не используется |
| D14 | `crossDebateMemory` зарегистрирован, но не интегрирован в main flow | [V]→**исправлено** | проброшен в `LlmCallerDeps` → инъекция в промпт-контекст |
| D15 | Нет streaming-персистентности (saveSnapshot пишет всю сессию) | [SA] | `debate-persistence-manager.ts` — полная запись на снимок |
| D16 | Интеграция WikiBrain отсутствует | [NV] | глубокий аудит WikiBrain не выполнялся |
| D17 | Live research завязан на Gemini | [NV] | провайдерная связка не проверена |
| D18 | `transformers.js` отсутствует в package.json | [V] | grep по `package.json` — нет |
| D19 | `concession` — тривиальный алгоритм (длина<120 и без цифр) | [SA] | `concession-service.ts` |
| D20 | `counterfactual` — stub (срез строк) | [V] | `counterfactual-service.ts` |
| D21 | `hegelian-synthesis` — stub (шаблон) | [V] | `hegelian-service.ts` |
| D22 | `judge-deliberation` — stub (среднее арифметическое) | [V] | `judge-deliberation-service.ts` |
| D23 | `semantic-blending` service vs `concept-blender` — дублирование | [V] | runtime использует `conceptBlender`; service мёртв |
| D24 | `abstraction-ladder` service vs `level-tracker` — дублирование | [V] | runtime использует `LevelTracker` |
| D25 | `role-reversal` service vs inline — дублирование | [V] | inline в prompt-context:835-842 |
| D26 | `strategist-service` vs `debate-strategist` — дублирование | [V] | runtime использует `debate-strategist` (prompt-context ~1109) |
| D27 | `multi-hop` — три реализации | [V] | MultiHopService (stub) + JustificationEnforcer (не вызывается) + `buildMultiHopPrompt` |
| D28 | Хардкод провайдеров при сбросе circuit-breaker | [V] | `debate-sync-manager.ts:303` (`['groq','gemini','openrouter','nvidia']`) |
| D29 | `verdict.reasoning` — неструктурированная строка | [SA] | `debate-types.ts` (`reasoning: string`) |
| D30 | Нет LLM-based evaluation | [SA] | все метрики эвристические (regex/числовой) |

---

## 2. Архитектурные риски (R1–R10)

| ID | Риск | Проверено | На ветке |
|---|---|---|---|
| R1 | `debate-llm-prompt-context.ts` — один большой файл | [V] | ≈1286 строк |
| R2 | `debate-llm-caller.ts` — большой retry-loop | [V] | ≈695 строк |
| R3 | `debate-strategy-definitions.ts` — статические данные | [V] | ≈1156 строк |
| R4 | `debate-sync-manager.ts` — нарушение SRP (UI-фасад + sync + verdict) | [V] | ≈918 строк |
| R5 | ~50 enhancement-сервисов/стабов | [SA] | часть — 7-15 строк заглушек |
| R6 | Три типа `DebateSessionState` | [NV] | не проверено |
| R7 | Inline-реализации в промпт-контексте не тестируются отдельно | [V] | тесты только на `repetition-gate` |
| R8 | README заявляет `transformers.js`, в package.json его нет | [V] | несоответствие |
| R9 | `crossDebateMemory` отсоединён | [V] | зарегистрирован, в flow не используется |
| R10 | DSL-runtime отсутствует для стратегий | [V] | подтверждено |

---

## 3. Что подтверждено по тестам

- **Реальное поведение, тестами:** orchestrator (вкл. bidding), миграция ConversationCore, prod-регрессия `buildPipeline`, evaluator, conclusion-engine, budget, llm-errors, prune-персистентность, sync-manager (owner-guard), session-reload (Dexie).
- **Стаб-/placeholder-тесты** (проверяют только возврат заглушки): `best-of-n`, `debate-strategy-fingerprint` (полностью placeholder), `multi-hop`, `hegelian`, `semantic-blending`, `role-reversal`, `abstraction-ladder`, `judge-deliberation`, `counterfactual`.
- **Пробелы:** нет тестов на `buildArgumentPrompt`, restart-cooldown, duration-timer, DSL-стратегии, mode-policies.

---

## 4. Что осталось непроверенным

- Реальное поведение LLM-моделей на длинных промпт (≈60-77 техник-блоков).
- WikiBrain / Forum / Junction-интеграции (глубокий аудит не проводился).
- `R6` — унификация типов `DebateSessionState`.
- `D16`, `D17` — WikiBrain-интеграция и провайдерная связка live research.
- Полный `npm test` (запускались только целевые kernel-тесты).

---

## 5. Рекомендация по приоритетам

Быстрые фиксы без изменения контрактов (P0): A1/D1, A4/D4, A6/D6-D7, A10/D28, D3/D13. Затем P1: A2/D2 (удалить или реализовать DSL), A5/D5 (удалить/реализовать стабы), A7/D8, A8/D9, B3 (prompt-size budget), F1. См. `docs/roadmap/debate-improvements-roadmap.md`.
