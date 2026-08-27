# 09_UI_UX — Current Agent UI & lead-specific improvements

> Tags VERIFIED / INFERRED / OPINION. All UI paths in `src/components/AgentsPanel/`.

## Current agent UI (VERIFIED)

- **AgentsPanelView** — grid/list of `AgentCard` for all 25 agents (`AgentsPanelView.tsx`).
- **AgentCard** (`AgentCard.tsx`): avatar (⚡/#f59e0b via `resolveAgentIdentity`, `:23,60-62`), name, role, specializations line (`:68-78`), tool tags, stats (invocations/success/errors/latency, `:120-160`), provider/model (`:162-169`), pause/resume (`:82-101`).
- **AgentDetailPanel** tabs: Config, Capabilities, Observability, History, Handoffs, Policy, Groups, Infra, Comparison (`*Tab.tsx`, `AgentDetailPanelProps`).
- **AgentIdentityEditor** — edit displayName/role/specializations/avatar/prompt/model.
- **AgentWizard** — create new agents.
- **AgentGroupsSection** — create/run groups with patterns parallel/sequential/consensus/pipeline/debate (`AgentGroupsSection.tsx:11-17,23`).
- **AgentStatsDashboard / EloLeaderboard / LiveActivityStream / AgentComparison** — analytics.
- Embedded: DebateAnalytics, DashboardPanel/AgentLiveBoard, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel, ForumPanel/AuthorBadge, RoomPanel (AGENTS.md).

## lead-specific UX gaps (VERIFIED / OPINION)

1. **Specializations are read-only decoration.** `AgentCard.tsx:68-78` shows them; nothing lets the user _act_ on them (e.g., "assign as coordinator"). → Add a "Make coordinator" action on the lead's detail panel that creates a group / DebateSync with agent-lead as synthesizer seed.
2. **No "lead console".** There is no panel that shows agent-lead's coordination view: active debates it moderates, scenarios it coordinates, handoffs it issued. → Reuse `AgentHandoffsTab` + `AgentGroupsSection` into a "Coordination" tab.
3. **Prompt hidden in card.** The team-lead prompt is only editable, not summarized, on the card. → Show a one-line "I mentor, unblock, and ensure quality" subtitle (already partly covered by specializations line).
4. **Observability doesn't flag lead steps.** `AgentObservabilityTab` shows raw steps; a `metadata.role:'coordinator'` (07) would let it filter "lead actions" — UI-only filter addition.
5. **Room picker shows lead as a peer.** Good — but no hint that agent-lead is the _coordination_ agent. → Badge "Coordinator" next to Victor Soto in RoomPanel agent picker (reuse `specializations`).

## Recommended agent-specific UX (OPINION)

- Add an **"Agent role semantic" badge** derived from `specializations` (Mentoring/Coordination/Architecture → "Coordinator" badge) shown in AgentCard, RoomPanel picker, and DirectorPanel chip. Pure display, reads existing data.
- Add a **Coordination tab** in AgentDetailPanel aggregating: groups where it is leader, debates where it was synthesizer, handoffs issued, journal entries tagged `coordinator`. Composes existing services (`agentService.getGroups`, `taskHandoffService`, `agentJournalService.listByAgent`).

## Risk / Dependencies

- Display-only; lowest risk. Coordination tab composes existing read APIs. No new events/storage.
