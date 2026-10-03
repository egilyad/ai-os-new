# Projects Runtime Audit

> Audit date: 2026-08-14
> Goal: Map existing infra relevant to building a Projects system (roadmapp.md)

## Existing Infrastructure

### Agents
- `AgentService` (phase4, token `agentService`) — topology-based, agents are `ISNode` inside `ISTopology`
- `AgentService.spawnAgent()` pushes node into topology
- `AgentService.resolveAgent(id)` → `ResolvedAgent` with id/name/role/model/avatar
- `agentService.getAgents()` → all agents from topology
- Agents have `roleName`, `model`, `prompt`, `tools[]`, `provider` in config
- **Gap:** No project-scoped agent assignment

### Tools
- `ToolService` (legacy, phase4, token `toolService`) — built-in tools (`t-search`, `t-read-file`, etc.)
- `ToolRunnerService` (phase48+, token `toolRunnerService`) — agentic loop with `runWithTools()`
- `SkillService` (phase4, token `skillService`) — cognitive skills
- **Gap:** No project-scoped tool assignment; tools are global

### Storage
- Dexie DB: `super_agents_os_v4`, **version 34**, additive schema
- 100+ tables across domains (debate, knowledge, forum, builder, etc.)
- DAL pattern: `DataAccessLayer` → one repository per domain
- `DatabaseService` (token `database`) wraps Dexie
- **Gap:** No `projects` table; need v35 for project domain

### File Abstractions
- `WorkspaceService` — real FS via browser `FileSystemDirectoryHandle`
- `SandboxService` — Web Worker for code execution
- `FilesApiService` — stub interface
- **Gap:** No virtual filesystem for project file trees; real FS only

### Execution
- `OrchestrationService` — topology traversal (global scope)
- `ConversationDirectorService` — scenario-based (B3)
- `DebateEngine` — multi-agent debate
- `SandboxService` — isolated JS execution in Worker
- **Gap:** No project-scoped execution context

### Panels
- Pattern: Shell component with tabs → sub-components
- State: Zustand store + granular selectors
- DI: `lazyService()` from `kernel/instances`
- Route: `route-registry-content.ts` + `route-registry-icons.tsx` + `route-imports.ts`
- i18n: `useTranslation()` hook
- **Gap:** No projects panel

### Events
- EventBus: lossy, fire-and-forget, typed via Zod
- 200+ events in `event-registry.ts`
- Convention: `domain:entity:action`
- **Gap:** No `project:*` events

### DI Registration
- 65 phases in `service-registration/index.ts`
- Each phase: `registerPhaseN(helpers, ctx)` using `register(token, factory)`
- Lazy services via `services-extras.ts` for UI boundary
- **Gap:** Need `phase66-projects.ts`

## Required New Artifacts

| Artifact | Type | Location |
|----------|------|----------|
| `project-types.ts` | Contract | `src/kernel/contracts/` |
| `ProjectRepository` | Repository | `src/kernel/dal/` |
| `project-repository.ts` | Implementation | `src/kernel/dal/` |
| `project-service.ts` | Service | `src/kernel/services/` |
| `phase66-projects.ts` | DI | `src/kernel/service-registration/` |
| `ProjectsPanel.tsx` | UI | `src/components/ProjectsPanel/` |
| `project-store.ts` | Store | `src/stores/` |
| Events (5-8) | Events | `src/kernel/events/event-registry.ts` |
| Dexie v35 | Schema | `src/kernel/services/dexie-schema.ts` |
| i18n keys | i18n | `src/i18n/translations/{en,ru}/` |
