<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: конфигурация и настройки

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, конфигурация, настройки, feature-flags

Источники: `src/kernel/services/config-registry.ts`, `src/kernel/services/config-mutations.ts`, `src/kernel/services/config-service.ts`, `src/kernel/services/config-history.ts`, `src/kernel/services/settings-service.ts`

## Назначение

Дать системе единый, защищённый от случайной мутации источник конфигурации (`CONFIG`) и отделить его от пользовательских переопределений и профилей настроек.

## Возможности

- `CONFIG` — read-only Proxy: любая прямая запись/удаление бросает `CONFIG is read-only — use setConfig() or replaceConfig()`.
- `CONFIG_DEFAULTS` — ленивая глубокая замороженная копия (секреты делаются non-enumerable/non-writable).
- Feature-flags через `setFeatureFlag(path, enabled)`.
- Версионирование конфигурации с diff и rollback; профили пользовательских настроек.
- Переопределения (overlays) из Dexie поверх `CONFIG`.

## Реализация

- `config-registry.ts`: `rawConfig`, `CONFIG`, `CONFIG_DEFAULTS`, `deepFreeze`, `DEFAULT_DEBATE_LANGUAGE='Russian'`.
- Разрешённые верхнеуровневые секции: `version, buildId, router, monitoring, metrics, traces, webhooks, keys, llm, pressure, pricing, services, storage, security, featureFlags`. Неизвестный ключ в `setConfig`/`replaceConfig` — **игнорируется с warn**, а не бросает.
- **Валидации значений в рантайме нет** — только allowlist ключей + типы TypeScript. `ConfigService.deepMerge` ограничен глубиной 10 (дальше — поверхностная копия), массивы заменяются.
- `config-mutations.ts`: `setConfig`, `replaceConfig`, `setFeatureFlag`; оба emit `settings:updated`.
- `ConfigService` (`config-service.ts`): `init` грузит overlays (KV `config_overlays`), геттеры/апдейтеры по секциям, каждый апдейт persist + emit `settings:updated`.
- `ConfigHistoryService` (`config-history.ts`): `MAX_HISTORY = 50`, `commit`, `diff(idA,idB)` → `{added,deleted,updated}`, `rollback` пишет живую `CONFIG`.
- `SettingsService` (`settings-service.ts`): 6 секций (General/Writing/Reading/Alerts/Prompts/Advanced), профили (SLA mode, strategy, exploration factor), импорт/экспорт; при смене стратегии дёргает `routerService`.

## Связи

- Хранилище — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md) (Dexie/KV).
- `settings:updated` потребляют панели ([Панель: Настройки](./panel-settings.md)) и сервисы.
- Транзакционность апдейтов — см. [Компонент: транзакции состояния](./comp-transactions.md) (`withTransaction`).

## Проверка работоспособности

- `config-registry.test.ts` — ключи `rawConfig`/`CONFIG` совпадают, read-only (assign/delete бросают), дефолты, `deepFreeze`, секция router.
- `config-service.test.ts` — init/идемпотентность/событие, все дефолты и апдейтеры, persist/emit, `clearOverlays`, `deepMerge`.
- `config-history.test.ts` — seed+commit, rollback живой `CONFIG`, diff added/deleted/updated.
- **Тестов нет:** `SettingsService` и `config-mutations.ts`.

## Состояние

- Основное подтверждено кодом и тестами.
- Секреты (`adminToken`, `webhookSecret`) хранятся в localStorage в открытом виде — это осознанное ограничение single-user приложения (см. [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)).

---

## Связанные материалы

- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Компонент: запуск ядра (bootstrap, container, runtime)](./comp-kernel-boot.md)
- [Компонент: транзакции состояния](./comp-transactions.md)
- [Панель: Настройки](./panel-settings.md)

[← Все материалы](./README.md)
