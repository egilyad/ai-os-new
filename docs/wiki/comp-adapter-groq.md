<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер Groq

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, groq

Источники: `src/llm/groq/groq-adapter.ts`

## Назначение

Подключать быстрый инференс Groq.

## Возможности

- `GroqAdapter` (`BaseLLMAdapter`, НЕ OpenAiCompatible): использует SDK `groq-sdk` (не `LLMHttpClient`), `timeout=120000`, `maxRetries=2`, `dangerouslyAllowBrowser:true`.
- Streaming: SSE с idle-guard 30 с и терминальным meta-chunk (finishReason/tokens/toolCalls).
- `trimMessagesForGroq`: усечение истории свыше 6000 символов (`[Previous debate history summarized...]`).
- `checkHealth` через `getAvailableModels`; `normalizeError` (401/403 → AuthError, 429 → RetryableError). `rotateKey` — **нет**.

## Реализация

- `src/llm/groq/groq-adapter.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные — [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md), [Компонент: адаптер NVIDIA NIM](./comp-adapter-nvidia-nim.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Согласовано: отдельного адаптерного тест-файла нет (покрытие только косвенное — фабрика/free-tiers).
- Ручная: выбрать Groq в Providers и отправить сообщение.

## Состояние

- Реализовано; подтверждено чтением кода, без прямых автотестов.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md)
- [Компонент: адаптер NVIDIA NIM](./comp-adapter-nvidia-nim.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
