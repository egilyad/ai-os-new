<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: восстановление сессии

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, восстановление, загрузка, bootstrap, гидрация

Источники: `src/main.tsx`, `src/kernel/runtime.ts`, `src/kernel/bootstrap.ts`, `src/kernel/bootstrap-key-init.ts`, `src/kernel/service-registration/index.ts`, `src/kernel/services/key-storage-hydrator.ts`, `src/kernel/services/debate-runtime/debate-persistence-manager.ts`, `src/stores/chat/hydration.ts`, `src/kernel/services/event-sourcing/checkpoint-store.ts`, `src/kernel/services/reconnection-service.ts`, `src/kernel/services/snapshot-service.ts`, `src/kernel/services/time-machine-service.ts`

## Назначение

Показать **восстановление сессии** как сквозной контур: от холодного старта приложения до гидрации сохранённого состояния и реконнекта потоков — с честными точками обрыва.

## Возможности

- Холодный старт с экраном загрузки, затем асинхронный бутстрап ядра (runtime.start).
- Пред-гидрация: миграция ключей, загрузка bootstrap-снимка, нормализация хранилища ключей.
- Гидрация UI-состояний: чат (сессии, выбранная сессия, черновики), история дебатов.
- Восстановление из event-sourcing: WAL-реплей и снимки (через [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)).
- Реконнект стримов с backoff.

## Сквозной поток (по шагам)

1. **Старт.** `src/main.tsx` рендерит boot-splash, регистрирует адаптеры сторов и вызывает `runtime.start()`; при провале — экран «System failed to initialize».
2. **Бутстрап ядра.** `SystemBootstrap.init()` (`src/kernel/bootstrap.ts`) → `registerMigratedServices` → `registerServices(...)` ([Компонент: запуск ядра (bootstrap, container, runtime)](./comp-kernel-boot.md), фазы 1..N).
3. **Пред-гидрация.** `runKeyMigration` → `loadBootstrapSnapshot` → `hydrateKeyStorage` (нормализация ключей в KeyStore).
4. **Инициализация сервисов.** `lifecycle.tryInit` для `configService`, `eventSourcingService`, `providerRuntimeService`, `rotationService`, затем оркестратор и второй проход для lazy-сервисов; `startAll()`.
5. **Гидрация состояния.**
   - **Чат:** `useChatStoreHydration` — `cleanupOrphanLoading` (сессии в `loading/streaming` → `failed`), `restoreBackup` (бэкап после неуспешного flush), восстановление последней выбранной сессии; см. [Сквозной контур: чат](./comp-flow-chat.md).
   - **Дебаты:** история читается из Dexie; повторное открытие через `DebatePersistenceManager.restoreSession` → `restoreInternalState` + `memory.restoreFrom`; см. [Сквозной контур: дебаты](./comp-flow-debate.md).
   - **Event-sourcing:** `CheckpointStore.recoverFromWal` и снимки/тайм-машина (`snapshot:restored`).
6. **Реконнект.** `ReconnectionService` с backoff (`baseDelayMs`/`maxDelayMs`, `onReconnect`) восстанавливает оборванные стримы.
7. **Готовность.** Эмитится `RUNTIME_READY`, фаза `ready`; монтируется `App`.

## Обрывы цепочки (что происходит при ошибке)

- **Прерванные дебаты НЕ возобновляются.** При старте сессии в активной фазе помечаются `failed` — «true resume (rehydrate + continue mid-phase)» отсутствует; их можно открыть из истории вручную.
- **Повреждённая запись.** `restoreSession` пишет warning и возвращает `null`.
- **Orphan-loading в чате.** Зависшие `loading/streaming` при гидрации переводятся в `failed`.
- **Реконнект не удался.** `onReconnect` вернул `false` → стрим считается оборванным.
- **Сбой инициализации сервиса.** Ошибка пишется в лог, эмитится `RUNTIME_FAILED` и уведомление; не критичные шаги (снимок, проверка дебатов) — best-effort.

## Данные, события, восстановление

- **События:** `RUNTIME_READY`, `RUNTIME_FAILED`, `snapshot:restored`, `graph:checkpoint`, `graph:restored`, `KERNEL_HEARTBEAT`.
- **Хранилища:** KeyStore (ключи), Dexie (сессии дебатов), бэкап-бакет и localStorage (выбранная чат-сессия), event-sourcing (WAL/снимки).
- **Связь контуров:** чат — [Сквозной контур: чат](./comp-flow-chat.md), дебаты — [Сквозной контур: дебаты](./comp-flow-debate.md), знания (эмбеддинги) — [Сквозной контур: знания и RAG](./comp-flow-knowledge.md).

## Реализация

- Точка входа и splash: `src/main.tsx`; рантайм — `src/kernel/runtime.ts`.
- Бутстрап и прерванные дебаты: `src/kernel/bootstrap.ts`.
- Пред-гидрация ключей: `src/kernel/bootstrap-key-init.ts`, `src/kernel/services/key-storage-hydrator.ts`.
- Гидрация чата: `src/stores/chat/hydration.ts`; дебатов — `src/kernel/services/debate-runtime/debate-persistence-manager.ts`.
- Восстановление/реконнект: `src/kernel/services/event-sourcing/checkpoint-store.ts`, `src/kernel/services/snapshot-service.ts`, `src/kernel/services/time-machine-service.ts`, `src/kernel/services/reconnection-service.ts`.

## Связи

- Персистентность — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); контуры чата/дебатов/знаний — [Сквозной контур: чат](./comp-flow-chat.md), [Сквозной контур: дебаты](./comp-flow-debate.md), [Сквозной контур: знания и RAG](./comp-flow-knowledge.md).

## Проверка работоспособности

- Тесты: `src/kernel/services/reconnection-service.test.ts`, `src/kernel/services/consistency-checker.test.ts`, тесты гидрации чата и persistence дебатов (см. профильные статьи).

## Состояние

- Подтверждено чтением кода; важное ограничение — прерванные дебаты не возобновляются автоматически, а помечаются `failed`.

---

## Связанные материалы

- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Сквозной контур: чат](./comp-flow-chat.md)
- [Сквозной контур: дебаты](./comp-flow-debate.md)
- [Сквозной контур: знания и RAG](./comp-flow-knowledge.md)

[← Все материалы](./README.md)
