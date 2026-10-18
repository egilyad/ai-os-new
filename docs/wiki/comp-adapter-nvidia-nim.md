<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: адаптер NVIDIA NIM

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, llm, адаптер, nvidia, nim

Источники: `src/llm/nvidia/nvidia-nim-adapter.ts`, `src/llm/nvidia/nvidia-nim-types.ts`

## Назначение

Подключать инференс NVIDIA NIM.

## Возможности

- `NvidiaNIMAdapter` (`BaseLLMAdapter`); схема ответа `NvidiaNIMResponseSchema` (zod).

## Реализация

- `src/llm/nvidia/nvidia-nim-adapter.ts`, `src/llm/nvidia/nvidia-nim-types.ts`.

## Связи

- Зонтик — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md); родственные — [Компонент: адаптер Groq](./comp-adapter-groq.md), [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md).
- Панели: [Провайдеры и маршрутизация](./providers.md), [Панель: Провайдеры и ключи](./panel-providers.md).

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.

---

## Связанные материалы

- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: адаптер Groq](./comp-adapter-groq.md)
- [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md)
- [Провайдеры и маршрутизация](./providers.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)
