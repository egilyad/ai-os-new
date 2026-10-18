<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты сети и безопасности (kernel/utils)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, утилиты, сеть, безопасность

Источники: `src/kernel/utils/network.ts`, `src/kernel/utils/constant-time.ts`, `src/kernel/utils/sanitize.ts`, `src/kernel/utils/safe-json.ts`, `src/kernel/utils/ssr-storage.ts`

## Назначение

Набор низкоуровневых защитных утилит: проверка адресов, безопасный парсинг и хранение.

## Возможности

- `network.ts`: `isPrivateIP`, `isValidWebhookUrl`, `validateIntegrationUrl` — защита от SSRF и небезопасных интеграций.
- `constant-time.ts`: `constantTimeEqual` — сравнение без утечки по времени.
- `sanitize.ts` — санитизация входных данных; `safe-json.ts` — безопасный разбор JSON.
- `ssr-storage.ts`: `ssrSafeStorage` — безопасная обёртка хранилища (SSR/tests).

## Реализация

- `src/kernel/utils/`: `network.ts`, `constant-time.ts`, `sanitize.ts`, `safe-json.ts`, `ssr-storage.ts`.

## Связи

- Шифрование — [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md); политики — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Интеграции/webhook'и — [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md), [Компонент: мессенджеры и внешние интеграции (n8n, Telegram)](./comp-messaging-integrations.md).

## Проверка работоспособности

- Тест: `src/kernel/utils/network.test.ts`.

## Состояние

- Реализовано; сетевые проверки покрыты тестом.

---

## Связанные материалы

- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)
- [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Компонент: мессенджеры и внешние интеграции (n8n, Telegram)](./comp-messaging-integrations.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
