<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: задачи, планирование и расписание

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, задачи, планирование, расписание

Источники: `src/kernel/services/agems-task-service.ts`, `src/kernel/services/task-handoff.ts`, `src/kernel/services/task-trigger-service.ts`, `src/kernel/services/task-work-product-service.ts`, `src/kernel/services/scheduler-service.ts`

## Назначение

Ставить задачи агентам, передавать их «из рук в руки», запускать по триггерам/расписанию и собирать результат работы.

## Возможности

- Жизненный цикл задачи, передача между агентами (`TaskHandoffService`), триггеры, приёмка результата (work product).
- Расписание задач по cron-выражениям (`SchedulerService`).

## Реализация

- `AgemsTaskService` (`agems-task-service.ts`) — реестр/оркестрация задач.
- `TaskHandoffService` (`task-handoff.ts`, `HandoffRequest`), `task-trigger-service.ts`, `task-work-product-service.ts`.
- `SchedulerService` (`scheduler-service.ts`: `Schedule`, `TaskParams`, `CronParts`).
- Демо-сиды: `tasks-demo-seed.ts`, `scheduler-demo-seed.ts`.

## Связи

- Исполнители — [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md); вызовы через [Компонент: роутинг и провайдеры](./comp-routing.md).
- Панели: [Панель: Задачи агентов](./panel-agent-tasks.md), [Панель: Планировщик](./panel-scheduler.md), [Панель: Задачи и пайплайны](./panel-tasks.md), [Панели: Планирование и миссии](./panel-planning.md).

## Проверка работоспособности

- Тесты: `scheduler-service.test.ts`, `task-handoff.test.ts`, `tasks-demo-seed.test.ts`, `scheduler-demo-seed.test.ts`.
- Ручная: создать задачу, расписание и убедиться в срабатывании.

## Состояние

- Реализовано; расписание и передача задач покрыты тестами.

---

## Связанные материалы

- [Панель: Задачи агентов](./panel-agent-tasks.md)
- [Панель: Планировщик](./panel-scheduler.md)
- [Панель: Задачи и пайплайны](./panel-tasks.md)
- [Панели: Планирование и миссии](./panel-planning.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)

[← Все материалы](./README.md)
