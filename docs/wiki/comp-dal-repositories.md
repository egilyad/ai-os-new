<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: Data Access Layer (репозитории)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, dal, репозитории, персист

Источники: `src/kernel/dal/data-access-layer.ts`, `src/kernel/dal/debate-repository.ts`, `src/kernel/dal/session-repository.ts`, `src/kernel/dal/memory-repository.ts`, `src/kernel/dal/event-log-repository.ts`, `src/kernel/dal/scenario-repository.ts`, `src/kernel/dal/workspace-repository.ts`

## Назначение

Дать типизированный доступ к данным через репозитории поверх слоя хранения.

## Возможности

- `data-access-layer.ts` — вход в DAL.
- Репозитории: `debate-repository.ts`, `session-repository.ts`, `memory-repository.ts`, `event-log-repository.ts`, `scenario-repository.ts`, `workspace-repository.ts`, `role-repository.ts`, `note-repository.ts`, `trace-repository.ts`, `cognitive-repository.ts`, `crystal-repository.ts`, `director-repository.ts`, `debate-timeline-repository.ts`, `debate-override-repository.ts`, `session-link-repository.ts`.
- Миграции: `key-migration.ts`, `scenario-migration.ts`.

## Реализация

- Каталог `src/kernel/dal/`.

## Связи

- Хранение — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); таймлайн — [Компонент: хранилище, таймлайн и проекции](./comp-storage-timeline.md); журнал событий — [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md).

## Проверка работоспособности

- Тесты репозиториев: `dal/data-access-layer.test.ts`, `debate-repository.test.ts`, `session-repository.test.ts`, `memory-repository.test.ts`, `event-log-repository.test.ts`, `scenario-repository.test.ts`, `workspace-repository.test.ts` и др.

## Состояние

- Реализовано; широко покрыто тестами.

---

## Связанные материалы

- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Компонент: хранилище, таймлайн и проекции](./comp-storage-timeline.md)
- [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md)
- [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
