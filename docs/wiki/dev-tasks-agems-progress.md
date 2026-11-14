<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# AGEMS Tasks: статус реализации (M0–M5)

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, tasks, agems, roadmap, статус

Источники: `src/kernel/services/agems-task-service.ts`, `src/kernel/services/task-state-machine.ts`, `src/kernel/services/task-lock-sweeper-service.ts`, `src/kernel/services/task-scheduler-adapter.ts`, `src/kernel/services/task-trigger-service.ts`, `src/kernel/services/tasks-sync.ts`, `src/kernel/dal/task-repository.ts`, `server/tasks-router.mjs`, `cli/tasks-mcp-server.mjs`, `src/kernel/services/task-executor-dispatcher.ts`

## Что было сделано

Подсистема задач (AGEMS) прошла роадмап M0→M5 и стала безопасной, наблюдаемой и открытой для внешних агентов.

### M0 — Safety core
- Атомарный `claimTask` (Dexie-транзакция `rw!`, без гонок).
- Машина состояний `task-state-machine.ts`: нелегальные переходы запрещены, `TaskIllegalTransitionError`.
- `TaskLockSweeperService`: возврат осиротевших IN_PROGRESS в PENDING.
- Zod-хуки на все AGEMS-таблицы.
- Схема Dexie v44 (индексы `lockedBy`/`lockedUntil`).

### M1 — Observability & DAL
- 8 EventBus-событий (`task:created`, `task:status:changed`, `task:claimed` и др.).
- `TaskRepository` в DAL (`dal.tasks`), сервис переведён на него.
- История переходов `taskStatusHistory` (Dexie v45).
- Сервисы комментариев и лейблов.

### M2 — External API & MCP
- REST `/api/tasks` на sync-server + sync-зеркало `data/tasks.json`.
- MCP-сервер `cli/tasks-mcp-server.mjs` (8 инструментов), подключён в `opencode.jsonc`.
- Per-task authz: воркер действует только на своих/неназначенных задачах.

### M3 — OpenCode safe-flow
- e2e-спека `opencode-task-cycle.spec.ts`: полный цикл create→next→claim→status→release (REST + MCP + authz).

### M5 — RECURRING & triggers
- `task-scheduler-adapter.ts`: спавн ONE_TIME-инстансов для due RECURRING.
- Реальный dispatch триггеров (`agent:*` → handoff, `http:*` → webhook).
- Retry/backoff для FAILED (`retryCount/maxRetries/nextRetryAt`).

## Открытые вопросы
- Полноценный executor-раннер поверх handoff (пока accept без исполнения).
- UI-редактор всех полей задачи (M4 роадмапа).

---

## Связанные материалы

- [Панель: Задачи и пайплайны](./panel-tasks.md)
- [Компонент: задачи, планирование и расписание](./comp-task-planning.md)
- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [Codebase Memory MCP: граф кода для агентов](./dev-codebase-memory-mcp.md)

[← Все материалы](./README.md)
