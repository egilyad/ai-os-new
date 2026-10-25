<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер Cloudflare

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, cloudflare

Источники: `src/llm/cloudflare/cloudflare-adapter.ts`

## Назначение

Подключать модели Cloudflare (Workers AI).

## Возможности

- `CloudflareAdapter` (`BaseLLMAdapter`, НЕ OpenAiCompatible): ключ формата `"{account_id}:{api_token}"` (разбор в parseAuth); фактический endpoint `/proxy/cloudflare/{accountId}/ai/v1/chat/completions`.
- Streaming: SSE, `idleTimeoutMs=30000`; batch читает и OpenAI-формат и legacy `result.response`.
- `checkHealth`; `getAvailableModels` с бэкоффом 300 с; `getFreeTier` → 14400 req/день, 1M токенов/день. `rotateKey` — **нет**.

## Реализация

- `src/llm/cloudflare/cloudflare-adapter.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные — [Компонент: адаптер NVIDIA NIM](./comp-adapter-nvidia-nim.md), [Компонент: MockAdapter](./comp-adapter-mock.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Согласовано: отдельного адаптерного тест-файла нет (покрытие косвенное).
- Ручная: выбрать Cloudflare в Providers и отправить сообщение.

## Состояние

- Реализовано; подтверждено чтением кода, без прямых автотестов.
- **Риск:** не нормализует finishReason и не возвращает toolCalls (сырой `finish_reason`).

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер NVIDIA NIM](./comp-adapter-nvidia-nim.md)
- [Компонент: MockAdapter](./comp-adapter-mock.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
