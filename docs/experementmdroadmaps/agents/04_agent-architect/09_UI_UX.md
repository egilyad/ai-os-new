# 09 — UI / UX: `agent-architect`

## CURRENT AGENT UI (VERIFIED)

The architect is rendered by the **generic** AgentsPanel machinery (no architect-specific screen):

- `AgentsPanelView.tsx`, `AgentCard.tsx` (avatar 🏗️, name "System Architect", role, status, stats).
- `AgentDetailPanel.tsx` — full identity/stats.
- `AgentIdentityEditor.tsx` — edit persona/prompt/model/temperature/tools (writes topology node).
- `AgentStatsDashboard.tsx`, `AgentObservabilityTab.tsx`, `LiveActivityStream.tsx`, `EloLeaderboard.tsx`.
- `AgentJournalPanel.tsx` — generic journal (not architect-filtered by default).
- Surfaced as an identity chip in `DirectorPanel`, `DebateRuntimePanel/AgentControlPanel`, `ForumPanel/AuthorBadge`, `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`.
- Invocation entry: **RoomPanel** agent picker lists it (`phase21-invocation.ts:44` → `agentService.getAgents()`).

## AGENT-SPECIFIC UX GAPS

1. **No "Architecture" tab.** Every other cognitive module (Lenses, Crystals, Junction, Synthesis, Generator, Forum, Builder) has a dedicated panel; the architect has none, yet there is a separate `ArchitectureReview` panel that does NOT use it (confusing — see 10).
2. **Journal not agent-filtered.** `AgentJournalPanel` shows all agents; no one-click "show only Marcus Hale's design decisions".
3. **No trade-off visualization.** The architect outputs monolith/microservices/serverless reasoning as plain text; no structured trade-off matrix UI.
4. **Persona invisible in debate.** The actual (generic) persona variant assigned by `PersonaSelector` is not shown next to the architect in `DebateRuntimePanel`.
5. **No "invoke architect" shortcut.** RoomPanel requires manual picking; no contextual "Review architecture" quick action from the `ArchitectureReview` panel or a code view.

## AGENT-SPECIFIC UX IMPROVEMENTS (recommended, reuse-first)

- **Architect quick-action** in `ArchitectureReview.tsx`: a button "Ask System Architect" → opens RoomPanel pre-filled with `target=agent-architect`, mode `chat`, task seeded from the scan findings. Reuses Invocation Engine + RoomPanel.
- **Journal filter chip** in `AgentJournalPanel`: `?agent=agent-architect` deep-link / filter control.
- **Trade-off card** component (reuse `SynthesisZonesView` styling) to render architect conclusions.
- **Persona badge** in `DebateRuntimePanel/AgentControlPanel` showing the resolved `PersonaSelector` variant per agent.
