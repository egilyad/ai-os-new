# 07 — UI Layer

## Concept Layer

The UI is a single-page application (React 19 + Vite 8 + Zustand) composed of 145+ panels organized into 9 navigable sections: DASHBOARD (Dashboard, Tasks, SRE Agent), CHAT (Chat, Chat Admin), DEBATES (Builder, Arena, Rooms, Replay, Tournament, Graph, Analysis, Audience, Live Arena), AGENTS (Agents, Marketplace, Patterns, Roles Consortia, Agent Comparison, Agent Scheduler), CONNECTIONS (Providers, Pools, Connectors, MCP, Skills, Tools, Cache, Webhooks, Rotations, Groups, Provider Migration), DIAGNOSTICS (Logs, Traces, Router Trace, Memory, Memory Palace, Health, System Health, Docs Health, Pressure, What-If, Runtime Pressure, Provider Dashboard, Dependency Graph, Diagnostics, State Inspector, Profiler, Shadow, Causal Debugger, Counterfactual, Bindings, Ecosystem, Health SLA), KNOWLEDGE (Knowledge, Files, Docs, Patterns, Research Engine, Eval Datasets), INTEGRATIONS (Prompt Library, Model Compare, Security Scan, Google Studio, Gemini Live, Batch Processor, Workflows, Deploy, Model Distillation, Fine-tuning, Team Collaboration, Community Hub, Export/Import, Federated Memory, Plugin SDK, Persona Marketplace, Template Sharing, Memory Transfer, Aquarium Trading, Time Machine, Contribution Graph, Guardians), SETTINGS (Settings, Custom Metrics, Tutorials). Panels are reactive — they subscribe to kernel events and update without polling. Layout: fixed sidebar (left, 220px) + scrollable main area + optional right sidebar.

## System Mapping Layer

### File Structure

```
src/components/
  AddKeyModal/              — Multi-step key addition wizard (614 lines)
  AgentMarketplacePanel/    — Agent marketplace browser
  AgentsPanel/              — Agent workforce manager (272 lines)
  AlertLayer/               — Toast notification overlay (185 lines)
  AnalyticsPanel/           — System analytics dashboard (358 lines)
  AquariumPanel/            — Animated provider fish visualization (607 lines)
  ArgumentGraphPanel/       — Debate argument graph (293 lines)
  AuditLogView/             — Admin audit log (104 lines)
  BudgetPanel/              — Per-provider budget limits (lazy)
  BuilderPanel/             — Cognitive topology builder (520 lines)
  CachePanel/               — LLM response cache stats + invalidation (lazy)
  CausalDebugger/           — Temporal-causal debugger (364 lines)
  ChatAdminPanel/           — Chat session admin (390 lines)
  ChatPanel/                — Primary chat interface (940 lines)
  Common/                   — Shared components (ErrorBoundary, status-vocabulary)
  ConfigHistoryView/        — Config snapshot history (114 lines)
  ConfirmDialog.tsx         — Reusable confirmation dialog (37 lines)
  ConnectorsPanel/          — External service connectors (475 lines)
  CounterfactualPanel/      — Counterfactual simulation (264 lines)
  DashboardPanel/           — Main system dashboard (529 lines)
  DebateAnalysisPanel/      — Post-debate metric analysis (lazy)
  DebatePanel/              — Multi-agent debate visualization (1151 lines)
  DebateReplayPanel/        — Debate replay viewer (lazy)
  DebateRuntimePanel/       — Real-time debate engine monitor (659 lines)
  DebateWorkspacePanel/     — Multi-room debate workspace (lazy)
  DependencyMapPanel/       — Service dependency graph (154 lines)
  DiagnosticPanel/          — System diagnostics (229 lines)
  DocsHealthPanel/          — Documentation consistency checker (lazy)
  DocumentationPanel/       — Built-in documentation browser (426 lines)
  EventsTimeline/           — Chronological event timeline (325 lines)
  GroupsPanel/              — API key group manager (339 lines)
  HealthPanel/              — Provider health bee visualization (512 lines)
  KeyNotesPanel/            — Quick key notes (lazy)
  KeyTable/                 — Key detail modal (73+406+240 lines)
  KnowledgePanel/           — Knowledge graph viewer (423 lines)
  LiveCognition/            — Live workspace + mission control (274+120 lines)
  LogsPanel/                — Structured logger viewer (199 lines)
  MCPPanel/                 — MCP server manager (295 lines)
  MemoryPanel/              — Memory browser (428 lines)
  ModalShell.tsx            — Reusable modal wrapper (39 lines)
  PatternsPanel/            — Architecture patterns library (278 lines)
  PolicyPanel/              — Security policy manager (354 lines)
  PressureMap/              — Provider pressure gauges (203 lines)
  PressureMapPanel/         — System pressure map (261 lines)
  ProviderIcon/             — Reusable provider icon (83 lines)
  ProviderManager/          — Provider management suite (1066+ lines)
  RolesPanel/               — Role management (439 lines)
  RotationsPanel/           — Key rotation timeline (lazy)
  RouterTraceView/          — Router decision trace visualizer (352 lines)
  RoutingIntelligence/      — A/B testing & routing config (811 lines)
  SREAgentPanel/            — Site reliability agent (334 lines)
  SessionBindingsPanel/     — Session affinity viewer (125 lines)
  SettingsPanel/            — System settings (694 lines)
  ShadowPanel/              — Shadow diff viewer (246 lines)
  SkillsPanel/              — Cognitive skill manager (361 lines)
  SystemHealthPanel/        — Bootstrap health status (122 lines)
  TasksPanel/               — Task manager (383 lines)
  ToolsPanel/               — Tool registry (503 lines)
  TracesPanel/              — Cognitive trace viewer (385 lines)
  UsageHeatmap/             — Provider usage heatmap (113 lines)
  WebhooksPanel/            — Webhook CRUD + test ping (lazy)
  WorkspacePanel/           — File workspace (272 lines)
src/routes.tsx              — 70+ routes across 9 nav sections
```

### Panel Inventory by Category

#### 1. Infrastructure & System

| Panel              | File                     | Lines | Purpose                                                                                                                                                                                                          |
| ------------------ | ------------------------ | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DashboardPanel     | `DashboardPanel.tsx`     |   529 | Live system overview: key counts, request rates, costs, provider status grid, cognitive activity, routing decisions, SLA summary. Reads from `systemStatusService`, `kernel.getState()`, event subscriptions     |
| SettingsPanel      | `SettingsPanel.tsx`      |   694 | 6-tab settings (General, Writing, Reading, Alerts, Prompts, Advanced): i18n toggle, webhook config, external secrets management, feature flags, temperature/maxTokens defaults, restart button (`#restart` hash) |
| DocumentationPanel | `DocumentationPanel.tsx` |   426 | Built-in help browser: Getting Started, Architecture, API Reference, Safety, FAQ, Changelog sections with search                                                                                                 |
| AdminPanel         | `ChatAdminPanel.tsx`     |   390 | Chat session administration: list/search/delete sessions, bulk export/import, message filtering by provider/model                                                                                                |
| LogsPanel          | `LogsPanel.tsx`          |   199 | Structured logger viewer: reads `loggerService.getBuffer()`, filters by level/service/search, auto-scroll, pause/resume                                                                                          |
| EventsTimeline     | `EventsTimeline.tsx`     |   325 | Chronological event timeline: subscribes to observability:timeline:event:added, group/ungroup modes, filters                                                                                                     |
| EventsTimeline     | `EventsTimeline.tsx`     |   325 | Chronological timeline: grouped/ungrouped modes, severity icons, filters, save/clear timeline                                                                                                                    |
| AuditLogView       | `AuditLogView.tsx`       |   104 | Admin audit entries: severity-filtered list with live refresh from `adminService`                                                                                                                                |
| ConfigHistoryView  | `ConfigHistoryView.tsx`  |   114 | Configuration snapshot browser: browse timestamps, metadata, restore snapshots                                                                                                                                   |
| SystemHealthPanel  | `SystemHealthPanel.tsx`  |   122 | Bootstrap health display: area-by-area initialization status (keys, groups, passports, projections, stores)                                                                                                      |

#### 2. Provider Management

| Panel                | File                       |  Lines | Purpose                                                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProviderManager      | `ProviderManager/`         |  1066+ | Suite of provider management views: InstalledProvidersView (key list with health/reputation/priority drag-reorder), BrowseModelsView (available models per provider), ResourcePoolsView, ProviderDetailModal, RoutingSLAView, RoutingIntelligenceView. All consumed by `ProviderManagerContainer` |
| AddKeyModal          | `AddKeyModal.tsx`          |    614 | 3-step key addition: 1) Provider selection (20 supported, data-driven from `adapterRegistry`), 2) Key entry + validation via probe, 3) Model association. Bulk import with progress bar                                                                                                           |
| GroupsPanel          | `GroupsPanel.tsx`          |    339 | Key group CRUD: create/rename/delete groups, assign/remove keys, group-level status, drag-reorder priority                                                                                                                                                                                        |
| KeyTable             | `KeyTable/`                | 73-406 | `KeyProfileExtended` modal with 8 tabs: Overview (status/quota/latency), Traces, Quality, Sandbox (test prompts with pre-sets), Diagnostics, History, Notes, Tools                                                                                                                                |
| SessionBindingsPanel | `SessionBindingsPanel.tsx` |    125 | Session-to-key affinity viewer: shows active bindings with status (active/expiring/expired), eviction risk score, age                                                                                                                                                                             |
| ShadowPanel          | `ShadowPanel.tsx`          |    246 | Shadow comparison: live key state vs projected state, router decision diffs, drift score. Used for "what-if" analysis                                                                                                                                                                             |

#### 3. Health & Monitoring

| Panel               | File                           | Lines | Purpose                                                                                                                                                |
| ------------------- | ------------------------------ | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HealthPanel         | `HealthPanel.tsx`              |   512 | Animated bee visualization: per-key health status (bee color = state), real-time probe controls, quota tracking bars, latency sparklines, auto-refresh |
| SystemHealthPanel   | `SystemHealthPanel.tsx`        |   122 | Bootstrap health display: area-by-area initialization status                                                                                           |
| DocsHealthPanel     | `DocsHealthPanel.tsx`          |  ~350 | Documentation consistency: broken link detection, auto-fix via HealingPipeline                                                                         |
| AquariumPanel       | `AquariumPanel.tsx`            |   607 | Animated fish visualization: each provider key is a fish swimming — color = status, speed = latency, size = quota remaining                            |
| PressureMapPanel    | `PressureMapPanel.tsx`         |   261 | System pressure overview: per-provider pressure level with trend lines, alerts, real-time gauge, budget consumption                                    |
| PressureMap         | `PressureMap.tsx`              |   203 | Provider pressure gauge: single-provider pressure level with trend indicator, threshold markers                                                        |
| DiagnosticPanel     | `DiagnosticPanel.tsx`          |   229 | System diagnostics runner: full/quick diagnostic modes, severity-sorted issue list with suggested fixes, run history                                   |
| UsageHeatmap        | `UsageHeatmap.tsx`             |   113 | Provider usage intensity: 24h × 7d grid showing per-key request frequency, color-coded by volume                                                       |
| StateInspectorPanel | `StateInspectorPanel.tsx`      |  ~200 | Full kernel state browser: providers, weights, sessions                                                                                                |
| PerformanceProfiler | `PerformanceProfilerPanel.tsx` |  ~200 | Per-request profiling: timing breakdown by stage                                                                                                       |
| ProviderDashboard   | `ProviderDashboardPanel.tsx`   |  ~200 | Summary dashboard: all providers with latency/cost/success                                                                                             |

#### 4. Analytics & Intelligence

| Panel               | File                           | Lines | Purpose                                                                                                                                                                                                         |
| ------------------- | ------------------------------ | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AnalyticsPanel      | `AnalyticsPanel.tsx`           |   358 | System analytics: provider metrics sparklines (latency, TPS, cost), token usage over time, request volume, decision trace history. Includes `PricingPanel.tsx` as sub-tab with cost breakdown by provider/model |
| RouterTraceView     | `RouterTraceView.tsx`          |   352 | Per-request router decision visualizer: scoring breakdown with pipeline steps (circuit/ratelimit/policy/quota check), skipped providers, strategy info                                                          |
| TracesPanel         | `TracesPanel.tsx`              |   385 | Cognitive trace viewer: filter/search by service/level/traceId, audit view (table) + graph view (React Flow DAG). DecisionCard with expand/collapse drill-down                                                  |
| CausalDebugger      | `CausalDebugger.tsx`           |   364 | Temporal-causal chain debugger: traces causality chains across key state changes, temporal replay controls, consistency reports                                                                                 |
| CounterfactualPanel | `CounterfactualPanel.tsx`      |   264 | What-if simulation: compare actual router decisions vs alternative providers, narrative explanation of differences                                                                                              |
| RoutingIntelligence | `RoutingIntelligence.tsx`      |   811 | Router strategy A/B testing, weight tuner with sliders and save/undo, fallback chain editor, SLA mode selector                                                                                                  |
| SREAgentPanel       | `SREAgentPanel.tsx`            |   334 | Site Reliability agent: optimization suggestions, auto-fix, system alert feed, impact assessment                                                                                                                |
| DependencyMapPanel  | `DependencyMapPanel.tsx`       |   154 | Service dependency graph: React Flow DAG of kernel service dependencies with impact analysis                                                                                                                    |
| BudgetPanel         | `BudgetPanel.tsx`              |  ~300 | Budget limits per-provider with progress bars, spending history, auto-stop at limit                                                                                                                             |
| CostAnalyticsPanel  | `CostAnalyticsPanel.tsx`       |  ~200 | Cost breakdown by provider/model/agent with monthly forecast                                                                                                                                                    |
| ProviderMarketplace | `ProviderMarketplacePanel.tsx` |  ~200 | Compare provider pricing, speeds, models side-by-side                                                                                                                                                           |

#### 5. Tools, Skills & Policies

| Panel          | File                 | Lines | Purpose                                                                                                                                                                      |
| -------------- | -------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ToolsPanel     | `ToolsPanel.tsx`     |   503 | Tool registry: list/test/import/export tool definitions, JSON schema viewer, sandbox execution (code validation via meriyah AST), security settings (allowed hosts, timeout) |
| SkillsPanel    | `SkillsPanel.tsx`    |   361 | Cognitive skill manager: installed skills list with enable/disable, marketplace view, import/export `.json` skills, category filtering, search                               |
| MCPPanel       | `MCPPanel.tsx`       |   295 | Model Context Protocol servers: add/edit/remove server configs (name, URL, headers), view exposed tools and resources per server, health check                               |
| CachePanel     | `CachePanel.tsx`     |  ~200 | LLM response cache: hit/miss ratio, size, entries count, clear all / invalidate by model                                                                                     |
| WebhooksPanel  | `WebhooksPanel.tsx`  |  ~300 | Webhook CRUD: Slack/Telegram/Discord providers, event chip selection, test ping with result display, enable/disable toggle                                                   |
| RotationsPanel | `RotationsPanel.tsx` |  ~250 | Key rotation: timeline view, next rotation countdown, manual rotate button, rotation history                                                                                 |
| PolicyPanel    | `PolicyPanel.tsx`    |   354 | Security policy editor: create latency/privacy/cost/safety/rate-limit policies with actions (block/warn/log/throttle), assign to providers/groups                            |
| RolesPanel     | `RolesPanel.tsx`     |   439 | Agent role management: create/edit/delete roles with assigned tools and skills, usage statistics per role, role-to-agent mapping                                             |
| PatternsPanel  | `PatternsPanel.tsx`  |   278 | Architecture patterns library: categorized note cards (architecture, insight, best-practice, routing), searchable, expandable detail                                         |

#### 6. Memory & Knowledge

| Panel          | File                 | Lines | Purpose                                                                                                                                                      |
| -------------- | -------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MemoryPanel    | `MemoryPanel.tsx`    |   428 | Memory browser: 3 collection views (long-term/ephemeral/RAG), semantic search with embedding query, CRUD operations per entry, TTL display, collection stats |
| KnowledgePanel | `KnowledgePanel.tsx` |   423 | Knowledge graph: semantic memory nodes as graph with edges, search/filter by tag/type, node detail editing (content, metadata, embeddings)                   |

#### 7. Agent & Workspace

| Panel           | File                          |   Lines | Purpose                                                                                                                                                                           |
| --------------- | ----------------------------- | ------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AgentsPanel     | `AgentsPanel/AgentsPanel.tsx` |     272 | Agent workforce manager: grid of 25+ topology agents with name, status, temperature, tools, system prompt editing. Uses `AgentsPanelContext` for state (37+ fields)               |
| BuilderPanel    | `CognitiveBuilder.tsx`        |     520 | Visual topology builder: React Flow drag-and-drop canvas (agent/router/tool nodes), save/load topologies from/to storage, edge routing configuration                              |
| TasksPanel      | `TasksPanel.tsx`              |     383 | Autonomous/scheduled/on-demand task manager: task list with progress bars, retry controls, execution log, schedule configuration                                                  |
| WorkspacePanel  | `WorkspacePanel.tsx`          |     272 | File workspace: directory tree browser with file preview, search within workspace files, attach/detach workspace directories                                                      |
| LiveCognition   | `LiveCognition/`              | 274+120 | Live cognition suite: `LiveWorkspace` (agent live board, intelligence graph, real-time log stream) + `MissionControl` (wraps LiveWorkspace with advisor optimization suggestions) |
| ConnectorsPanel | `ConnectorsPanel.tsx`         |     475 | External service connectors: manage Slack, Discord, Gmail, GitHub, GitLab, Notion, Jira, Linear integrations with OAuth flow, status indicators, event subscription config        |

#### 8. Chat

| Panel          | File                 | Lines | Purpose                                                                                                                                                                                                                              |
| -------------- | -------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ChatPanel      | `ChatPanel.tsx`      |   940 | Primary chat interface: send/receive messages with streaming responses, markdown rendering with syntax highlighting, multi-provider response comparison, conversation management (new/rename/delete), temperature/maxTokens controls |
| ChatAdminPanel | `ChatAdminPanel.tsx` |   390 | Chat session administration (see Infrastructure above)                                                                                                                                                                               |

#### 9. Debate (documented in depth below)

| Panel                | File                                                            | Lines | Purpose                                                                                                                              |
| -------------------- | --------------------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------ |
| DebatePanel          | `DebatePanel.tsx`                                               |  1151 | Multi-agent debate: setup, live feed, analytics sidebar, history, strategy selector (round_robin/socratic/argument_tree/constrained) |
| DebateRuntimePanel   | `DebateRuntimePanel.tsx`                                        |   659 | Topology-driven session monitor with engine phase visualization                                                                      |
| DebateWorkspacePanel | `DebateWorkspacePanel.tsx`                                      |  ~300 | Multi-room debate workspace: sidebar with session list, room switching                                                               |
| DebateReplayPanel    | `DebateReplayPanel.tsx`                                         |  ~300 | Step-by-step debate replay with play/pause/seek controls                                                                             |
| DebateAnalysisPanel  | `DebateAnalysisPanel.tsx`                                       |  ~250 | Post-debate analysis: structural metrics, constraint compliance, quality metrics, interpretation                                     |
| TournamentPanel      | `TournamentPanel.tsx` + `DebatePanel/TournamentBracketView.tsx` |  ~200 | Tournament bracket: multiple debate pairs, winners advance (two implementations exist — standalone and embedded in DebatePanel)      |
| ArgumentGraphPanel   | `ArgumentGraphPanel.tsx`                                        |   293 | Debate argument DAG: React Flow visualization of claims as nodes, supports/challenges as edges, speaker color-coding                 |

### Data Flow Architecture

```
User Action → React Component → Zustand Store / Instance Method
  → Kernel Service → EventBus.emit()
    → React Component (event subscription) → re-render
    → Zustand Store (event subscription) → setState → re-render
```

Components communicate with kernel services via:

1. **Direct imports** from `instances.ts` (e.g., `keyService`, `groupManager`, `systemStatusService`)
2. **Event subscriptions** via `eventBus.on()` / `eventBus.onSafe<T>()` in `useEffect`
3. **Zustand stores** (`stores/`) that subscribe to events and expose reactive state

Cross-panel communication happens exclusively through EventBus — no panel imports another panel's state directly.

### Event Subscription Map

| Panel                  | Key Events                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `DashboardPanel`       | `kernel:updated`, `key:state:changed`, `key:added`, `key:removed`                                |
| `HealthPanel`          | `key:health:check:completed`, `key:health:check:failed`, `key:probe:result`, `key:latency:burst` |
| `AnalyticsPanel`       | `chat:stream:end`, `system:decision`, `kernel:updated`                                           |
| `TracesPanel`          | `trace:created`, `trace:updated`, `trace:completed`, `system:decision`                           |
| `RouterTraceView`      | `system:decision`                                                                                |
| `EventsPanel`          | all events (dynamic subscription)                                                                |
| `EventsTimeline`       | `observability:timeline:event:added`                                                             |
| `LogsPanel`            | reads `loggerService.getBuffer()` directly                                                       |
| `GroupsPanel`          | `key:group:sync`, `key:state:changed`                                                            |
| `SessionBindingsPanel` | `session:binding:expired`                                                                        |
| `ShadowPanel`          | `key:state:changed`, `system:decision`                                                           |
| `PressureMapPanel`     | `debate-runtime:budget:pressure`, `provider-runtime:budget`                                      |
| `CausalDebugger`       | `key:state:changed`, `key:compromised`, `key:quota:exceeded`                                     |
| `SREAgentPanel`        | `advisor:suggestion`, `system:notification`                                                      |
| `SettingsPanel`        | `settings:updated`, `system:notification`                                                        |
| `MCPPanel`             | `mcp:updated`                                                                                    |
| `ToolsPanel`           | `tools:updated`                                                                                  |
| `SkillsPanel`          | `skills:updated`                                                                                 |
| `RolesPanel`           | `roles:updated`, `role:assigned`, `role:unassigned`                                              |
| `MemoryPanel`          | `memory:updated`                                                                                 |
| `PolicyPanel`          | `policy:violation`                                                                               |
| `PricingPanel`         | `pricing:updated`                                                                                |
| `KnowledgePanel`       | `memory:updated`                                                                                 |
| `TasksPanel`           | `cognitive:step:active`, `cognitive:step:completed`, `cognitive:decision:made`                   |
| `WorkspacePanel`       | `workspace:attached`, `workspace:detached`                                                       |
| `AlertLayer`           | `key:health:check:failed`, `key:quota:exceeded`, `key:compromised`, `system:notification`        |
| `CachePanel`           | `cache:stats`, `cache:cleared`                                                                   |
| `WebhooksPanel`        | `webhook:test:result`, `webhook:updated`                                                         |
| `DocsHealthPanel`      | `docs:check:completed`, `docs:heal:completed`                                                    |
| `BudgetPanel`          | `budget:alert`, `budget:updated`                                                                 |
| `RotationsPanel`       | `rotation:completed`, `rotation:scheduled`                                                       |

## Behavior Layer

### Panel Lifecycle

- All panels mount/unmount with route changes (React Router v7 + `lazy`/`Suspense` for code splitting)
- Event subscriptions are set up in `useEffect` and cleaned up on unmount via returned unsubscribe functions
- Zustand stores persist across route changes (global singletons)

### Shared Patterns

- **Loading state**: panels show spinner/skeleton while kernel services initialize
- **Empty state**: panels show contextual "no data" message with action button (e.g., "Add Provider" in HealthPanel)
- **Error state**: `ErrorBoundary` catches render errors with retry/home fallback
- **isMountedRef**: 23+ components use ref guard to prevent state updates after unmount (race condition fix, P2 audit)

### Sidebar & Navigation

- Left sidebar: 9 sections (DASHBOARD, CHAT, DEBATES, AGENTS, CONNECTIONS, DIAGNOSTICS, KNOWLEDGE, INTEGRATIONS, SETTINGS) driven by `NAV_SECTIONS` in `routes.tsx`
- Active route highlighted, section collapse/expand remembered in StorageAdapter
- "Restart System" button in Settings → General navigates to `/#restart` which triggers full reload

### ProviderManager Suite

- `InstalledProvidersView` is the default route when clicking "Providers": shows key cards with health/reputation/priority, drag-and-drop reorder (HTML5), search/filter by provider
- `BrowseModelsView` lists available models per provider (data-driven from `adapterRegistry`)
- `AddKeyModal` opens as overlay from any provider view — 3 steps with validation
- `KeyProfileExtended` modal opens on key card click: 8 tab detail view

### Debate Visualization

- Analytics sidebar (380px) conditionally renders: structural metrics (argument_tree only), constraint compliance (constrained only), activity heatmap + quality metrics + interpretation (on completion)
- Arguments feed auto-scrolls to newest, fallback arguments show red banner, human injections right-aligned green
- Temperature slider: color-coded (blue→green→yellow→orange→red) with live label
- Agent cards use framer-motion spring animations

### Provider Health Visualization

- **HealthPanel** (bee metaphor): each key is a bee — green=ready, yellow=limited, red=broken, gray=inactive. Bees animate toward flower (working) or drift away (failing)
- **AquariumPanel** (fish metaphor): each key is a fish — color=status, speed=latency, size=quota. Fish swim left-to-right, faster = higher latency

### Policy Enforcement

- `PolicyPanel` creates policies evaluated by `PolicyService` during routing
- Policies can block providers entirely, warn on violation, log for audit, or throttle request rate
- Violations emit `policy:violation` → `NotificationWebhookService` forwards to configured webhooks

### Feature Flags

- Controlled via `FeatureFlagService` (kernel service, not UI state)
- Flags read in `useEffect` on panel mount — disabled features show "coming soon" placeholder
- Toggled in SettingsPanel Advanced tab, persisted to StorageAdapter
