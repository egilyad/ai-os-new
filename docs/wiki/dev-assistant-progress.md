<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Assistant: статус реализации (M0–M2)

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, assistant, safety, roadmap, статус

Источники: `src/kernel/services/assistant/assistant-service.ts`, `src/kernel/services/tool-loop/tool-loop.ts`, `src/kernel/services/task-executor-dispatcher.ts`, `src/kernel/services/assistant/assistant-ops-actions.ts`, `src/kernel/service-registration/phase78-assistant.ts`

## Что было сделано

Ассистент прошёл роадмап M0→M2 — закрыты критические safety/context/delegation-пробелы.

### M0 — Safety
- PII redaction на финальный ответ (`redactPii(finalContent)`).
- Audit-chain для write/exec действий (`audit.append`, подключён в phase78).
- Abort-сигнал пробрасывается в LLM-вызов (отмена in-flight).
- `recordInterrupted` — запись прерванного хода в дневник.
- Retry/backoff для transient LLM-ошибок (2 попытки, 1.5с).
- Round-cap awareness: сообщение модели на последнем раунде.
- Правила авторизации для `agent:assistant` (read=allow, write/exec=ask).
- Coverage include для `assistant/**`.

### M1 — Context & memory
- Session-history injection: последние 6 ходов в контекст.
- Token-budget: ~12k символов, приоритетная обрезка.
- `recallSmart()`: BM25/vector через MemoryService.search с фолбэком.
- Persist частичного ответа при отмене/ошибке.
- Multi-hop wiki traversal (`traverse`), блок `[WIKI GRAPH — multi-hop trail]`.

### M2 — Delegation
- `tasks.create` с agentId теперь создаёт handoff (TaskHandoffService).
- `TaskExecutorDispatcher` — подписчик на AGENT_HANDOFF_INITIATED, accept при старте.
- `invocation.run` (tool:exec) — запуск агента через Invocation Engine (agentId/role/expertise).
- `agents.execute-group` (tool:exec) — выполнение группы (parallel/sequential/pipeline).

## Открытые вопросы
- Plan-execution loop и structured planner (M4).

---

## Связанные материалы

- [Панель: Помощник проекта](./panel-assistant.md)
- [Админка ассистента](./panel-assistant-admin.md)
- [AGEMS Tasks: статус реализации (M0–M5)](./dev-tasks-agems-progress.md)

[← Все материалы](./README.md)
