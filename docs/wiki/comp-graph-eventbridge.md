<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: графы режимов и мост событий

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, графы, event-bridge, проекции

Источники: `src/kernel/services/graph/graph-service.ts`, `src/kernel/services/graph/graph-modes.ts`, `src/kernel/services/event-bridge/event-bridge.ts`, `src/kernel/services/event-bridge/projection-registry.ts`

## Назначение

Исполнять графовые режимы (узлы/связи) и переносить события в проекции (read-модели).

## Возможности

- Сервис графов (`GraphService`) и конструктор режимов (`buildModeDefinition`).
- Мост событий (`EventBridge`) и реестр проекций (`ProjectionRegistry`) — подписка и раскладка событий в проекции.

## Реализация

- `graph/graph-service.ts`, `graph/graph-modes.ts`.
- `event-bridge/event-bridge.ts`, `event-bridge/projection-registry.ts`.
- `EventBridge` подписывается на `subscribeAll`, пропускает cognitive-события, оборачивает payload в `KernelEvent {type, payload, timestamp, seq:0}`; `ProjectionRegistry.dispatch` не роняет ошибки (warn). Зарегистрирована одна проекция — `RouterProjection` (`system:decision`).

## Связи

- Шина — [Компонент: шина событий (EventBus)](./comp-event-bus.md); оркестрация топологий — [Компонент: когнитивные трассы и оркестрация топологий](./comp-cognitive-orchestration.md); проекции — [Компонент: хранилище, таймлайн и проекции](./comp-storage-timeline.md).
- Панель: [Панель: Потоки (workflows)](./panel-workflows.md); граф знаний — [Граф знаний](./dev-graph.md).

## Проверка работоспособности

- Ручная: запустить графовый режим в Workflows, проверить обновление проекции.
- В `graph/` и `event-bridge/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Компонент: шина событий (EventBus)](./comp-event-bus.md)
- [Компонент: когнитивные трассы и оркестрация топологий](./comp-cognitive-orchestration.md)
- [Панель: Потоки (workflows)](./panel-workflows.md)
- [Граф знаний](./dev-graph.md)
- [Компонент: хранилище, таймлайн и проекции](./comp-storage-timeline.md)

[← Все материалы](./README.md)
