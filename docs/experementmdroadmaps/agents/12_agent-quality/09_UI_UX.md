# 09_UI_UX — current agent UI for `agent-quality`

## Where it appears (VERIFIED)

- **AgentsPanel** (`src/components/AgentsPanel/`): `AgentsPanelView`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar` (`AgentAvatar.tsx:47` reads `AGENT_PROFILES` → 🎯 `#10b981`), `AgentStatsDashboard`, `AgentObservabilityTab`, `AgentHistoryTab`, `AgentGroupsSection`, `EloLeaderboard`, `AgentComparison`, `LiveActivityStream`.
- Reused in: `DebateAnalytics`, `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`, `ForumPanel/AuthorBadge`, `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel` (per AGENTS.md).
- Invocation: `RoomPanel` agent `<select>` (built from `agentService.getAgents()`).

## What the UI shows for `agent-quality` today (INFERRED)

- Avatar 🎯, name "Noah Ferreira", role "Quality Engineer", provider groq, profile model `llama-3.1-8b-instant`.
- Stats (calls/tokens/latency/errors/cost) from `COGNITIVE_STEP_COMPLETED`.
- Journal history (raw id `agent-quality` as name — see 08/11 QW).
- Health/lifecycle state.

## Agent-specific UX improvements (RECOMMENDED, mostly UI-only)

1. **QA capability badge:** show specializations `Test Automation / QA / Coverage` prominently on `AgentCard` (data already in `resolveAgent.specializations` — `agent-service.ts:385`). UI-HIDDEN today.
2. **"Review with QA" quick action:** on artifact/debate/conversation views, a button that opens RoomPanel pre-targeted to `agent-quality` (reuses invocation; UI-only).
3. **Human-readable journal name:** resolve `agentName` via `resolveAgentIdentity` in `AgentHistoryTab` (writer fix in 11 QW).
4. **QA verdict chips:** when `agent-quality` emits a quality gate/verdict (display event from 07), render a pass/fail chip in `LiveActivityStream` and `DirectorPanel`.
5. **Coverage lens hint:** since no QA lens exists, show a "no lens" note or suggest `lens:critical` as the closest analytical lens on the detail panel.
6. **Model honesty:** UI currently shows profile model `llama-3.1-8b-instant`, but runtime uses `'auto'` (topology node). Show "auto (routed)" badge to avoid misleading the user (see 10).

## Avoid over-engineering

- No new dedicated "QA Panel" until the backend QA behaviour exists. Reuse `AgentDetailPanel` + RoomPanel.
