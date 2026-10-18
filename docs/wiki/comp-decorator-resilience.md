<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: декораторы устойчивости LLM

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, декораторы, устойчивость, retry

Источники: `src/llm/decorators/circuit-breaker.ts`, `src/llm/decorators/retry-decorator.ts`, `src/llm/decorators/rate-limit-decorator.ts`, `src/llm/decorators/fallback-decorator.ts`

## Назначение

Не падать и не перегружать провайдеров при сбоях и лимитах.

## Возможности

- `CircuitBreakerDecorator` — размыкание при отказах.
- `RetryDecorator` — повторы (в т.ч. по `RetryableError`).
- `RateLimitDecorator` — ограничение частоты.
- `FallbackDecorator` — резервный путь/провайдер.

## Реализация

- `src/llm/decorators/circuit-breaker.ts`, `retry-decorator.ts`, `rate-limit-decorator.ts`, `fallback-decorator.ts`.
- Все наследуют `BaseDecorator` ([Компонент: ядро LLM-конвейера (базы, middleware, утилиты)](./comp-middleware-core.md)).

## Связи

- Конвейер — [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md); адаптеры — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); рантайм — [Компонент: рантайм провайдеров](./comp-provider-runtime.md).

## Проверка работоспособности

- Тесты: `circuit-breaker.test.ts`, `retry-decorator.test.ts`, `rate-limit-decorator.test.ts`, `fallback-decorator.test.ts`.

## Состояние

- Реализовано; покрыто тестами.

---

## Связанные материалы

- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
