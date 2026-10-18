<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: интеграции и интероперабельность

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, интеграции, интероп, gateway

Источники: `src/kernel/services/interop/a2a-service.ts`, `src/kernel/services/interop/coordination-service.ts`, `src/kernel/services/interop/federation-service.ts`, `src/kernel/services/interop/gateway-service.ts`, `src/kernel/services/interop/mcp-harness-service.ts`, `src/kernel/services/rivals2/integrations-service.ts`

## Назначение

Связывать систему с внешним миром: другими агентами, сервисами, MCP-инструментами и корпоративным шлюзом.

## Возможности

- A2A-обмен агент↔агент, координация, федерация, перевод сообщений/протоколов.
- Шлюз (`GatewayService`) для внешних вызовов; проверка MCP-инструментов (`McpHarnessService`).
- Каталог интеграций (`rivals2/integrations-service.ts`).

## Реализация

- Каталог `interop/`: `a2a-service.ts`, `coordination-service.ts`, `federation-service.ts`, `gateway-service.ts` (`GatewayService`), `mcp-harness-service.ts`, `translation.ts`.
- Отдельный серверный шлюз описан в `docs/COMPANY_GATEWAY.md` (см. [Карта документации](./docs-index.md)).
- Каталог `rivals2/`: `integrations-service.ts` (`IntegrationsService`) и адаптеры (aider, swe, rag, react-режимы).

## Связи

- Инструменты и MCP — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); маршрутизация — [Компонент: роутинг и провайдеры](./comp-routing.md).
- Панели: [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md), [Панели: Компании и корпоративный gateway](./panel-gateway.md), [Панель: Форум](./panel-forum.md).

## Проверка работоспособности

- Тесты: `mcp-harness-service.test.ts`, `interop-demo-seed.test.ts`.
- Ручная: открыть Integrations/Gateway и проверить подключения.

## Состояние

- Реализовано; MCP-харнесс и демо интеропа покрыты тестами.

---

## Связанные материалы

- [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md)
- [Панели: Компании и корпоративный gateway](./panel-gateway.md)
- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)
- [Панель: Форум](./panel-forum.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)

[← Все материалы](./README.md)
