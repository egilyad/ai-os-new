<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты наблюдения за памятью

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, утилиты, память, наблюдаемость

Источники: `src/kernel/utils/memory-tracker.ts`, `src/kernel/utils/memory-watchdog.ts`, `src/kernel/utils/compute-memory-id.ts`

## Назначение

Следить за ростом памяти и предотвращать утечки/переполнение на клиенте.

## Возможности

- `memory-tracker.ts`: `logMemoryStats`, `estimateSessionBytes`, оценки размеров (`EngineSizes`, `SyncManagerSizes`, `AggregateSizes`).
- `memory-watchdog.ts`: `MemoryWatchdog` (`WatchdogOptions`) — реакция на превышение порогов.
- `compute-memory-id.ts` — детерминированный идентификатор памяти.

## Реализация

- `src/kernel/utils/memory-tracker.ts`, `memory-watchdog.ts`, `compute-memory-id.ts`.

## Связи

- Наблюдаемость — [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md); память — [Компонент: память и знания](./comp-memory.md).
- Панель служебных метрик — [Панели: Инфраструктура и платформа](./panel-infra-meta.md).

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.

---

## Связанные материалы

- [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md)
- [Компонент: память и знания](./comp-memory.md)
- [Компонент: флот, governance и аудит](./comp-fleet-governance.md)
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
