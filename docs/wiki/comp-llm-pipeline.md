<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: LLM-конвейер и декораторы

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, декораторы, middleware

Источники: `src/llm/core/base-adapter.ts`, `src/llm/core/base-decorator.ts`, `src/llm/core/middleware-pipeline.ts`, `src/llm/core/request-builder.ts`, `src/llm/decorators/circuit-breaker.ts`, `src/llm/decorators/retry-decorator.ts`, `src/llm/decorators/rate-limit-decorator.ts`, `src/llm/decorators/fallback-decorator.ts`, `src/llm/decorators/semantic-router.ts`, `src/llm/decorators/canary-router.ts`, `src/llm/decorators/cost-manager.ts`, `src/llm/decorators/compress-route.ts`, `src/llm/decorators/cache-decorator.ts`, `src/llm/decorators/priority-queue.ts`, `src/llm/decorators/logging-decorator.ts`

## Назначение

Обернуть вызовы LLM в переиспользуемые «декораторы»: устойчивость, экономия, маршрутизация и наблюдаемость — поверх базового адаптера.

## Возможности

- Устойчивость: circuit breaker, retry, fallback, rate limit, priority queue.
- Экономия и качество: cost manager, compress-route (сжатие промптов), cache, semantic-router, canary-router.
- Наблюдаемость: logging-decorator; база — `BaseDecorator`, `BaseLLMAdapter`.
- Сквозная обработка: `MiddlewarePipeline` (validation, moderation, logging), сборка запроса `LLMRequestBuilder`, ошибки `RetryableError`/`SafetyError`/`ModelValidationError`.

## Реализация

- `src/llm/core/`: `base-adapter.ts`, `base-decorator.ts`, `middleware-pipeline.ts`, `request-builder.ts`, `errors.ts`, `flyweight.ts`.
- `src/llm/decorators/`: `circuit-breaker.ts`, `retry-decorator.ts`, `rate-limit-decorator.ts`, `fallback-decorator.ts`, `semantic-router.ts`, `canary-router.ts`, `cost-manager.ts`, `compress-route.ts`, `cache-decorator.ts`, `priority-queue.ts`, `logging-decorator.ts`.
- Декораторы композируются вокруг адаптера (паттерн декоратор + цепочка middleware).
- **Порядок нанизывания в `AdapterFactory.create()`** (от внутреннего к внешнему): `Base adapter → RateLimit → Retry → CircuitBreaker → PriorityQueue → CostManager → Cache → Logging`. **Вне дефолтной цепочки** (экспортируются и покрыты тестами, но не авто-wiring): `SemanticRouterDecorator`, `CanaryRouterDecorator`, `CompressRouteDecorator` — их нужно подключать явно.

## Связи

- Адаптеры провайдеров — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); выбор/маршрут — [Компонент: роутинг и провайдеры](./comp-routing.md).
- Рантайм провайдеров — [Компонент: рантайм провайдеров](./comp-provider-runtime.md); расходы — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md).

## Проверка работоспособности

- Тесты покрывают почти все декораторы: `circuit-breaker.test.ts`, `retry-decorator.test.ts`, `rate-limit-decorator.test.ts`, `fallback-decorator.test.ts`, `semantic-router.test.ts`, `canary-router.test.ts`, `cost-manager.test.ts`, `compress-route.test.ts`, `cache-decorator.test.ts`, `priority-queue.test.ts`, `logging-decorator.test.ts`.

## Состояние

- Реализовано и хорошо покрыто тестами.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
