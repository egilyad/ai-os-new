<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: рантайм дебатов

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, дебаты, оркестрация, агенты

Источники: `src/kernel/services/debate-runtime/debate-engine.ts`, `src/kernel/services/debate-runtime/debate-sync-manager.ts`, `src/kernel/services/debate-runtime/debate-session.ts`, `src/kernel/services/debate-runtime/debate-orchestrator.ts`, `src/kernel/services/debate-runtime/debate-topology.ts`, `src/kernel/services/debate-runtime/debate-budget.ts`, `src/kernel/services/debate-runtime/debate-consensus.ts`, `src/kernel/services/debate-runtime/debate-evaluator.ts`

## Назначение

Многогерентные дебаты: несколько агентов-ролей обсуждают тему по заданной стратегии, а рантайм ведёт сессию, собирает аргументы, считает метрики, ищет консенсус и подводит итог.

## Возможности

- Управление сессией: создание, старт, пауза/возобновление, отмена, завершение.
- Выбор следующего участника по стратегии; раунды; человеческие инъекции.
- Бюджет дебатов (токены/стоимость/раунды/длительность) с уровнями давления.
- Метрики (графовые, активности, качества), интерпретация постанализа, оценка агентов, поиск консенсуса, факт-чекинг.
- Авто-дебаты (batch/stress-test) и «губернатор» качества.

## Реализация

- Каталог `src/kernel/services/debate-runtime/` — **очень крупный** (300+ файлов, десятки подсервисов).
- Ядро: `DebateEngine` (`debate-engine.ts`, `IDebateEngine, ILifecycle`), `DebateSyncManager` (+ `DebateAlreadyActiveError`), `DebateSession` (`IDebateSession`), `DebateOrchestrator` (`IDebateOrchestrator`), `DebateTopologyService` (`ITopologyService`).
- Компоненты: `DebateBudget`, `DebateConsensusEngine`, `DebateEvaluator`, `debate-interpreter.ts`, `debate-metrics.ts` (`computeGraphMetrics/computeActivityMetrics/computeQualityMetrics`), `fact-checking-service.ts`.
- Подкаталоги: `auto-debate/auto-debate-service.ts` (`AutoDebateService`), `debate-governor/debate-governor.ts` (`DebateGovernor`).
- Стратегии/режимы: `debate-strategy-registry.ts`, `debate-strategy-manager.ts`, `debate-mode-system.ts`, `debate-archetypes.ts`.
- События семейства `debate-runtime:*` и `debate:*` (создание/старт/раунд/аргумент/консенсус/память).
- Feature flag `DEBATE_RUNTIME_ENGINE` переключает путь старта (старый `DebateService` vs `DebateEngine`).

## Связи

- Участники — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md); LLM-вызовы идут через роутинг ([Компонент: роутинг и провайдеры](./comp-routing.md)).
- Панели: [Панель: Живые дебаты](./panel-debate-live.md), [Панель: Анализ дебатов](./panel-debate-analysis.md), [Инструменты анализа дебатов](./panel-debate-toolkit.md), а также [Дебаты: режимы и механика](./debates.md) (обзор).

## Проверка работоспособности

- Богатая поверхность тестов внутри `debate-runtime/`: `debate-orchestrator.test.ts`, `debate-budget.test.ts`, `debate-consensus.test.ts`, `debate-evaluator.test.ts`, `debate-memory.test.ts`, `debate-policy.test.ts`, `debate-session-reload.test.ts` и др.
- Ручная: запустить дебат в панели Debate Live и проверить раунды/метрики.

## Состояние

- Реализовано; основное подтверждено тестами в самом каталоге (проверка 2026-10: ключевые kernel-тесты проходят).
- **Проверено по коду на текущей ветке:**
  - Слои: UI → SyncManager → Engine → Pipeline → Orchestrator → LLM-caller → adapter.
  - `startDebate` **всегда** строит roundtable-топологию (`buildRoundtableTopology`, debate-sync-manager.ts:312); параметр `strategy` не влияет на оркестрацию — топологии judge/tree-of-thought/red-blue доступны только через `startTopologyDebate`.
  - LLM-вызовы идут через `adapterRegistry.getAdapter(provider).sendMessage|streamMessage`, а не через особый LLM-registry.
  - Таксономия ошибок `classifyLlmError` — 10 кодов.
  - Персистентность трёхуровневая: Zustand `activeDebateStore` + Dexie (`debateSessions`, `debateVerdicts`, `debateTimeline`, `debateOverrides`) + localStorage fallback.
  - Enum-стратегий — 13; BUILTIN_STRATEGIES — 33; режимов — 8; техник качества — 77. Статусы исполнения — [Дебаты: стратегии, режимы и техники качества](./comp-debate-techniques.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Дебаты: стратегии, режимы и техники качества](./comp-debate-techniques.md)
- [Панель: Живые дебаты](./panel-debate-live.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Инструменты анализа дебатов](./panel-debate-toolkit.md)

[← Все материалы](./README.md)
