# Сравнение 1-к-1, Anthropic десятка + что дописываем

Дата: 2026-09-06. Фаза T. Без проверок. Всё на kv (v34 max).

## 1. Claude Code — agentic CLI (subagents, hooks, plugins, plan mode, slash commands, Git)
- **У них:** 400k сессий, 20h/нед, plan mode (предложение до деструкции), subagents (делегирование), hooks (pre-commit/post-edit), plugins/packaged extensions, slash commands (/review), Git workflows, interactive + headless.
- **Было у нас:** Aider/SWE-agent patterns, но нет plan mode + hooks + slash commands как first-class.
- **Дописываем (T.1):** `ClaudeCodeService` (plan → approve → execute, hooks registry в kv, plugin loader, slash commands → TypedAgent, subagent spawn через coordination, Git status).

## 2. Model Context Protocol (MCP)
- **У них:** open standard, server exposes tools/resources, client connects; 2026 de-facto (Filesystem, Postgres, GitHub, Slack, Brave, Higgsfield).
- **Было у нас:** MCPService базовый (addServer/callTool) но нет tool discovery + resources + client harness auto.
- **Дописываем (T.2):** `McpDeepService` (discover tools/resources per server, client harness, auto-reconnect, error handling).

## 3. Computer Use tool
- **У них:** Claude открывает apps, browser, dev tools; приложение реализует screenshot/mouse/keyboard.
- **Было у нас:** ComputerService 5 actions (screenshot/click_at/type_text/scroll/open_url) ticket-gated — близко, но нет app-open + browser nav.
- **Дописываем (T.2):** расширить `ComputerService` (open_app, browser_navigate, devtools_run) — добавка.

## 4. Agent API — Code Execution tool
- **У них:** code_execution_20260521 with container skills, beta, pricing.
- **Было у нас:** CodeExecService (validated tickets, external delegate) — близко.
- **Дописываем (T.2):** wire CodeExec → code_execution tool shape (container + skills list).

## 5. Agent API — Files API
- **У них:** store/access files across sessions, upload reports.
- **Было у нас:** knowledgeSources per text/url, no cross-session file store.
- **Дописываем (T.2):** `FilesApiService` (upload/list/get/delete files in kv `files/*`, session binding).

## 6. Agent API — Prompt Caching (1h)
- **У них:** ephemeral cache_control on system/tools, 50-80% cost cut, extended to 1h.
- **Было у нас:** cache in AdapterFactory (cache decorator) but no explicit 1h extended cache + cache_control passthrough.
- **Дописываем (T.2):** `CacheControlService` (mark system prompt/tools as cacheable, TTL tracking, stats).

## 7. Claude Projects (claude.ai)
- **У них:** persistent context spaces, 10 files, custom instructions, artifacts (HTML/SVG).
- **Было у нас:** notebooks (sources + mindmap) + dotprompt, but no Project scope with artifacts.
- **Дописываем (T.3):** `ProjectService` (Project = files + instructions + artifact render, kv `projects/*`).

## 8. Dynamic Workflows
- **У них:** 10s-100s parallel subagents, checking work before delivery (May 28 2026).
- **Было у нас:** ParallelAgents (fan-out N) + RunQueue concurrency 4 — близко, но не 100s.
- **Дописываем (T.3):** `DynamicWorkflowService` (fan-out up to 50 via RunQueue bulk, checker agent verifies).

## 9. Routines
- **У них:** configure once, run on schedule/API/event (Apr 14 2026).
- **Было у нас:** schedulerService + cron, but not as Routine abstraction.
- **Дописываем (T.3):** `RoutineService` (routine: trigger {schedule|api|event} → workflow, kv `routines/*`).

## 10. Agent View + Skills (managed agents)
- **У них:** one place to manage sessions, skills generation via `container: {skills: [...]}` + `code_execution`.
- **Было у нас:** FleetPanel 10 tabs, but no unified Agent View; skills via SkillMarket.
- **Дописываем (T.3):** `AgentViewService` (list sessions across all runs, skill generation via container skills).

## Карта реализации (Фаза T, phase46)
- События: `claudecode:*`, `mcp:*`, `computer:*`, `codeexec:*`, `files:*`, `cache:*`, `project:*`, `dynwf:*`, `routine:*`, `agentview:*` (~10, часть уже есть).
- Сервисы: claudeCode/mcpDeep, computerAdd/files/cache, project/dynamicWorkflow/routine/agentView → phase46.
- UI: 2 кнопки в табе `rivals` (plan mode, dynamic workflow).
