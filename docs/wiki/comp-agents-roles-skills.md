<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: агенты, роли и навыки

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, агенты, роли, навыки

Источники: `src/kernel/services/agent-service.ts`, `src/kernel/services/role-service.ts`, `src/kernel/services/skill-service.ts`

## Назначение

Кто выполняет работу: агенты (исполнители в топологии), роли (права и профиль поведения) и навыки (переиспользуемые когнитивные умения).

## Возможности

- Агенты: жизненный цикл (`activate/pause/archive`), CRUD, иерархия, группы с режимами (`parallel/sequential/consensus/pipeline/debate`), статистика, авто-спавн.
- Роли: CRUD с наследованием и пермишенами, назначение узлам топологии, статистика/ELO/усталость.
- Навыки: установка/удаление/переключение, импорт/экспорт, счётчик исполнений.

## Реализация

- `AgentService` (`agent-service.ts`, ~1130 строк) реализует `IAgentResolver` (нужен Conversation Director). `autoSpawnConfig = { enabled: true, maxAgents: 10, ... }`; лимит статистики `MAX_AGENT_STATS = 500`; персист статистики/групп/топологии с дебаунсом 2000 мс; `beforeunload`-flush. События: `agent:lifecycle:change`, `system:node:spawn`, `system:node:removed`; подписки на `system:topology:mounted`, `cognitive:step:completed`, `chat:stream:end`.
- `RoleService` (`role-service.ts`, ~830 строк): **20 встроенных ролей** по категориям (technical/analytical/creative/management/specialized). Встроенные роли нельзя удалить. Наследование прав (`getEffectivePermissions`), лидерборд ELO, анализ усталости. События `roles:updated`, `role:assigned/unassigned`.
- `SkillService` (`skill-service.ts`): **5 дефолтных навыков** — Deep Web Researcher, Code Reviewer Pro, Social Media Manager, Data Visualization Agent, Swarm Orchestrator. Дефолты сеются только при пустом хранилище; `toggleActive` не трогает `not_installed`; импорт валидируется схемой.

## Связи

- Агенты исполняются в дебатах/оркестрации; роли назначаются на узлы топологии.
- Статистика агента потребляется роутингом и аналитикой ([Компонент: роутинг и провайдеры](./comp-routing.md)).
- Панели: [Агенты: устройство и управление](./agents.md), [Панель: Роли и консорциумы](./panel-roles.md), [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md).

## Проверка работоспособности

- `agent-service.test.ts` (resolveAgent + персист топологии), `skill-service.test.ts` (полный CRUD/toggle/import).
- **Тестов нет:** `RoleService` (есть отдельные `unified-role-service.ts`/`role-version-service.ts`).

## Состояние

- Агенты и навыки подтверждены тестами; роли — только кодом (покрытие открыто).

---

## Связанные материалы

- [Агенты: устройство и управление](./agents.md)
- [Панель: Роли и консорциумы](./panel-roles.md)
- [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)

[← Все материалы](./README.md)
