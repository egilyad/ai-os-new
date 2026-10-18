<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: журналирование событий (event sourcing)

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, event-sourcing, журнал, восстановление

Источники: `src/kernel/services/event-sourcing/event-recorder.ts`, `src/kernel/services/event-sourcing/checkpoint-store.ts`, `src/kernel/services/event-sourcing/event-types.ts`

## Назначение

Сохранять поток событий и периодические контрольные точки, чтобы состояние можно было восстановить и проанализировать задним числом.

## Возможности

- Запись событий в append-only журнал с кольцевым буфером (`EventRecorder`).
- Контрольные точки (`CheckpointStore`) для быстрого восстановления.
- Типизация событий в `event-types.ts`.

## Реализация

- `EventRecorder` (`event-recorder.ts`, `RecorderConfig`, интерфейс хранилища `EventRecorderStore`) — подписка на шину и запись.
- `CheckpointStore` (`checkpoint-store.ts`, `Checkpoint`, `CheckpointStoreConfig`, `CheckpointPersistenceStore`).
- Отдельного `EventStoreService` нет: роль «event store» выполняет эта пара recorder+checkpoint поверх [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).

## Связи

- Пишет то, что эмитит шина ([Компонент: шина событий (EventBus)](./comp-event-bus.md)); хранит через [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).
- Используется тайм-тревелом ([Компонент: тайм-тревел, снапшоты и каузальность](./comp-time-travel.md)) и следом исполнения ([След исполнения: журнал, раны, зомби](./execution-trail.md), [Панели: История, аудит, версии, деплой](./panel-history-audit.md)).

## Проверка работоспособности

- **Тестов нет:** в каталоге `event-sourcing/` тестовые файлы не найдены.
- Ручная: открыть History/Audit, убедиться, что события и чекпоинты доступны.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Компонент: шина событий (EventBus)](./comp-event-bus.md)
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Компонент: транзакции состояния](./comp-transactions.md)
- [След исполнения: журнал, раны, зомби](./execution-trail.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)

[← Все материалы](./README.md)
