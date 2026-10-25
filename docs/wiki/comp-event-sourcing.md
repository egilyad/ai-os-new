<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: журналирование событий (event sourcing)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, event-sourcing, журнал, восстановление, WAL

Источники: `src/kernel/services/event-sourcing/event-recorder.ts`, `src/kernel/services/event-sourcing/checkpoint-store.ts`, `src/kernel/services/event-sourcing/event-types.ts`, `src/kernel/dal/event-log-repository.ts`, `src/kernel/services/timeline-service.ts`

## Назначение

Сохранять поток событий и периодические контрольные точки, чтобы состояние можно было восстановить и проанализировать задним числом.

## Возможности

- Запись событий в **append-only журнал** с кольцевым буфером (`EventRecorder`), персистентностью в Dexie (`eventLog`) и WAL-replay-хвостом в localStorage.
- Контрольные точки (`CheckpointStore`, max 50) со снапшотой состояния и собственным WAL.
- Частичный реплей по временному окну (`TemporalReplayService`), `getSince/getRange/getByTimeRange`.
- Аудит-журнал (`AuditService`, append-only hash-chained) и снапшоты ядра (`SnapshotService`).

## Реализация

- `EventRecorder` (`event-recorder.ts`, ~584 ст.): подписка на `subscribeAll`, фильтр шумных/когнитивных событий, кольцевой буфер (max 1000), запись `{ sequence, event, data, timestamp, checksum(SHA-256/32), prevSequence }`, WAL (хвост 300, дебаунс 1000 мс, санитизация секретов).
- `CheckpointStore` (`checkpoint-store.ts`, ~240 ст.): чекпойнты `{ id, label, sequence, timestamp, stateSnapshot, tags }`, `getBySequence/getLatest/restoreCheckpoint`.
- `EventLogRepository` (`dal/event-log-repository.ts`): персистентность в Dexie `eventLog` (индексы `++id, sequence, event, timestamp`), `bulkAdd` только для новых sequence, кап maxEvents.
- Отдельного `EventStoreService` нет: роль «event store» выполняет пара recorder+checkpoint поверх [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).

## Связи

- Пишет то, что эмитит шина ([Компонент: шина событий (EventBus)](./comp-event-bus.md)); хранит через [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).
- Используется тайм-тревелом ([Компонент: тайм-тревел, снапшоты и каузальность](./comp-time-travel.md)) и следом исполнения ([След исполнения: журнал, раны, зомби](./execution-trail.md), [Панели: История, аудит, версии, деплой](./panel-history-audit.md)).

## Проверка работоспособности

- Тесты: `dal/event-log-repository.test.ts` (идемпотентность, кап), частично через `integration.test.ts` (EventBus→EventRecorder).
- **Пробел:** нет тестов на ядро `event-sourcing/` (`event-recorder`, `checkpoint-store`), `timeline-service`, `audit-service.verify`.

## Состояние

- Реализовано (append-only ES поверх шины); подтверждено чтением кода.
- **Риски (подробно — `docs/audits/events-storage-audit.md`):** буфер и `eventLog` ограничены 1000 — старые события безвозвратно теряются, `getSince` для ранних sequence возвращает `[]`; реплей не перестраивает read-модели из лога; таймлайн не персистентен.

---

## Связанные материалы

- [Компонент: шина событий (EventBus)](./comp-event-bus.md)
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Компонент: транзакции состояния](./comp-transactions.md)
- [След исполнения: журнал, раны, зомби](./execution-trail.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)
- [Компонент: хранилище, таймлайн и проекции](./comp-storage-timeline.md)

[← Все материалы](./README.md)
