<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер Gemini

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, адаптер, gemini

Источники: `src/llm/gemini/gemini-adapter.ts`, `src/llm/gemini/gemini-request-builder.ts`, `src/llm/gemini/gemini-response-mapper.ts`, `src/llm/gemini/gemini-stream-parser.ts`, `src/llm/gemini/gemini-health.ts`, `src/llm/gemini/gemini-model-validator.ts`, `src/llm/gemini/gemini-types.ts`

## Назначение

Обслуживать провайдера Google Gemini: сборка запроса, разбор ответа и стрима, проверка здоровья и валидация моделей.

## Возможности

- `GeminiAdapter` (`BaseLLMAdapter`) — основной адаптер.
- `GeminiRequestBuilder` — сборка тела запроса; `gemini-response-mapper.ts` — маппинг в `ProviderResponse` (`toProviderResponse`, токены, grounding-метаданные).
- `GeminiStreamParser` — потоковый разбор; `extractChunkText`/`extractStreamMeta`.
- `GeminiHealthCheck` — проверка доступности; `ModelCache`/`sanitizeModel` — валидация имён моделей.

## Реализация

- Каталог `src/llm/gemini/`: `gemini-adapter.ts`, `gemini-request-builder.ts`, `gemini-response-mapper.ts`, `gemini-stream-parser.ts`, `gemini-health.ts`, `gemini-model-validator.ts`, `gemini-types.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); конвейер — [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md); рантайм — [Компонент: рантайм провайдеров](./comp-provider-runtime.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Тест: `src/llm/gemini/gemini-adapter.test.ts`.

## Состояние

- Реализовано; покрыто тестом.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
