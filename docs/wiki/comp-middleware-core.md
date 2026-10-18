<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: ядро LLM-конвейера (базы, middleware, утилиты)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, ядро, middleware, утилиты

Источники: `src/llm/core/base-adapter.ts`, `src/llm/core/base-decorator.ts`, `src/llm/core/middleware-pipeline.ts`, `src/llm/core/request-builder.ts`, `src/llm/core/errors.ts`, `src/llm/core/flyweight.ts`, `src/llm/utils/compression.ts`, `src/llm/utils/token-counter.ts`

## Назначение

Дать общий фундамент: базовые классы адаптера/декоратора, middleware-конвейер, сборку запроса, ошибки и утилиты.

## Возможности

- `BaseLLMAdapter` и `BaseDecorator` — база для всех адаптеров и декораторов (`LLMProviderAdapter`, `SendMessageOptions`, `BuildBodyConfig`).
- `MiddlewarePipeline` + `LLMMiddleware`: `ValidationMiddleware`, `ModerationMiddleware`, `LoggingMiddleware` (`MiddlewareContext`, `NextFunction`).
- `LLMRequestBuilder` — сборка запросов.
- Ошибки: `RetryableError`, `SafetyError`, `ModelValidationError`.
- Утилиты: `compressText`/`compressMessages`/`getCompressionStats`, `estimateTokenCount`/`countChars`/`formatTokenCount`.

## Реализация

- `src/llm/core/`: `base-adapter.ts`, `base-decorator.ts`, `middleware-pipeline.ts`, `request-builder.ts`, `errors.ts`, `flyweight.ts`, `types.ts`.
- `src/llm/utils/`: `compression.ts`, `token-counter.ts`.

## Связи

- Конвейер — [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md); адаптеры — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); рантайм — [Компонент: рантайм провайдеров](./comp-provider-runtime.md).

## Проверка работоспособности

- Тесты: `core/middleware-pipeline.test.ts`, `core/flyweight.test.ts`.

## Состояние

- Реализовано; middleware и flyweight покрыты тестами.

---

## Связанные материалы

- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
