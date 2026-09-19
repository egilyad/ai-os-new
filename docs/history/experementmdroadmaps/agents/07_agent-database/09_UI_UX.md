# 09_UI_UX — Current agent UI & agent-specific UX improvements

## Current UI surface (VERIFIED)

- `AgentsPanel/` provides: `AgentCard` (name/avatar/role), `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar`, `AgentStatsDashboard`, `AgentObservabilityTab`, `AgentHistoryTab`, `AgentConfigTab`, `AgentCapabilitiesTab`, `AgentGroupsSection`, `AgentPolicySection`, `AgentHandoffsTab`, `AgentInfraTab`, `AgentComparison`, `EloLeaderboard`, `LiveActivityStream`, `AgentsPanelContainer`, `AgentsPanelView`, `sidebar-tabs`.
- `agent-database` is rendered wherever an agent id is shown: DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel (per AGENTS.md).
- `RoomPanel` (Invocation) lists Priya Nair in the agent picker (`agentService.getAgents()`).

## What the UI shows vs hides (VERIFIED / INFERRED)

- **Shows:** avatar 🧩/#06b6d4, name "Priya Nair", role "Database Engineer", stats (calls/tokens/latency/cost), lifecycle, journal history, group membership.
- **Hides:** the DB system prompt (UI-HIDDEN, `02_CAPABILITIES`), the `specializations` except in detail/identity editor, the fact that `sql_executor`/`data_analysis` are NOT real tools (the UI implies capability via the `tools` field), and that the agent has no lens.

## Agent-specific UX improvements (OPINION)

1. **Specialization chips on the card.** Render `SQL Tuning / Replication / Data Modeling` as visible badges on `AgentCard` (data already on `ResolvedAgent.specializations`). Reuses `AgentIdentityView.specializations`.
2. **Honest capability indicator.** If `tools` lists `sql_executor` but no real tool is registered, show a "tool unavailable" hint instead of implying execution. Low effort, prevents user confusion.
3. **DB activity feed.** Reuse `LiveActivityStream.tsx` filtered to `nodeId==='agent-database'` inside `AgentObservabilityTab`.
4. **"Invoke Priya" shortcut.** Add a one-click Room invocation button on the DB agent's detail panel (reuses `invocationEngine.invoke` + `RoomPanel` navigation).
5. **Specialization-tagged stats.** In `AgentStatsDashboard`, bucket the agent's steps by detected specialization (SQL/Replication/Data Modeling) using step content — display-only.
6. **Schema/query input box in Room.** For `agent-database`, the Room task field could accept a SQL snippet with syntax highlighting (reuse `WorkspacePanel` SQL language list at `WorkspacePanel.tsx:80`).
