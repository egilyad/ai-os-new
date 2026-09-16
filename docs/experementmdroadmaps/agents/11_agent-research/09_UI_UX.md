# 09 — UI / UX

## Current agent UI (VERIFIED)

`agent-research` is rendered through the **generic** AgentsPanel stack (no agent-specific component):

- `AgentsPanelContainer.tsx:43-49` builds the agent list via `resolveAgentIdentity`.
- `AgentCard.tsx:23` shows identity + status.
- `AgentDetailPanel.tsx:19` shows identity, policy (`AgentPolicySection.tsx:4`), history/version (`AgentHistoryTab.tsx:7-74`).
- `AgentIdentityEditor.tsx:70` lets a user edit name/role/prompt (the research prompt is editable here).
- `AgentAvatar.tsx:47` `getAgentAvatar` reads `AGENT_PROFILES` → 🧪 / `#6366f1`.
- `EloLeaderboard.tsx:153`, `LiveActivityStream.tsx:68` — generic identity resolution.
- `AgentGroupsSection.tsx:145` — can add it to a group.
- Consumed elsewhere: `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel`, `ForumPanel/AuthorBadge`, `AgentComparisonPanel`, `DashboardPanel/AgentLiveBoard`, `DebateAnalytics`, `RoomPanel` (invoke picker).

## What the UI shows vs hides

- **Shows:** avatar, name, role, status, stats, journal, version history, policy, groups.
- **Hides / missing for this agent specifically:**
  - No indication of its **specializations** (Literature Review/Synthesis/Citations) anywhere prominent — `resolveAgentIdentity` returns `specializations` (`agent-identity.ts:135`) but the card/detail may not surface them distinctly (INFERRED; specialize the detail view).
  - No **lens badge** (it has none — `topology-defaults.ts:106`).
  - No **research-specific panel** (citations, sources, literature map) — none exists.
  - No **cognitive timeline** specific to it (only generic live stream).
  - No **"Research" quick-action** in RoomPanel beyond generic Chat/Debate/Scenario.

## Agent-specific UX improvement ideas

1. **Specialization chips** on `AgentCard`/`AgentDetailPanel` (reuse `identity.specializations`).
2. **"Research brief" action** in `AgentDetailPanel` → opens RoomPanel pre-filled with Mode=Chat, Target=agent-research, Task="Produce a cited literature review on …".
3. **Lens attach control** in `AgentIdentityEditor` to bind `lens:critical`/`meta-uncertainty` (writes `lensIds` to node config — already supported by `resolveAgent`/`agent-identity`).
4. **Per-agent cognitive timeline** tab in `AgentDetailPanel` reusing `LiveActivityStream`.
5. **Citations/sources renderer** if/when a research output schema exists (see 11/12).

All are UI-only; the data layers (`resolveAgentIdentity`, `AgentJournalService`, `agentService`) already exist.
