<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер NVIDIA NIM

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, nvidia, nim

Источники: `src/llm/nvidia/nvidia-nim-adapter.ts`, `src/llm/nvidia/nvidia-nim-types.ts`

## Назначение

Подключать инференс NVIDIA NIM.

## Возможности

- `NvidiaNIMAdapter` (`BaseLLMAdapter`, НЕ OpenAiCompatible): baseURL `/proxy/nvidia`, endpoint `POST /v1/chat/completions`.
- Streaming: SSE, `idleTimeoutMs=90000`; терминальный chunk только по finishReason (без usage/toolCalls).
- `checkHealth`; `getAvailableModels` с бэкоффом 30 с; `sanitizeModel`; `omitFields:['cachedContent']`. `rotateKey` — **нет**.

## Реализация

- `src/llm/nvidia/nvidia-nim-adapter.ts`, `src/llm/nvidia/nvidia-nim-types.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные — [Компонент: адаптер Groq](./comp-adapter-groq.md), [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Согласовано: отдельного адаптерного тест-файла нет (покрытие косвенное).
- Ручная: выбрать NVIDIA NIM в Providers и отправить сообщение.

## Состояние

- Реализовано; подтверждено чтением кода, без прямых автотестов.
- **Риск:** streaming теряет usage/toolCalls (терминальный chunk по finishReason); токены в non-streaming — через `estimateTokenCount`-фолбэк.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер Groq](./comp-adapter-groq.md)
- [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
