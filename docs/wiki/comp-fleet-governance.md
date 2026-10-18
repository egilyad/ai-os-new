<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: флот, governance и аудит

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, флот, governance, аудит

Источники: `src/kernel/services/ops/fleet-monitor-service.ts`, `src/kernel/services/trust/governance-service.ts`, `src/kernel/services/ops/tool-governance-service.ts`, `src/kernel/services/trust/provenance-service.ts`, `src/kernel/services/ops/audit-service.ts`, `src/kernel/services/ops/hierarchy-service.ts`

## Назначение

Управлять «флотом» агентов и инструментов: следить за здоровьем, задавать правила, фиксировать происхождение и вести аудит.

## Возможности

- Мониторинг флота (`FleetMonitorService`), иерархия (`HierarchyService`), sandbox-брокер (`sandbox-broker-service.ts`).
- Доверие/правила: `trust/governance-service.ts` (`GovernanceService`), `ops/tool-governance-service.ts` (`ToolGovernanceService`), провенанс (`provenance-service.ts`).
- Аудит действий (`audit-service.ts`), рынок навыков (`skill-market-service.ts`).

## Реализация

- Разбросано по каталогам `ops/` (операционное) и `trust/` (доверие) — единого `FleetService` нет.
- `FleetMonitorService`, `GovernanceService`, `ToolGovernanceService`, `ProvenanceService`, `AuditService`, `HierarchyService`.

## Связи

- Инструменты/песочница — [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md); политики — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Панели: [Панель: Флот (Fleet Console)](./panel-fleet.md), [Панель: Governance и безопасность](./panel-governance.md), [Панель: Роли и консорциумы](./panel-roles.md), [Панели: История, аудит, версии, деплой](./panel-history-audit.md), [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md).

## Проверка работоспособности

- **Тестов нет:** для перечисленных сервисов выделенные тесты не найдены.
- Ручная: Fleet/Governance/History-Audit показывают агентов, правила и записи аудита.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Панель: Governance и безопасность](./panel-governance.md)
- [Панель: Роли и консорциумы](./panel-roles.md)
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md)
- [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md)

[← Все материалы](./README.md)
