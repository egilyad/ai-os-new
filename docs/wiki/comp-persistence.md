<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: персистентность (Dexie и storage-адаптеры)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, хранилище, Dexie, IndexedDB

Источники: `src/kernel/services/database-service.ts`, `src/kernel/services/dexie-schema.ts`, `src/kernel/services/storage/local-storage-adapter.ts`, `src/kernel/services/storage-adapter.ts`, `src/kernel/services/dexie-schema-versioning.test.ts`

## Назначение

Локальное хранилище системы: IndexedDB через Dexie (основные данные) и обёртки над localStorage/bucket-хранилищем (лёгкие настройки, безопасные к SSR).

## Возможности

- Типизированные аксессоры над таблицами: `apiKeys`, `sessions`, `messages`, `traces`, `events`, `costs`, `notes`, `metrics`, `probeResults` и др.
- Произвольное KV: `getKv<T>` / `setKv<T>` / `deleteKv`.
- Миграции схемы между версиями; глобальный singleton (защита от «split Dexie»).
- Провайдер-агностичный bucket-storage (для sidecar/тестов).

## Реализация

- `DatabaseService` (`database-service.ts`): синглтон `db`; guard через `globalThis.__aios_kernel_database_service__` (второй инстанс → лог `[DEXIE MISMATCH]`). Методы: `getKv/setKv/deleteKv`, типизированные get/save/delete, `assignTask/completeTask/getTasks`, pricing overrides, `getRawTable`, `integrityCheck`, `importBackupBlob`.
- `SuperAgentsDB extends Dexie` (`dexie-schema.ts`): версии схемы от `version(5)` до **`version(43)`**; **136 таблиц** (в т.ч. `debateSessions`, `crystals`, `councilSessions`, `graphs`, `projectTasks`, `provenanceEdges`, `memories`).
- `LocalStorageAdapter implements ILocalStorageAdapter` (`storage/local-storage-adapter.ts`): `getItem/setItem/removeItem/clear/key/length`, SSR-fallback на `Map`, префикс обфускации `xob:`.
- `BucketStorageAdapter` (`storage-adapter.ts`): buckets `agents/research/roles/providers/ui`, префикс `superagents:<bucket>:<key>`.

## Связи

- На базе хранилища работают [Компонент: конфигурация и настройки](./comp-config.md) (overlays/профили) и все durable-менеджеры (дебаты, память, ключи, история).
- Панели не обращаются к Dexie напрямую — только через сервисы ([Разработчикам: состояние (stores) и хуки](./dev-stores.md)).

## Проверка работоспособности

- `dexie-schema-versioning.test.ts` — версии по возрастанию, наличие проектных таблиц, отсутствие удалённых между версиями таблиц, покрытие миграций (в тесте имя «v35» устарело относительно кода v43).
- Ручная: панель Diagnostics / Health показывает БД; `integrityCheck()`.
- **Тестов нет:** сам `DatabaseService` (дубликаты инстансов, KV).

## Состояние

- Подтверждено кодом; схема версионируется.
- Ограничение: тест версий отстаёт по нумерации от фактической v43 — держать в уме при чтении.

---

## Связанные материалы

- [Компонент: конфигурация и настройки](./comp-config.md)
- [Компонент: запуск ядра (bootstrap, container, runtime)](./comp-kernel-boot.md)
- [Компонент: шина событий (EventBus)](./comp-event-bus.md)
- [Разработчикам: состояние (stores) и хуки](./dev-stores.md)
- [Каталог сторов](./dev-store-catalog.md)

[← Все материалы](./README.md)
