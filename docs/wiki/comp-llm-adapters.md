<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптеры провайдеров LLM

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, llm, адаптеры, провайдеры

Источники: `src/llm/registry/adapter-factory.ts`, `src/llm/http/llm-http-client.ts`, `src/llm/http/sse-parser.ts`, `src/llm/gemini/gemini-adapter.ts`, `src/llm/openrouter/openrouter-adapter.ts`, `src/llm/groq/groq-adapter.ts`, `src/llm/nvidia/nvidia-nim-adapter.ts`, `src/llm/anthropic/anthropic-adapter.ts`, `src/llm/openai-compatible/openai-compatible-adapter.ts`, `src/llm/utils/token-counter.ts`, `src/llm/catalog/models-catalog.ts`, `src/llm/catalog/catalog-lookup.ts`

## Назначение

Говорить на «языке» каждого провайдера: превращать общий запрос в формат конкретного API и обратно, включая стриминг и tool-calls.

## Возможности

- Адаптеры под провайдеров: Gemini, OpenRouter, Groq, NVIDIA NIM, Anthropic, Cerebras, Cloudflare, DeepSeek, Kimi, MiniMax, Qwen, OpenAI-совместимые, компьютерные (Gemini Computer), а также MockAdapter.
- Фабрика адаптеров, HTTP-клиент с таймаутами и `parseRetryAfterHeader`, парсер SSE-стрима.
- Утилиты: подсчёт токенов (`estimateTokenCount`), сжатие промптов.
- Каталог моделей (context/цены/capability-флаги) — `catalog/`, данные models.dev; используется `PricingService` и контролем контекста чата.

## Реализация

- Провайдерные каталоги: `gemini/`, `openrouter/`, `groq/`, `nvidia/`, `anthropic/`, `cerebras/`, `cloudflare/`, `deepseek/`, `kimi/`, `minimax/`, `qwen/`, `openai-compatible/`, `gemini-computer/`, `mock/`.
- `registry/adapter-factory.ts` (`AdapterFactory`), `http/llm-http-client.ts` (`LLMHttpClient`, таймаут 120000 мс), `http/sse-parser.ts`.
- Gemini-специфика: `gemini-request-builder.ts`, `gemini-response-mapper.ts`, `gemini-stream-parser.ts`, `gemini-health.ts`, `gemini-model-validator.ts`.

## Связи

- Конвейер декораторов — [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md); рантайм — [Компонент: рантайм провайдеров](./comp-provider-runtime.md); ключи — [Компонент: управление ключами провайдеров](./comp-key-management.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md); каталог — [Каталог компонентов OS](./dev-component-catalog.md).

## Проверка работоспособности

- Тесты: `llm/http/llm-http-client.test.ts`, `llm/http/sse-parser.test.ts`, `llm/registry/adapter-factory.test.ts`.

## Состояние

- Реализовано; HTTP/SSE и фабрика адаптеров покрыты тестами, часть адаптеров — чтением кода.

---

## Связанные материалы

- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

[← Все материалы](./README.md)
