# Роадмап: Движок дебатов (debate-runtime, техники, стратегии, rivals)

> Область кода: `src/kernel/services/debate-runtime/` (~262 файла), `debateplus/`,
> `rivals*/` (~190 файлов), contractы `debate-*` (~110), панели `TechniquePanels/` (58) и др.

## Что есть сегодня

Движок дебатов — ядро и «визитная карточка» продукта. Заявлено:

- **33 встроенные стратегии** (`BUILTIN_STRATEGIES`) + **13 enum-стратегий**;
- **75–77 техник качества** (steelman, cross-examination, bayesian judge, belief-mining,
  entanglement, adversarial-source, minimax, prediction-market, …);
- 8 режимов, топологии, judge-подсистема, consensus, факт-чекинг, auto-debate.

Реальные «как есть» факты (из аудитов `comp-debate-runtime.md`):

- **`startDebate` всегда строит roundtable** — параметр `strategy` НЕ влияет;
  judge/tree-of-thought/red-blue доступны только через `startTopologyDebate`.
- LLM-вызовы идут через `adapterRegistry`, а не через LLM-registry (роутер).
- `classifyLlmError` — 10 кодов; персистентность трёхуровневая (Zustand + Dexie + localStorage).
- Большинство стратегий — **декларативные определения без runtime-интерпретатора DSL**;
  реально исполняются ~3 enum (socratic/argument_tree/constrained) и 5 топологий.

Два отдельных движка:

- `debateplus/argtech-service.ts` — формальная аргументация (Dung AF, Toulmin, Kialo, Brier).
- `rivals*` — «parity»-реализации внешних фреймворков (см. `ROADMAP_11`).

### Ключевые классы

- `debate-engine.ts` — главный движок.
- `debate-orchestrator.ts/factory` — оркестратор.
- `debate-pipeline.ts`, `debate-llm-caller.ts`, `best-of-n.ts`.
- Инфраструктура: `DebateSession`, `DebateTopologyService`, `DebateBudget`,
  `DebateConsensusEngine`, `DebateEvaluator`, `DebateSyncManager`, `DebateGovernor`.

---

## Пробелы и риски

1. **Стратегии декларативны, но не исполняемы** — главный разрыв между маркетингом и функцией.
2. **Единый источник правды отсутствует**: память/состояние дебата дублируется
   (Zustand/Bexie/localStorage), есть два RAG-пути, два аудит-лога.
3. **Нет единого «интерпретатора» для 33 стратегий** — нет DSL и runtime.
4. **Метрики качества** (ELO, judge) существуют, но не увязаны в единый «лидерборд» и не применяются для адаптации стратегий.
5. **Техники** — 58 панелей, но многие «панельные» (UI) без глубокой интеграции с движком; 19 из 62 без индивидуальных статей.
6. **Side-by-side / сравнение провайдеров** в дебатах ограничено жёстким списком.

---

## Роадмап

### P0 — Честность и заделка

- [ ] **Зафиксировать в коде/UI**, какие стратегии реально исполняются, а какие — декларативные (чтобы не обещать невозможное).
- [ ] **Устранить дублирование состояния**: единый `IDebateSessionStore` поверх Dexie как единственный источник правды; Zustand-проекции — read-only кэши.
- [ ] Убрать второй (legacy) RAG-путь в дебатах.

### P1 — Интерпретатор стратегий (самая ценная работа)

- [ ] Ввести **DSL стратегий** (`strategy-dsl.ts` уже есть как контракт) + runtime-интерпретатор:
  - формат: название, фазы, правила turn-очереди, окна, судьи, условия завершения;
  - исполнение: интерпретатор читает DSL и управляет движком через уже существующие примитивы (round/arg/gate/consensus/eval).
- [ ] Перевести все 33 BUILTIN-определения в исполняемый DSL (поэтапно, по 4–5 стратегий за итерацию).
- [ ] Добавить «эмуляцию» для стратегий, где это возможно, через топологии (judge/tree/red-blue уже работают как топологии).

### P1 — Метрики и адаптация

- [ ] Свести ELO-рейтинг (`elo-service.ts`) + judge-оценки + метрики качества в единый **лидерборд техник/стратегий**.
- [ ] **Автоадаптация**: на основе накопленных ELO/метрик автоматически выбирать лучшую стратегию под тип вопроса (ранжирование стратегий).
- [ ] Добавить **аблации техник**: возможность «выключить» конкретную технику и сравнить качество результата.

### P2 — Продуктовые возможности

- [ ] **Tournament / лиги** (есть зачатки `TournamentPanel`) — полноценные турниры стратегий с расписанием.
- [ ] **Replay/Time Machine дебатов** — полноценный пересмотр и «что если» (есть `DebateReplayPanel`, `TimeMachinePanel`).
- [ ] **Human-in-the-loop** — довести до конца: approvals, вмешательство судьи-человека в реальном времени.
- [ ] **Экспорт дебатов** (диаграмма аргументов, PDF/HTML) на базе `ArgumentGraphPanel`.

### P3 — Консистентность и расширяемость

- [ ] Сделать техники **плагинными** (реестр техник в `catalog/`, регистрация извне).
- [ ] Замкнуть `debateplus` (ArgTech: Dung/Toulmin/Kialo/Brier) с основным движком — сейчас два параллельных мира.
- [ ] Увести дебаты от жёсткого списка провайдеров (см. `ROADMAP_01`).

### P4 — Исследования

- [ ] Сравнить «дебаты» против «single-shot» и «self-consistency» на eval-бенчмарках (какая ценность дебатов в точности).
- [ ] Измерить влияние каждой из 75 техник (аблации + ELO) — собрать матрицу «техника × тип вопроса».
- [ ] Проверить гипотезу «разнообразие агентов повышает качество» через `agent-diversity`.

---

## Критерии «готово»

- Хотя бы 10 из 33 стратегий исполняются через DSL (не только топологии).
- Единый источник правды состояния дебата; нет параллельных RAG/аудит-логов.
- Лидерборд техник + автоадаптация стратегии.
- Data-driven список провайдеров в дебатах.

---

## Уточнения по коду (после глубокого изучения, 2026-10)

Движок исполняет **только `DebateTopology`** (`debate-topology.ts` → `buildRounds`):
`linear`, `roundtable`, `judge`, `tree-of-thought`, `red-blue`. «Стратегия» — это 3 слоя
поверх топологии: (1) топология, (2) форсированные quality-техники (`isQ`-гейты в промптах
и сервисах), (3) промпт-блоки по `session.strategy`.

Ключевые точки:

- `startDebate` (`debate-sync-manager.ts:260`) → `resolveStrategyConfig` (`debate-session-bridge.ts:276`): builtin-корень → `ROOT_TO_EXECUTION` (sequence→linear, debate_graph→roundtable, critic_loop→roundtable, voting→roundtable, peer_review→judge); почти все enum-стратегии → roundtable.
- `StrategyRegistry` (`debate-strategy-registry.ts`) — статичный реестр валидированных `StrategyDefinition` (DSL в `debate-strategy-definitions.ts`, 1157 стр).
- DSL-контракты уже есть: `contracts/debate-strategy-dsl.ts` (`StrategyPrimitiveType = sequence|debate_graph|critic_loop|voting|peer_review` + примитивы). **Интерпретатора нет**.
- Реальный прод-оркестратор — `ConversationBackedDebateOrchestrator` (не legacy `DebateOrchestrator`).
- Раунд: `roundLoop` (`debate-pipeline-builder.ts:142`) → факт-чек (`debate-post-processor`), RAG-индексация, `gatherClaims` → `consensus.evaluate`, `earlyExitConfidence`, `policyEngine.evaluate`; затем `consensusAndFinalize` (LLM-вердикт).
- Quality-техники: реестр `contracts/debate-quality-settings.ts` (`QUALITY_TECHNIQUES`, ~100); гейты `isQ('<tech-id>')` в `debate-llm-prompt-context.ts`; сервисные вызовы из `callLLM` (deps).
- Персистентность: Dexie (`DexieDebateStore`, таблица `debateSessions`) + localStorage (sync-backup, quality, стратегии) + Zustand (UI-проекции). Ядро не импортирует `src/stores/` (фолбэк `debate-store-fallback.ts`).
- **→ Полная спецификация интерпретатора: `SPEC_07_DEBATE_DSL_INTERPRETER.md`.**
