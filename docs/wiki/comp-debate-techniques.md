<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Дебаты: стратегии, режимы и техники качества

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, дебаты, стратегии, техники, качество, аудит

Источники: `src/kernel/contracts/debate-types.ts`, `src/kernel/services/debate-runtime/debate-strategy-definitions.ts`, `src/kernel/services/debate-runtime/debate-mode-system.ts`, `src/kernel/contracts/debate-quality-settings.ts`, `src/kernel/services/debate-runtime/debate-prompt-builder.ts`, `src/kernel/services/debate-runtime/debate-llm-prompt-context.ts`

## Назначение

Справочник по артефактам «джентльменского набора» дебатов — стратегиям, режимам, топологиям и техникам качества — с реальным статусом исполнения на текущей ветке (проверено по коду, 2026-10).

## Реализация

Реестр и механизм активации:

| Сущность | Кол-во | Реальный статус |
|---|---|---|
| `DebateSessionStrategy` (enum) | 13 | **все маппятся в исполнение** через `resolveStrategyConfig` (топология + quality); socratic/argument_tree/constrained — свои ветки промпта |
| `BUILTIN_STRATEGIES` (DSL) | 33 | **лёгкий интерпретатор** `resolveStrategyConfig`: root→топология+quality (D2) |
| `ArgumentStrategy` | 10 | текст-инструкция per-agent |
| `DebateConstraint` | 7 | активны только при `strategy==='constrained'` |
| TopologyType | 5 | все работают через `startTopologyDebate` |
| `BUILTIN_MODES` | 8 | policies **применяются** через `applyModeToSession` (температура/лимиты/quality) |
| `QUALITY_TECHNIQUES` | 77 | большинство инжектит инструкцию; часть имеет backing-service |

Каждая quality-техника включается через гейт `isQ(id)` (`debate-prompt-builder.ts:162-164`): `qualitySettings?.[id] !== false`. Пользовательские настройки приходят из UI в `qualitySettings` при `startDebate`.

## Связи

- Движок и архитектура — [Компонент: рантайм дебатов](./comp-debate-runtime.md); сквозной контур — [Сквозной контур: дебаты](./comp-flow-debate.md); обзор — [Дебаты: режимы и механика](./debates.md).
- Полный реестр дефектов и рисков — `docs/audits/debate-audit.md`.

## Состояние

Подтверждено чтением кода. Ключевые статусы:

- **Работают с backing-service (входят в deps и вызываются):** entanglementEngine, anchoringService, argumentGraphService, vulnerabilityTargeting, adversarialSource, beliefMiningService, minimaxPlanner, metaAgent, steelmanService, boPTracker, consistencyService, credibilityScorer, similarityMonitor, driftDetector, insightBus, logicalFormExtractor, biasProfiler, interruptQueue, stakeholderMapper, calibrationService, personaMixer, frameTracker, expertWitness, factCheckService, stanceDriftTracker, rhetoricalDeviceSelector, scratchpadService, blindEval, incentiveDetector, gotDeliberation, conceptBlender, outcomeForecaster, liveResearch, qualityCollector, argTech.
- **Inline-реализации в `debate-llm-prompt-context.ts`:** level-tracker (для `abstraction-ladder`), role-reversal, audience, fog-of-war, humor, status-dynamics, style-matching, whisper-channels, alliance, prediction-market, strategist (`debate-strategist`).
- **Единственная техника с дополнительным LLM-вызовом:** `shadow-opponent` (через `debate-llm-enrichment.ts`).
- **Stub-сервисы зарегистрированы, но не вызываются:** `MultiHopService`, `AbstractionLadderService`, `RoleReversalService`, `CounterfactualService`, `SemanticBlendingService`, `JudgeDeliberationService`, `ConcessionService`, `HegelianService`. `BestOfNSelector` — вообще не регистрируется (движок использует inline-эвристику в `debate-engine.ts`).
- **Дубликаты гейтов:** `concession`/`concession-engine` → `buildConcessionPrompt`; `triangulation`/`evidence-triangulation` → `buildTriangulationPrompt`.
- **Особые случаи:** `bayesianJudge` подключён в deps движка (активирует `jury_trial`-скоринг); `searchEngine` в коде отсутствует.
- **Стратегии:** `startDebate` маппит **все 13 enum-стратегий** в исполнение (`resolveStrategyConfig`: judge/jury_trial→judge-топология, tournament/sequential→linear, tree-of-thought→tree, red-blue→red-blue, остальные→roundtable) + принудительные quality-гейты (cross-examination/tournament/jury_trial/moderated/free_for_all). **33 DSL-стратегии** интерпретируются лёгким рантаймом (root→топология+quality). Policies восьми режимов применяются через `applyModeToSession`.
- **Проверка тестами:** см. `docs/audits/debate-audit.md` (раздел «Что подтверждено по тестам»).

---

## Связанные материалы

- [Компонент: рантайм дебатов](./comp-debate-runtime.md)
- [Сквозной контур: дебаты](./comp-flow-debate.md)
- [Дебаты: режимы и механика](./debates.md)

[← Все материалы](./README.md)
