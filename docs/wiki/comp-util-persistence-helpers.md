<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты персиста и провайдеров

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, утилиты, персист, провайдеры

Источники: `src/kernel/utils/persist-then-emit.ts`, `src/kernel/utils/with-transaction.ts`, `src/kernel/utils/provider-default-models.ts`, `src/kernel/utils/provider-fleet-health.ts`

## Назначение

Обеспечивать корректный порядок «сначала запись — потом событие» и справочные данные по провайдерам.

## Возможности

- `persist-then-emit.ts`: `Outbox` — отложенная эмиссия после персиста — **орфан** (в src не импортируется).
- `with-transaction.ts` — обёртка транзакции (используется в settings-service/key-service).
- `provider-default-models.ts`: `PROVIDER_DEFAULT_MODELS`, `PROVIDER_PREFERRED_MODELS`, `PROVIDER_DISPLAY_NAMES` (используется массово: state/topology-defaults, smart-routing, settings, key-models…).
- `provider-fleet-health.ts`: `summarizeProviderFleet`, `summarizeAllProviders` — **орфан** (в src не импортируется).

## Реализация

- `src/kernel/utils/persist-then-emit.ts`, `with-transaction.ts`, `provider-default-models.ts`, `provider-fleet-health.ts`.

## Связи

- Персист — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); транзакции — [Компонент: транзакции состояния](./comp-transactions.md); провайдеры — [Компонент: рантайм провайдеров](./comp-provider-runtime.md), [Провайдеры и маршрутизация](./providers.md).

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; активно используются `with-transaction` и `provider-default-models`; `persist-then-emit` и `provider-fleet-health` — **орфаны**; автотестами не покрыто.

---

## Связанные материалы

- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: флот, governance и аудит](./comp-fleet-governance.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
