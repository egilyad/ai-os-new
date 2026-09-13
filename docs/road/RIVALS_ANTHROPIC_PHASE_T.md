# Phase T — Anthropic-десятка: ClaudeCode/MCP-deep/Computer+/CodeExec/Files/Cache + Project/DynamicWF/Routine/AgentView (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS_ANTHROPIC_COMPARE.md`. Проверки — на финал.

## Что сделано

### T.1 ClaudeCode (plan → approve → execute)
- `ClaudeCodeService` — `proposePlan/approvePlan` (kv `cc-plan/*`), `executePlan`, `addHook` (kv `cc-hooks/*`), `loadPlugin`, `slashCommand` → TypedAgent, `spawnSubagent` через coordination, Git status.

### T.2 MCP-deep / Computer+ / CodeExec / Files / Cache (инфра)
- `McpDeepService` — `discover` → `{tools, resources}`, `connectAll` (+reconnect).
- `ComputerExtService` — переиспользован `services/rivals5/computer-service.ts` (ACTIONS: `open_app/browser_navigate/devtools_run`); дубль — `services/browser/browser-harness-service.ts:44-57`.
- CodeExec — отдельной обёртки нет; есть только строка `code_execution` в промпте `agent-generator.ts:17` (wire к `code_execution_20260521` + container skills — на финалку).
- `FilesApiService` — `upload/get/list` (kv `files/*`).
- `CacheControlService` — `markCacheable` (TTL 1h default) + `stats`.

### T.3 Project / DynamicWorkflow / Routine / AgentView (оркестрация)
- `ProjectService` — `createProject/addFile/renderArtifact` (kv `projects/*`).
- `DynamicWorkflowService` — `run(tasks, checker)` (fan-out 50+checker).
- `RoutineService` — `define/trigger` (kv `routines/*`).
- `AgentViewService` — `sessions/skillViaContainer`.

### Wiring
- **Без смены Dexie** (kv, v34 max).
- `phase46-anthropic` (8 сервисов), регистрация `phase46-anthropic.ts:19-26`, `service-registration/index.ts:47,123`, lazy-сервисы `instances/services-extras.ts:569-576`.
- Контракты: `contracts/rivals14.ts:3-52` (8 интерфейсов + AgentView, 1-к-1 с планом).
- События: phase46-сервисы **ничего не эмитят**; живут только старые `mcp:updated`, `cache:invalidated`, `computer:act/handoff`, `codeexec:queued/sandbox:done` — семейств `claudecode:/dynwf:/routine:/agentview:/project:/files:*` нет.
- UI: 2 кнопки в табе `rivals` (plan/dynamic) **не сделаны**. Сиды tools/skills под фазу T: нет.

## Отложено на финальную проверку
- typecheck/build/tests по anthropic-срезу (своих ошибок в тайпчеке — 0).
- e2e `claudecode→mcp→computer→codeexec→files→cache→project→dynwf→routine→agentview` — DONE (`phase46-chain.test.ts`, через живой `runtime`). По пути починен доисторический `require()` в `phase3-debate-runtime.ts` (валил любой vitest с резолвом debateEngine/council под ESM) — заменён статическими импортами, `kernel/integration` 19/19 цел.
- CodeExec wire (`code_execution_20260521` + container skills list), недостающие события, 2 UI-кнопки.
