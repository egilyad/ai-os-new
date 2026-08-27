# 09_UI_UX — `agent-doc-architect`

> How the agent is presented and controlled in the UI. **VERIFIED** by file listing + integration.

## Primary surface: AgentsPanel (VERIFIED — `src/components/AgentsPanel/`)

doc-architect is rendered through the **generic** agent UI, same as all 25 agents:

- `AgentsPanelView.tsx` — container/tabs.
- `AgentCard.tsx` — shows avatar (🏛️ `#a855f7`), name "Bianca Conti", role.
- `AgentDetailPanel.tsx` — full identity + stats.
- `AgentIdentityEditor.tsx` — edit displayName/role/specializations/avatar (writes back via `agentService.updateAgent`).
- `AgentWizard.tsx` — create/spawn (generic).
- `AgentAvatar.tsx` — deterministic/emoji avatar.
- `AgentStatsDashboard.tsx`, `EloLeaderboard.tsx`, `LiveActivityStream.tsx`, `AgentObservabilityTab.tsx`, `AgentHistoryTab.tsx`, `AgentGroupsSection.tsx`, `AgentCapabilitiesTab.tsx`, `AgentConfigTab.tsx`, `AgentHandoffsTab.tsx`, `AgentInfraTab.tsx`, `AgentPolicySection.tsx`, `AgentComparison.tsx` — all generic, nodeId-driven.

Because identity resolves via `agent-identity.ts` + `agentService`, doc-architect appears with its curated emoji/color/model/specializations automatically.

## Secondary surface: RoomPanel (VERIFIED — `src/components/RoomPanel/`)

- `RoomPanel.tsx` — agent `<select>` populated from `agentService.getAgents()`; doc-architect listed as "Bianca Conti — Documentation Architect". Human selects it, picks Where/Mode/Task, clicks Invoke.
- `RoomPanel.test.tsx`, `room-invocation-e2e.integration.test.tsx` — E2E proves any registered agent (incl. doc-architect) reaches `done`.

## Tertiary: AgentJournalPanel (VERIFIED — `src/components/AgentJournalPanel/`)

- `journal-constants.ts` imports `JournalEntry` from `agent-journal-service`. doc-architect's journal entries (from `COGNITIVE_STEP_*` events) render here generically.

## DocumentationPanel — NOT agent-related (VERIFIED)

- `src/components/DocumentationPanel/` (route `docs`) is a **product documentation viewer**, unrelated to `agent-doc-architect`. Do not conflate. (Grep `Documentation` in `route-imports.ts:195`, `nav.ts:87`.)

## Agent-group / coordination UI — ABSENT (VERIFIED)

- `AgentGroupsSection.tsx` exists, but doc-architect is **not** a member of any seeded group (no group seeds the doc cluster — `agent-service.ts` groups load from `GROUPS_KEY`, empty at seed). So no "Documentation Squad" UI exists.

## UX assessment (OPINION)

The agent is **well-presented but isolated**. A user can see Bianca, her stats, her journal, and invoke her — but there is no UI that surfaces her _specializations_ as actionable ("Generate doc architecture", "Audit taxonomy"). Her doc siblings are not shown together. The identity is richer than the affordances.
