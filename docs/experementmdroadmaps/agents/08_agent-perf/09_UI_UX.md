# 09_UI_UX — Current agent UI & `agent-perf`-specific improvements

## Current UI surfaces `[VERIFIED]`

`src/components/AgentsPanel/` (28 files) is the agent hub:

- `AgentsPanelView.tsx` — grid/list of `AgentCard`, search, status filter, groups, templates, wizard, stats dashboard, Elo leaderboard, live activity stream.
- `AgentCard.tsx` — avatar (profile emoji/color), name, role, **specializations** (`:68-78`), tool tags, stats (invocations/success/latency/errors), provider/model.
- `AgentDetailPanel.tsx` — full detail/edit.
- `AgentStatsDashboard.tsx`, `EloLeaderboard.tsx`, `LiveActivityStream.tsx`, `AgentObservabilityTab.tsx`, `AgentHistoryTab.tsx`, `AgentCapabilitiesTab.tsx`, `AgentConfigTab.tsx`, `AgentComparison.tsx`, `AgentGroupsSection.tsx`, `AgentHandoffsTab.tsx`, `AgentInfraTab.tsx`, `AgentPolicySection.tsx`, `AgentIdentityEditor.tsx`, `AgentWizard.tsx`.

`agent-perf` also renders in `DebateRuntimePanel/AgentControlPanel`, `DirectorPanel/AgentIdentityChip`, `ForumPanel/AuthorBadge`, `DashboardPanel/AgentLiveBoard` (per AGENTS.md). `[INFERRED]`

## How `agent-perf` looks today `[VERIFIED]`

- Card shows 🚀 `#f97316`, "Leon Ortiz", "Performance Engineer", specializations `Profiling · Caching · Load Testing`, tools `benchmark`/`profiler` (cosmetic — see `10_PROBLEMS`), provider `groq` · `llama-3.3-70b-versatile`.
- Stats reflect **only ConversationCore activity** (debate invisible).

## `agent-perf`-specific UX improvements `[OPINION]`

1. **Perf capability badge** — a "Performance" tag on the card derived from `specializations` so users can filter "all perf-capable agents" (reuse existing search/filter UI; no new component).
2. **Honest tool state** — if `benchmark`/`profiler` are non-functional, show them as "declared (no tool)" instead of implying capability. Small `AgentCard` change.
3. **Debate visibility fix in UI** — once `COGNITIVE_STEP_COMPLETED` is emitted from debate (see `07`), the existing `LiveActivityStream` + stats will light up; no new UI needed.
4. **Perf history view** — a tab/filter in `AgentHistoryTab` showing `listByTag('performance')` (tag added at journal-record time).
5. **Quick "Profile this" action** — add a context action on the `agent-perf` card that opens Room with `agent-perf` pre-selected and mode=chat (reuses `RoomPanel` + `AgentResolverDirectory`). One-button perf invocation.

## Anti-patterns to avoid `[OPINION]`

Do **not** build a separate "Performance Agent Panel" — the capability is fully expressed through the existing AgentsPanel + Room + Director. A 26th panel would violate the "no 25 mini-frameworks" warning (see `15_DO_NOT_BUILD_YET.md`).
