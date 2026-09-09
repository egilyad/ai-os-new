# 09_UI_UX — Current Agent UI & Agent-Specific Improvements for `agent-data`

## Current UI surface (VERIFIED)

`src/components/AgentsPanel/` contains: `AgentsPanelView`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar`, `AgentStatsDashboard`, `AgentObservabilityTab`, `AgentComparison`, `AgentGroupsSection`, `AgentPolicySection`, `AgentHandoffsTab`, `AgentCapabilitiesTab`, `AgentConfigTab`, `AgentHistoryTab`, `AgentInfraTab`, `sidebar-tabs`, `EloLeaderboard`, `LiveActivityStream`, `agent-templates`.

Cross-consumers: `DebateAnalytics`, `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`, `ForumPanel/AuthorBadge`, `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel`, `RoomPanel`, `AgentJournalPanel`.

## What `agent-data` gets for free (VERIFIED)

- `AgentCard` shows avatar (🔬, from node.config.avatar), name (Sam Okafor via node label/displayName), role.
- `AgentDetailPanel` shows specializations (from `resolveAgentIdentity`, agent-identity.ts:135), model/provider, stats.
- `AgentStatsDashboard` renders `getStats('agent-data')`.
- `AgentObservabilityTab` shows health/lifecycle.
- `AuthorBadge` (Forum) renders Sam via identity resolver.

## Agent-specific UX problems (VERIFIED)

1. **Journal shows `agent-data`, not "Sam Okafor"** — `agent-journal-service.ts:135,161` stores `agentName: e.nodeId`.
2. **No memory/activity view scoped to Sam** — `AgentDetailPanel` has no "Memory" or "Recent cognitive steps" tab (only generic stats/observability/config).
3. **Specializations are display-only** — they never drive any UI affordance (no "ask Sam about Statistics" button).
4. **Lens chip absent** — `agent-data.lensIds` is `[]`, so no lens badge (unlike agents that would have one).
5. **Avatar fallback mismatch risk** — `AgentAvatar.tsx:47 getAgentAvatar` is hash-based; only shows 🔬 when an explicit `emoji` prop is passed from resolved identity. If any consumer forgets to pass `emoji`, Sam renders as a generic glyph (inconsistent with the curated 🔬).

## Agent-specific UX improvements (OPINION)

1. Add **"Ask Sam" quick actions** in `AgentDetailPanel` derived from specializations (ML / Statistics / Forecasting) → opens RoomPanel invocation pre-targeted to `agent-data` with mode `chat`. Pure UI (reuses Invocation).
2. Add **Memory tab** querying `memoryOrchestrator.query({agentId:'agent-data'})` (reuse existing API).
3. Add **Live cognitive timeline** tab subscribing to `COGNITIVE_STEP_COMPLETED` filtered by nodeId (reuse `LiveActivityStream`).
4. Show **debate persona predictions** — given a topic, preview which `PersonaSelector` variant Sam would get (proves specialization→persona gap visually).
5. Fix journal + avatar display-name wiring to `displayName`.
