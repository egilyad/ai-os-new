<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты сети и безопасности (kernel/utils)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, утилиты, сеть, безопасность

Источники: `src/kernel/utils/network.ts`, `src/kernel/utils/constant-time.ts`, `src/kernel/utils/sanitize.ts`, `src/kernel/utils/safe-json.ts`, `src/kernel/utils/ssr-storage.ts`, `src/llm/http/llm-http-client.ts`, `src/kernel/services/probe-service.ts`

## Назначение

Набор низкоуровневых защитных утилит: проверка адресов, безопасный парсинг и хранение.

## Возможности

- `network.ts`: `isPrivateIP`, `isValidWebhookUrl`, `validateIntegrationUrl` (с защитой от IPv4-mapped IPv6/octal/hex bypass) — защита от SSRF и небезопасных интеграций.
- `constant-time.ts`: `constantTimeEqual` — **орфан** (файл есть, но в src не импортируется).
- `sanitize.ts` — санитизация входных данных; `safe-json.ts` — безопасный разбор JSON.
- `ssr-storage.ts`: `ssrSafeStorage` — безопасная обёртка хранилища (SSR/tests).
- Также к слою сети/давления относятся: `llm-http-client.ts` (семафор 50, таймаут 120 с, отмена под давлением памяти) и `probe-service.ts` (`PROBE_TIMEOUT=15000`, health-проверка ключей/провайдеров).

## Реализация

- `src/kernel/utils/`: `network.ts`, `constant-time.ts`, `sanitize.ts`, `safe-json.ts`, `ssr-storage.ts`.
- `src/llm/http/llm-http-client.ts`, `src/kernel/services/probe-service.ts`.

## Связи

- Шифрование — [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md); политики — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Интеграции/webhook'и — [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md), [Компонент: мессенджеры и внешние интеграции (n8n, Telegram)](./comp-messaging-integrations.md).

## Проверка работоспособности

- Тесты: `src/kernel/utils/network.test.ts`, `src/llm/http/llm-http-client.test.ts` (семафор/429/Retry-After/отмена).
- **Пробел:** `probe-service.ts` — без теста.

## Состояние

- Реализовано; сетевые проверки и HTTP-клиент покрыты тестами; `constantTimeEqual` — орфан.

---

## Связанные материалы

- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)
- [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Компонент: мессенджеры и внешние интеграции (n8n, Telegram)](./comp-messaging-integrations.md)
- [Разработчикам: структура и ворота](./for-developers.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)

[← Все материалы](./README.md)
