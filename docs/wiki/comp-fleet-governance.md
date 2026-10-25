<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: флот, governance и аудит

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, флот, governance, аудит, политики, guardrails

Источники: `src/kernel/services/ops/fleet-monitor-service.ts`, `src/kernel/services/trust/governance-service.ts`, `src/kernel/services/ops/tool-governance-service.ts`, `src/kernel/services/trust/provenance-service.ts`, `src/kernel/services/ops/audit-service.ts`, `src/kernel/services/ops/hierarchy-service.ts`, `src/kernel/services/policy-service.ts`, `src/kernel/services/permissions/permission-service.ts`, `src/kernel/services/rivals/guardrail-service.ts`

## Назначение

Управлять «флотом» агентов и инструментов: следить за здоровьем, задавать правила, фиксировать происхождение и вести аудит.

## Возможности

- Мониторинг флота (`FleetMonitorService`, ~112 ст.: **read-only проекция** миссий crew/council/graph, без супервизии/restart), иерархия (`HierarchyService`).
- Доверие/правила: `GovernanceService` (~197 ст.: capability-гранты, trust-EMA, роли observer/approver/director/auditor), `ToolGovernanceService` (~104 ст.: MCP-реестр + per-agent grants, default-deny), `ProvenanceService` (граф предков решений).
- Аудит: `AuditService` (~88 ст.: append-only hash-chained лог fnv1a, `verify()`).
- Политики: `PolicyService` (~565 ст.), `AgentPermissionService` (~279 ст.), `GuardrailService` (~133 ст.).

## Реализация

- Разбросано по каталогам `ops/` (операционное), `trust/` (доверие), `permissions/`, `rivals/` (guardrail), `deploy/` — единого `FleetService` нет.
- **Важно:** `DeployBundleService` — статическая заглушка (реальный deploy `BLOCKED-RUNTIME`); флот — только проекция, реальной супервизии агентов нет.

## Связи

- Инструменты/песочница — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); политики — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Панели: [Панель: Флот (Fleet Console)](./panel-fleet.md), [Панель: Governance и безопасность](./panel-governance.md), [Панель: Роли и консорциумы](./panel-roles.md), [Панели: История, аудит, версии, деплой](./panel-history-audit.md), [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md).

## Проверка работоспособности

- Тесты есть на: `policy-service.test.ts`, `permissions/permission-service.test.ts`, `rivals/guardrail-service.test.ts`, `deploy/deploy-bundle-service.test.ts`, UI-панели (Governance/Guardrails/Policy/Fleet).
- **Пробел:** нет тестов на `AuditService`, `GovernanceService`, `FleetMonitorService`, `ToolGovernanceService` (проверка 2026-10).

## Состояние

- Реализовано; политики/права/guardrails покрыты тестами, ядро governance/аудита — без автотестов.
- **Риски (подробно — `docs/audits/fleet-governance-audit.md`):** `GovernanceService.evaluate` по умолчанию **fail-open** (`allow`), тогда как capability-проверка fail-closed; неаутентифицированные мутации `PolicyService`; дефолтные политики (content/custom/rate_limit) заданы, но не подключены к исполнению; два параллельных аудит-лога.

---

## Связанные материалы

- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Панель: Governance и безопасность](./panel-governance.md)
- [Панель: Роли и консорциумы](./panel-roles.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)
- [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)

[← Все материалы](./README.md)
