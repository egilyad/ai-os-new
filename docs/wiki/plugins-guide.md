<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Плагины: возможности и использование

> Раздел: **Разработчикам** · Статус: verified · Теги: разработчикам, плагины, SPEC_06

Источники: `src/kernel/services/plugins/plugin-host.ts`, `src/kernel/services/plugins/plugin-loader.ts`, `src/kernel/contracts/plugin.ts`, `src/components/PluginManagerPanel.tsx`, `src/components/PluginMarketplacePanel.tsx`

Проверено по коду: 2026-11-09 · mercury

## Что такое плагин

Плагин — это самодостаточный модуль с манифестом (JSON), который расширяет систему через декларативный блок `contributes`. Ядро не знает внутренностей плагина: всё, что плагин умеет, описано в манифесте и исполняется через изолированные порты.

## Что плагин умеет (contributes)

| Блок | Что даёт | Порт исполнения |
|---|---|---|
| `tools` | Новые инструменты для агентов и дебатов | `PluginHost` → `ToolService` |
| `panels` | Новые панели UI (маршрут `/plugin/<id>`) | `PluginPanelFrame` (iframe) |
| `services` | Сервисы плагина, вызываемые по id | `PluginHost.callService` |
| `mcpServers` | Встроенные локальные MCP-серверы | `PluginHost` → `MCPService` |
| `subscriptions` | Подписки на события EventBus | `PluginHost.registerSubscriptions` |

## Права (permissions)

Манифест обязан декларировать permissions:
- `tool:*` или `tool:<name>` — инструменты (при включённом `enforceToolPermissions` плагин без них не загрузится);
- `event:subscribe:<event>`, `mcp:<server>`, `service:<id>` — аналогично.

## Как использовать готовые плагины

1. Открой панель **Плагины** (`/plugins`): статусы, активация/деактивация, списки панелей и инструментов.
2. Открой **Плагины — маркетплейс** (`/plugin-marketplace`): встроенный каталог демо-плагинов с кнопками «Установить» / «Удалить».
3. Установленные панели появляются в сайдбаре (секция «Плагины») и открываются по `/plugin/<id>` в sandboxed iframe (`allow-scripts`, без `allow-same-origin`).

## Каталог демо-плагинов

Встроенные примеры (src/kernel/services/plugins/plugin-marketplace-catalog.ts):
- `demo.search` — инструмент + подписка на событие;
- `demo.weather` — инструмент;
- `demo.mcp` — встроенный MCP-сервер;
- `demo.service` — сервис плагина.

## Безопасность

- Код инструментов исполняется в изолированном Web Worker (`PluginWorkerClient`), без доступа к DOM/window/localStorage.
- Панели — в sandboxed iframe (без same-origin).
- Таймауты, лимиты вызовов инструментов (10) и политика permissions встроены в хост.

---

## Связанные материалы

- [Как написать свой плагин](./plugins-create.md)
- [Плагины](./panel-plugins.md)
- [Маркетплейс плагинов](./panel-plugin-marketplace.md)
- [Технический долг](./dev-status-debt.md)

[← Все материалы](./README.md)
