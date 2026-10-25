<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: хранилище, таймлайн и проекции

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, хранилище, таймлайн, проекции

Источники: `src/kernel/services/storage/dexie-storage.ts`, `src/kernel/services/storage/local-storage-adapter.ts`, `src/kernel/services/timeline/execution-viz-service.ts`, `src/kernel/services/timeline/timeline-map.ts`, `src/kernel/services/projections/router-projection.ts`

## Назначение

Низкоуровневое хранение (Dexie/IndexedDB и localStorage), визуализация хронологии исполнения и «проекции» решений роутера.

## Возможности

- Слой хранилища `StorageLayer` (`createDexieStorage`), адаптер `LocalStorageAdapter`, событие привязки шины (`setDexieStorageEventBus`).
- Визуализация исполнения (`ExecutionVizService`) и карта таймлайна `TIMELINE_MAP` (60 записей).
- Проекция решений роутера (`RouterProjection`, `ProjectedDecision`) и сравнение решений (`compareRouterDecisions` → `RouterDiffReport`).

## Реализация

- `storage/`: `dexie-storage.ts`, `local-storage-adapter.ts`.
- `timeline/`: `execution-viz-service.ts`, `timeline-map.ts`.
- `projections/`: `router-projection.ts`, `router-shadow-diff.ts`.
- `routing-policy/routing-policy-service.ts` (`RoutingPolicyService`) соседствует по смыслу с проекциями.
- **Фактически зарегистрирована только одна проекция** — `RouterProjection` (только `system:decision`), через `phase0-event-bridge.ts`. Остальные read-модели (Dexie-таблицы) пишутся сервисами напрямую, а не через проекции.

## Связи

- Базовый слой данных — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); каталог сторов — [Каталог сторов](./dev-store-catalog.md).
- Роутинг — [Компонент: роутинг и провайдеры](./comp-routing.md); наблюдаемость — [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md).

## Проверка работоспособности

- Тесты: `storage/dexie-storage.session.test.ts`, `timeline/execution-viz-service.test.ts`.
- Ручная: History/Audit показывает таймлайн, Router — проекцию решения.

## Состояние

- Реализовано; хранилище и таймлайн покрыты тестами, проекции — чтением кода.

---

## Связанные материалы

- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Каталог сторов](./dev-store-catalog.md)
- [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md)
- [След исполнения: журнал, раны, зомби](./execution-trail.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)

[← Все материалы](./README.md)
