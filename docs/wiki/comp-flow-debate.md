<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: дебаты

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, дебаты, поток, события

Источники: `src/components/DebateArena.tsx`, `src/components/DebatePanel/DebatePanel.tsx`, `src/components/DebatePanel/useDebatePanelSubscriptions.ts`, `src/kernel/services/debate-runtime/debate-sync-manager.ts`, `src/kernel/services/debate-runtime/debate-engine.ts`, `src/kernel/services/debate-runtime/debate-orchestrator-factory.ts`, `src/kernel/services/debate-runtime/conversation-backed-debate-orchestrator.ts`, `src/kernel/services/debate-runtime/debate-agent-executor.ts`, `src/kernel/services/debate-runtime/debate-llm-caller.ts`, `src/kernel/services/debate-runtime/debate-session-persistence.ts`, `src/kernel/services/debate-runtime/debate-persistence-manager.ts`, `src/kernel/services/storage/dexie-storage.ts`, `src/kernel/service-registration/phase3-debate-runtime.ts`, `src/kernel/events/event-registry.ts`, `src/stores/activeDebateStore.ts`, `src/stores/debateLiveStore.ts`

## Назначение

Показать дебаты не как набор сервисов, а как **сквозной контур**: путь запроса от панели до сохранённого вердикта и обратно в интерфейс — вместе с точками обрыва.

## Возможности

- Панель → сервис → движок → оркестратор → агент → вызов модели → события → хранилище → UI.
- Два режима запуска (classic в `DebatePanel`, runtime в `DebateRuntimePanel`) и топологии: linear, roundtable, judge, tree-of-thought, red-blue.
- Управление жизненным циклом: старт, пауза, возобновление, отмена, тайм-аут, троттлинг рестарта, owner-guard.

## Сквозной поток (по шагам)

1. **UI.** [Дебаты: режимы и механика](./debates.md) → `DebateArena.tsx` → `DebatePanel.tsx`. Старт: `debateService.startDebate(topic, participants, strategy, maxRounds, config, chatSessionId, owner)`.
2. **Синхронизация.** `DebateSyncManager.startDebate` (debate-sync-manager.ts): троттлинг (`RESTART_COOLDOWN_MS`), owner-guard, `checkDebatePreflight`, сброс circuit-breaker провайдеров, duration-timer (`maxDurationMs`).
3. **Создание сессии.** `_initEngineSession`: построение топологии, `engine.createSession(...)` (DebateEngine), подписка `_setupListeners`, `_syncSessionImpl`, запись в `activeDebateStore.setSession` и состояние governor.
4. **Событие старта.** `_emitDebateStarted`: `system:notification` + `debate:started`; при `chatSessionId` — `sessionManager.link(chat→debate)` и `updateMeta({linkedDebateId})`.
5. **Запуск движка.** `_startEngineWithFinalize` → `engine.startSession(runtimeId)`.
6. **Оркестратор.** DebateEngine через `createDebateOrchestrator` выбирает `ConversationBackedDebateOrchestrator` (решение — `DebatePolicy`) или классический `DebateOrchestrator`; перевод в события — `debate-pipeline-builder`.
7. **Раунды.** `debate:runtime:round:started/ended`, ранний выход `...:round:early:exit`; порядок ходов — `TurnProposal`.
8. **Исполнение хода.** `DebateAgentExecutionEngine.execute` → `AgentExecutor` → `debate-agent-executor.ts` (резерв бюджета `reserveAndRecord`, `...:budget:pressure`/`...:budget:updated`).
9. **Вызов модели.** `debateCallLlm` (debate-llm-caller.ts): ключ (keyService) → адаптер (providerAdapterRegistry) → `adapter.sendMessage` со стримом чанков (`...:agent:chunk`); учёт governor. Маршрут и отказоустойчивость — [Компонент: рантайм провайдеров](./comp-provider-runtime.md), [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).
10. **Результаты.** `...:agent:thinking/responded/scored`, `debate:argument`, оценка (debate-evaluator / CouncilAwareEvaluator), `debate:consensus`/`...:consensus:reached`.
11. **Финализация.** `_finalizeInternal` → вердикт (debate-finalizer / debate-conclusion-engine) → `debate:verdict:generated`; `engine.saveSnapshot`.
12. **Хранилище.** `DebatePersistenceManager.saveSnapshot` → `DexieDebateStore` (dexie-storage.ts) → `StorageLayer.debates` (запись `DebateSessionRecord`), мета — merge-on-save (`saveSnapshotPreservingMeta`). Подробнее — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md), [Компонент: Data Access Layer (репозитории)](./comp-dal-repositories.md).
13. **Возврат в UI.** `useDebatePanelSubscriptions` слушает `debate:updated`, `debate:verdict:generated`, `...:session:cancelled/failed` и `debateLiveStore`; рендер — DebateChat, VerdictPanel, Analytics. Стор чата — [Компонент: чат (ChatExecutor)](./comp-chat.md).

## Обрывы цепочки (что происходит при ошибке)

- **Модель недоступна/таймаут.** В `debateCallLlm` работает цикл resolve → call → classify → retry/failover: события `...:agent:fallback`, `...:agent:timeout`, `...:agent:error`; если все провайдеры уже «мертвы» — fast-fail (ретраи пропускаются).
- **Бюджет исчерпан.** Ход завершается `budgetSkipped` с ошибкой `Budget exceeded`; давление — `...:budget:pressure`, `...:budget:updated`. Сессия при этом не рушится целиком.
- **Governor.** Истечение бюджета операции классифицируется как ретраибельный таймаут, а не как «тихий» обрыв (см. комментарии в debate-llm-caller).
- **Отмена.** `debate:runtime:session:cancelled`; отмена проверяется на каждой итерации ретрая.
- **Падение пайплайна.** `_startEngineWithFinalize.catch` переводит «залипшую» сессию в `failed` (`debate:runtime:session:failed`). Недоставленные события — dead-letter очередь ([Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md)).

## Данные, события, восстановление

- **Снапшот сессии:** phase, round, tokens/cost, agentStates, arguments, memory → `StorageLayer.debates`.
- **Таймлайн:** `engine.getTimeline(sessionId)` (debate-timeline.ts) — основа реплея ([Панели: История дебатов и повтор](./panel-debate-history.md)).
- **Восстановление после перезагрузки:** `restoreSession` / loadActiveSession поднимает снапшот active/paused.
- **События:** namespace `debate:runtime:*` (event-registry.ts) и легаси `debate:*` (`started`, `updated`, `argument`, `consensus`, `ended`, `fact:checked`, `verdict:generated`, `session:conflict`, `human:vote`). Шина — [Компонент: шина событий (EventBus)](./comp-event-bus.md).

## Реализация

- UI: `src/components/DebateArena.tsx`, `src/components/DebatePanel/DebatePanel.tsx`, `useDebatePanelSubscriptions.ts`.
- Синхронизация и жизненный цикл: `debate-sync-manager.ts`.
- Движок и оркестрация: `debate-engine.ts`, `debate-orchestrator.ts`, `conversation-backed-debate-orchestrator.ts`, `debate-orchestrator-factory.ts`, `debate-pipeline-builder.ts`.
- LLM-звено: `debate-agent-executor.ts`, `debate-llm-caller.ts`, `debate-llm-backoff.ts`.
- Персист: `debate-session-persistence.ts`, `debate-persistence-manager.ts`, `DexieDebateStore` в `src/kernel/services/storage/dexie-storage.ts`.
- DI: `src/kernel/service-registration/phase3-debate-runtime.ts` (`debateEngine`, `debateService`, `debateApiService`, `debateHumanService`, `collaborativeService`).
- Сторы: `src/stores/activeDebateStore.ts`, `src/stores/debateLiveStore.ts`.

## Связи

- Движок и сервисы дебатов — [Компонент: рантайм дебатов](./comp-debate-runtime.md); провайдеры — [Компонент: рантайм провайдеров](./comp-provider-runtime.md), [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).
- События — [Компонент: шина событий (EventBus)](./comp-event-bus.md); состояние — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md); персист — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md), [Компонент: Data Access Layer (репозитории)](./comp-dal-repositories.md).

## Проверка работоспособности

- Тесты: `src/components/DebateArena.test.tsx`, `src/components/DebatePanel/DebatePanel.test.tsx`, `useDebatePanelSubscriptions.test.tsx`, `src/kernel/services/debate-runtime/debate-orchestrator.test.ts`, `debate-policy.test.ts`, `debate-persistence-manager.test.ts`, `debate-conclusion-engine.test.ts`, `debate-evaluator.test.ts`, `debate-consensus.test.ts`, `debate-conversation-core-migration.test.ts`.

## Состояние

- Подтверждено чтением кода по всей цепочке; ключевые звенья (UI-подписки, оркестратор, политика, персист, вердикт) покрыты тестами.

---

## Связанные материалы

- [Компонент: рантайм дебатов](./comp-debate-runtime.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: шина событий (EventBus)](./comp-event-bus.md)
- [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md)

[← Все материалы](./README.md)
