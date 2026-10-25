<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: рантайм провайдеров

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, провайдеры, инстансы, адаптеры

Источники: `src/kernel/services/provider-runtime/provider-service.ts`, `src/kernel/services/provider-runtime/provider-instance.ts`, `src/kernel/services/provider-runtime/provider-budget.ts`, `src/kernel/services/provider-runtime/provider-session.ts`, `src/kernel/services/provider-runtime/provider-state.ts`, `src/kernel/services/provider-adapter-registry.ts`, `src/kernel/services/provider-router.ts`, `src/kernel/services/provider-tracker.ts`

## Назначение

Держать рантайм-состояние провайдеров: инстансы, сессии, бюджет и метрики, а также адаптеры, роутинг и миграции.

## Возможности

- Инстанс провайдера с состояниями `idle/active/degraded/backoff/dead` (`ProviderInstance`).
- Сессии (`ProviderSession`: `pending/active/completed/errored/cancelled`, токен-учёт) и снимки рантайма.
- Бюджет провайдера (`ProviderBudget`: `BudgetLimit`, снапшоты), метрики (`ProviderRuntimeState`, `ProviderMetricData`).
- Реестр адаптеров, роутер, трекер и рейтинги, миграция конфигураций, достижения.

## Реализация

- Каталог `provider-runtime/`: `provider-service.ts` (`ProviderRuntimeService`, `ProviderRuntimeDeps`), `provider-instance.ts` (`ProviderInstance`, `IProviderInstance`, `ProviderInstanceConfig`), `provider-budget.ts`, `provider-session.ts`, `provider-state.ts`.
- Верхний уровень: `provider-adapter-registry.ts` (`ProviderAdapterRegistry`, `ProviderRuntimeStatus`), `provider-router.ts` (`RouterService`), `provider-tracker.ts` (`ProviderTracker`, `ProviderRanking`), `provider-migration-service.ts`, `provider-achievement-service.ts`.

## Связи

- Ключи — [Компонент: управление ключами провайдеров](./comp-key-management.md); выбор/маршрут — [Компонент: роутинг и провайдеры](./comp-routing.md); расходы — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md).
- Панели: [Провайдеры и маршрутизация](./providers.md) (обзор), [Панель: Провайдеры и ключи](./panel-providers.md), [Панели: Провайдерские дополнения](./panel-providers-extra.md).

## Проверка работоспособности

- Тесты: `provider-adapter-registry.test.ts`, `provider-stack.e2e.test.ts`.
- Ручная: открыть Providers, проверить статусы инстансов и метрики.

## Состояние

- Реализовано; реестр адаптеров и e2e стека провайдеров покрыты тестами.
- **Известные риски (подробно — `docs/audits/providers-llm-audit.md`):** жёсткий список провайдеров в дебатах (`PRIORITY`) и `SUPPORTED_PROVIDERS` (новый провайдер требует правки кода); «Vectorault не подключён» — ключи хранятся plaintext; дублирование роутинга (РRouterRankingService` vs `KeyStateStore`, shadow-сравнение).

---

## Связанные материалы

- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)

[← Все материалы](./README.md)
