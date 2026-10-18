<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: мультиагентное исполнение

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, мультиагент, invocation, crew, council

Источники: `src/components/RoomPanel/RoomPanel.tsx`, `src/components/CouncilPanel/CouncilPanel.tsx`, `src/kernel/services/invocation/invocation-engine-service.ts`, `src/kernel/services/invocation/invocation-repository.ts`, `src/kernel/service-registration/phase21-invocation.ts`, `src/kernel/services/crew/crew-service.ts`, `src/kernel/services/council/council-service.ts`, `src/kernel/services/frontier/frontier-ops-service.ts`, `src/kernel/services/multi-agent-project-service.ts`, `src/kernel/contracts/invocation.ts`

## Назначение

Показать мультиагентность как **сквозной контур**: от запроса «позвать агентов» до реального исполнения (дебаты или режиссируемый разговор) — с единым жизненным циклом и точками обрыва.

## Возможности

- Единый **Invocation Engine** — управляемый жизненный цикл вызова агентов (intent-only), политики и резолвинг.
- Три способа резолва агентов: по `agentId`, по `role` (+specializations), по `expertise`.
- Хэндофф в реальное исполнение: дебаты или диалог под управлением ConversationDirector.
- Дополнительные подсистемы: **Crew** (CrewAI-стиль, задачи/процессы), **Council**, **Frontier**.

## Сквозной поток (по шагам)

1. **Триггер.** Room (human-mention), CouncilPanel, CrewsPanel, FrontierPanel ([Компонент: вызовы (invocation) и мета-агент](./comp-invocation-meta.md), [Компонент: экипажи и совет](./comp-crews-councils.md)).
2. **Запрос.** `InvocationEngineService.invoke(req)` (invocation-engine-service.ts): строит `Invocation`, пишет в `InvocationRepository`, публикует `invocation:requested`.
3. **Политика.** `evaluate(req)`: берёт включённые политики, фильтрует по `matches`, сортирует по `priority` → `allow` / `deny` / `no-match`.
4. **Резолвинг агентов.** `resolveAgents(target)` — по id / роли / expertise; пусто → отказ.
5. **Принятие.** `invocation:accepted` (policyRef + agents).
6. **Бюджетный шлюз.** `budgetService.getCostByAgent` против `getAgentBudget`: агент сверх бюджета → отказ **до** трат LLM ([Компонент: бюджет, цены и расход](./comp-budget-pricing.md)).
7. **Исполнение.** статус `executing`, событие `invocation:executing`; `InvocationExecutionDelegate` (phase21-invocation.ts) делает хэндофф:
   - режим `debate` → `DebateSyncManager.startDebate` с owner `invocation:<id>` и ожиданием `getRunCompletion` ([Сквозной контур: дебаты](./comp-flow-debate.md));
   - режим `chat`/`director` → `ScenarioRepository.create` → `ConversationDirector.loadScenario` → `run()` (ConversationCore; [Сквозной контур: чат](./comp-flow-chat.md)).
8. **Завершение.** `invocation:done` с `resultRef` (debate-сессия или conversation-сценарий).
9. **Crew.** `CrewService.startCrew` → задачи (`CrewRepository`: `crews`+`crewTasks`), процесс `sequential`/`hierarchical`; исполнитель по умолчанию — детерминированный `EchoExecutor`, подмена на LLM-мост — `setExecutor` (GAP E.1).
10. **Council / Frontier.** `CouncilService` (с `council-to-debate-mapper`) и `FrontierOpsService` как отдельные мультиагентные подсистемы.

## Обрывы цепочки (что происходит при ошибке)

- **Нет политики.** `no-match` → статус `rejected`, причина «no matching enabled policy».
- **Нет агентов.** `resolveAgents` пуст → `rejected` «no agents resolved for target».
- **Сверх бюджета.** `rejected` до любого вызова LLM.
- **Сбой исполнения.** Исключение в `execution.start` или реджект `completed` → `rejected`; агрегат **не остаётся** в `accepted` (B-18) — статус всегда консистентен.

## Данные, события, восстановление

- **События invocation:** `invocation:requested/accepted/rejected/executing/done`.
- **События crew:** `crew:created/started/completed/failed`, `task:*`.
- **Политики по умолчанию:** «Manual Room Chat (human-selected agent)» (match `human-mention`), «Scheduled Tasks» (match `schedule`); мост Scheduler → Invocation.
- **Персист:** `InvocationRepository` (жизненный цикл intent), `CrewRepository`; см. [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md), [Компонент: Data Access Layer (репозитории)](./comp-dal-repositories.md).

## Реализация

- Движок вызова: `src/kernel/services/invocation/invocation-engine-service.ts`, `invocation-repository.ts`.
- Хэндофф и политики: `src/kernel/service-registration/phase21-invocation.ts` (`InvocationExecutionDelegate`).
- Crew: `src/kernel/services/crew/crew-service.ts`; Council: `council/council-service.ts`; Frontier: `frontier/frontier-ops-service.ts`.
- Проекты: `src/kernel/services/multi-agent-project-service.ts`.
- Контракты: `src/kernel/contracts/invocation.ts`.

## Связи

- Мультиагентность — [Компонент: вызовы (invocation) и мета-агент](./comp-invocation-meta.md), [Компонент: экипажи и совет](./comp-crews-councils.md), [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md).
- Хэндофф: [Сквозной контур: дебаты](./comp-flow-debate.md) (дебаты), [Сквозной контур: чат](./comp-flow-chat.md) (диалог); бюджет — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md).

## Проверка работоспособности

- Тесты: `src/components/RoomPanel/room-invocation-e2e.integration.test.tsx`, `src/kernel/services/project-invocation-bridge.test.ts`, `src/stores/invocationStore.test.ts`, `src/kernel/services/multi-agent-project-service.test.ts`, `src/components/CouncilPanel/CouncilPanel.test.tsx`, `src/kernel/services/crew/crews-demo-seed.test.ts`, `src/kernel/services/frontier/frontier-demo-seed.test.ts`.

## Состояние

- Подтверждено чтением кода; жизненный цикл вызова, хэндофф и демо-подсистемы покрыты тестами; реальный LLM-исполнитель Crew — ожидаемое расширение (GAP E.1).

---

## Связанные материалы

- [Компонент: вызовы (invocation) и мета-агент](./comp-invocation-meta.md)
- [Компонент: экипажи и совет](./comp-crews-councils.md)
- [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md)
- [Сквозной контур: дебаты](./comp-flow-debate.md)
- [Сквозной контур: чат](./comp-flow-chat.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)

[← Все материалы](./README.md)
