<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер Groq

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, groq

Источники: `src/llm/groq/groq-adapter.ts`

## Назначение

Подключать быстрый инференс Groq.

## Возможности

- `GroqAdapter` наследует `OpenAiCompatibleAdapter`: запросы идут через общий `LLMHttpClient` и `/proxy/groq` — SDK `groq-sdk` больше не создаёт отдельный путь мимо декораторов и SSRF-защиты.
- Streaming и SSE обрабатываются общим HTTP-стеком.
- Усечение истории — общее для OpenAI-совместимых адаптеров (`buildRequestBody`), отдельного `trimMessagesForGroq` нет.
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
