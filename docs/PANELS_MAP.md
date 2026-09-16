# Panels Map — SuperAgents OS

> Дата: 2026-09-09. Этап T0.2. Только карта, без кода.
> Роутер: `src/App.tsx` → `AppLayout` → `AppRoutes` (`src/routes.tsx:211`); `/{nav-id}` из `NAV_SECTIONS` (`route-registry*.ts`) → `PANEL_COMPONENTS` (`route-imports.ts:260`, lazy).

## 1. Ключевые роуты
| Path | Component |
|------|-----------|
| `/` (`/dashboard`→`/`) | `DashboardPanel/DashboardPanel.tsx` |
| `/chat`, `/chat-sessions`, `/session-hub` | `ChatPanel`, `ChatSessionsManagerPanel`, `SessionHubPanel` |
| `/debate` | `DebateArena.tsx` (табы `DebatePanel` \| `DebateRuntimePanel`) |
| `/debate-live`, `/debate-replay`, `/debate-tournament`, `/debate-history`, `/debate-analysis`, `/argument-graph`, `/strategy-builder`, `/debates-manager` | `DebateLivePanel`, `DebateReplayPanel`, `TournamentPanel`, `DebateHistoryPage`, `DebateAnalysisPanel`, `ArgumentGraphPanel`, `DebateStrategyBuilder`, `DebatesManagerPanel` |
| `/agents`, `/roles`, `/roles-consortia` | `AgentsPanel`, `RolesPanel`, `RolesConsortiaPanel` |
| `/keys`, `/pools`, `/groups`, `/session-bindings`, `/smart-routing`, `/mcp`, `/connectors` | `ProviderManager`, `PoolStatusPanel`, `GroupsPanel`, `SessionBindingsPanel`, `SmartRoutingPanel`, `MCPPanel`, `ConnectorsPanel` |
| `/fleet`, `/fleet-crews`, `/fleet-councils`, `/fleet-graphs`, `/fleet-persona`, `/fleet-interop`, `/fleet-frontier`, `/governance`, `/provenance` | `FleetPanel`, `FleetPanels/*`, `CouncilPanel`, `GovernancePanel`, `ProvenancePanel` |
| `/settings`, `/logs`, `/debugger`, `/memory`, `/health`, `/scheduler`, `/timeline` | `SettingsPanel`, `LogsPanel`, `TracesPanel`, `MemoryPanel`, `HealthPanel`, `SchedulerPanel`, `EventsTimeline` |
| Алиасы | `/debates/*→/debate-*`, `/events→/timeline`, `/debate-runtime→/debate?mode=runtime` |

## 2. Источники данных и действия (для следующих этапов)
- **DebatePanel** (`DebatePanel.tsx:272`): ЕДИНСТВЕННЫЙ полный старт — `debateService.startDebate(topic, participants, strategy, maxRounds, {debateTemperature, qualitySettings})` + pause/resume/cancel + human args/votes. Сетап: `DebateSetupWizard` (Topic/Agents/Review/StrategySelector).
- **DebateRuntimePanel** (`:296`): `debateService.startTopologyDebate(topology, topic, participants, undefined)` — config=undefined → DEFAULT_CONFIG; `CreateSessionForm` строит topology локально (roundtable edges=[] — расходится с bridge-cycle).
- **DebatesManagerPanel**: только мета (`useDebateSessionStore` create/delete/archive/pause/resume) — `createSession(..., participants=[])` пишет DB-строку БЕЗ runtime.
- **AgentsPanel**: `agentService.spawn/update/toggle/delete/pauseAll/export/import` + `roleService` + `useKeyStore`; создание — `AgentWizard.tsx` (локальный `AgentGenerator`, НЕ `agentWizardService`) + `QuickCreateAgentModal`; редактирование — `AgentDetailPanel` (Config/Capabilities/Infra/Observability/History/Handoffs) → `agentService.updateAgent()`.
- **RolesPanel**: `roleService` CRUD + `RoleEditorModal`, `RoleLibrary` (install), Teams — `TeamWizard` → `teamSvc.createTeam`.
- **ChatPanel**: `useChatStore` (send/create/fork) + `useKeyList`; per-chat `selectedKeys/selectedModel/selectedModelPerKey` → `session.currentProvider/currentModel/currentKeyId`.
- **ProviderManager**: `useKeyStore` (checkHealth/remove/toggle/import/export) + `keyService.getRoutingPolicy/setSLA`.
- **CouncilPanel**: `useCouncilStore` + `councilService.create/get/advance/conclude/submitFact` → Dexie. **FleetPanel**: мега-табы (crew/council/graph/persona/ops/…), действия напрямую в сервисы.
- **SettingsPanel**: `settingsService.get/subscribe/update/reset` — сюда ляжет глобальный дефолт key+model (T2).
- **SessionBindingsPanel**: `sessionAffinityStore+keyStateStore`, только monitor.

## 3. Dead / дубли (не трогать до отдельных решений)
- 4 создания дебатов: `DebateSetupWizard` (полный) vs `CreateSessionForm` (без config) vs `DebatesManagerPanel +New` (только DB) vs `DebateWorkspace.createRoom` — разные сторы.
- 3 истории дебатов: `DebateHistory*` (sessionManager) vs `DebatesManagerPanel` (useDebateSessionStore) vs `DebateReplayPanel` (debateEngine).
- `FleetPanel` (all-in-one) дублирует `FleetPanels/*`; `CouncilsPanel.tsx` — orphan (роут ведёт в `CouncilPanel`).
- `SimulationPanel` — нет в `PANEL_COMPONENTS` → unrouted/dead.
- `SchedulerPanel` — сам заявлен как preview, к `SchedulerService` не подключён.
- 3 менеджера чат-сессий (`ChatSidebar`, `ChatSessionsManagerPanel`, `SessionHubPanel`) на одном `useChatStore`.
- `agentWizardService` (DI) не используется UI — UI ходит в локальный `AgentGenerator`.

## 4. Привязка к роадмапу
- T1.2 (панель ротации): строить рядом с `ProviderManager`/`SessionBindingsPanel`; данные — `keyService`, `adapterRegistry.getProviderRuntimeStatus()`, `keyStateStore`; настройки — settings/config.
- T1.3/T1.4 (привязка агента): править `AgentWizard` + `QuickCreateAgentModal` + `AgentDetailPanel` (переключатель Ротация/Фикс + селекты из `useKeyList` + `key-models`).
- T2 (чаты): `ChatPanel/ChatInputArea` уже гоняют per-chat targets — добавить селект модели + глобальный дефолт в `SettingsPanel`.
- T3.1 (RU-сиды): снять заглушки `RoleLibrary`, `PersonaPickerPanel`, `debate-archetypes`, `debate-historical-figures`, `role-team-service`, `unified-role-service` (все сейчас пустые fallback).
- T3.2 (карточка агента): новая вьюха рядом с `AgentDetailPanel` — профиль + действия (тест/дубль/в дебаты).

**STOP — T0 done. Дальше T1.1 (docs/ROTATION.md).**
