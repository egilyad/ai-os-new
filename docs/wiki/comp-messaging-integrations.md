<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: мессенджеры и внешние интеграции (n8n, Telegram)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, интеграции, n8n, telegram, уведомления

Источники: `src/kernel/services/n8n-service.ts`, `src/kernel/services/telegram-service.ts`, `src/kernel/services/notification-webhook-service.ts`, `src/kernel/services/tool-executor.ts`

## Назначение

Связывать систему с внешним миром через автоматизацию, мессенджеры и вебхуки, а также исполнять внешние инструменты.

## Возможности

- Интеграция с n8n (`N8NService`, `N8NWorkflow`) — автоматизации/воркфлоу.
- Telegram-мост (`TelegramService`, `TelegramBridge`).
- Вебхук-уведомления (`NotificationWebhookService`) — сюда же относится событие `system:notification`.
- Исполнение инструментов (`ToolService`, `tool-executor.ts`) — привязки, внешние инструменты.

## Реализация

- `n8n-service.ts`, `telegram-service.ts`, `notification-webhook-service.ts`, `tool-executor.ts` (класс `ToolService`).
- Дополняет `interop/` ([Компонент: интеграции и интероперабельность](./comp-integrations-interop.md)) и инструментальную подсистему ([Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)).

## Связи

- Интероп/шлюз — [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md); инструменты — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md).
- Панели: [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md), [Панель: Каналы](./panel-channels.md); уведомления — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md) (`useNotificationStore`).

## Проверка работоспособности

- Тесты: `n8n-service.test.ts`, `telegram-service.test.ts`, `tool-executor.test.ts`.

## Состояние

- Реализовано; n8n, Telegram и исполнитель инструментов покрыты тестами.

---

## Связанные материалы

- [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md)
- [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md)
- [Панель: Каналы](./panel-channels.md)
- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)
- [Компонент: флот, governance и аудит](./comp-fleet-governance.md)

[← Все материалы](./README.md)
