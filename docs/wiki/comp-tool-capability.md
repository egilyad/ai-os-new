<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: каталог инструментов, способности и политики

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, инструменты, способности, политики

Источники: `src/kernel/services/catalog/tool-catalog-service.ts`, `src/kernel/services/capability/capability-resolver.ts`, `src/kernel/services/capability/agent-factory.ts`, `src/kernel/services/routing-policy/routing-policy-service.ts`, `src/kernel/services/sandbox/code-sandbox-service.ts`, `src/kernel/services/deploy/deploy-bundle-service.ts`

## Назначение

Знать, что система умеет: каталог инструментов, разрешение способностей агентов, политики маршрутизации, песочница кода и упаковка деплоя.

## Возможности

- Каталог инструментов (`ToolCatalogService`).
- Способности: разрешение возможностей (`CapabilityResolver`) и фабрика агентов (`AgentFactory`).
- Политики роутинга (`RoutingPolicyService`), песочница кода (`CodeSandboxService`), сборка бандла деплоя (`DeployBundleService`).

## Реализация

- `catalog/`, `capability/` (`capability-resolver.ts`, `agent-factory.ts`), `routing-policy/`, `sandbox/`, `deploy/`.

## Связи

- Инструменты/MCP — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); маршрут — [Компонент: роутинг и провайдеры](./comp-routing.md); безопасность — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Панели: [Панель: Песочница сравнения моделей](./panel-playground.md), [Панели: Инфраструктура и платформа](./panel-infra-meta.md).

## Проверка работоспособности

- Тесты: `catalog/tool-catalog-service.test.ts`, `capability/golden-e2e.test.ts`, `sandbox/code-sandbox-service.test.ts`, `deploy/deploy-bundle-service.test.ts`.

## Состояние

- Реализовано; ключевые сервисы покрыты тестами.

---

## Связанные материалы

- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md)
- [Панель: Песочница сравнения моделей](./panel-playground.md)
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)

[← Все материалы](./README.md)
