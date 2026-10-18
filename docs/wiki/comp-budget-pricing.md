<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: бюджет, цены и расход

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, бюджет, цены, расход

Источники: `src/kernel/services/budget-service.ts`, `src/kernel/services/pricing-service.ts`, `src/kernel/services/usage-tracker.ts`, `src/kernel/contracts/budget.ts`, `src/kernel/contracts/pricing.ts`

## Назначение

Считать деньги: сколько стоит запрос, сколько уже потрачено, не выходим ли за лимит, и во что обойдутся изменения состава ключей.

## Возможности

- Пер-агентский и глобальный учёт расходов, лимиты по провайдеру и по месяцу.
- Пороговые алерты на 50/80/90/100% бюджета.
- Аналитика: история, дневные затраты, тренд, аномалии, разбивка по провайдеру/модели/агенту.
- Оценка стоимости до запроса и синхронизация цен модели.

## Реализация

- `BudgetService implements IBudgetService` (`budget-service.ts`): дефолт `monthlyBudget = 50`; пороги `[50,80,90,100]` с дедупликацией `type:entity:level`; история расходов ≤ 10000, алертов ≤ 100; `saveHistory` дебаунс 5000 мс; кеш `BUDGET_CACHE_TTL = 1000` мс. Подписан на `chat:stream:end` (считает стоимость, дедуп по `requestId`).
- `PricingService implements ICostCalculator` (`pricing-service.ts`): `FALLBACK_PRICING` (~31 модели, цены за 1M токенов), снятие префиксов провайдеров, override'ы, prefix-cache, `syncFromOpenRouter()` (10с таймаут, пересчёт per-token → per-1M). Локальные модели (`ollama/lmstudio/localhost`) — нулевая стоимость.
- `UsageTracker implements IUsageTracker` (`usage-tracker.ts`): KV `super_agents_usage_records`, дебаунс записи 2000 мс, квота за окно **30 дней** (`defaultMonthlyBudget`, `maxRequestsPerMonth`).

## Связи

- Цены/бюджет использует [Компонент: роутинг и провайдеры](./comp-routing.md) (штрафы `costPenalty`/`budgetPenalty`) и [Компонент: управление ключами провайдеров](./comp-key-management.md) (free-tier).
- Панели: [Панель: Бюджет и затраты](./panel-budget.md) (витрина), [Панель: Провайдеры и ключи](./panel-providers.md) (ключи/цены).

## Проверка работоспособности

- `budget-service.test.ts` (644 строки: бюджеты, расход, дедуп, пороги, аналитика), `pricing-service.test.ts` (lookup/override/OpenRouter-конверсия), `usage-tracker.test.ts` (квота 30 дней, flush, destroy).

## Состояние

- Реализовано и подтверждено тестами.
- Отдельный `budget-alert-service.ts` существует и не совпадает с `BudgetService` — не путать.

---

## Связанные материалы

- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Панель: Бюджет и затраты](./panel-budget.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
