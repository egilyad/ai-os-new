# 09 — UI / UX

> Current agent UI and agent-pm-specific UX improvements. Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## Current UI surface for `agent-pm` (VERIFIED)

`agent-pm` is rendered through **generic, shared** components — there is no PM-specific screen:

- **`AgentsPanel`** (`src/components/AgentsPanel/`): `AgentsPanelView` list → `AgentCard` (avatar 🧩 + "Dana Whitfield / Project Manager" + engine line + stats) → `AgentDetailPanel` (system prompt, provider/model, specializations as tags) → `AgentIdentityEditor` (can override per-node identity) → `AgentStatsDashboard` / `EloLeaderboard` / `LiveActivityStream` / `AgentHistoryTab` (journal) / `AgentGroupsSection` / `AgentConfigTab` (lifecycle) / `AgentCapabilitiesTab` / `AgentObservabilityTab` / `AgentHandoffsTab` / `AgentInfraTab` / `AgentPolicySection` / `AgentComparison`.
- **`AgentAvatar.tsx:47` `getAgentAvatar`** — **VERIFIED correction:** avatar is a **deterministic hash** of the id (emoji+color from fixed arrays), **NOT** read from `AGENT_PROFILES`. So the 🧩/`#3b82f6` shown for `agent-pm` actually comes from `resolveAgentIdentity` → node `config.avatar` (set by `normalizeAgentIdentity` from the profile, `topology-defaults.ts:103`). The shared-context claim "AgentAvatar reads AGENT_PROFILES" is **false** for this component; the profile reaches the UI via `agent-identity.ts`, not `AgentAvatar.tsx`.
- **Consumers elsewhere:** `DirectorPanel/AgentIdentityChip`, `ForumPanel/AuthorBadge`, `DebateRuntimePanel/AgentControlPanel`, `DashboardPanel/AgentLiveBoard`, `AgentComparisonPanel`, `DebateAnalytics` — all generic.

## What the user can actually _do_ with `agent-pm` in UI today (VERIFIED)

- Browse/inspect it in `AgentsPanel`; edit its identity (overrides node config); pause/resume/restart; view stats/elo/history; add it to a group; compare it.
- Invoke it from `RoomPanel` (pick Dana → Where/Mode/Task).
- Place it in a Director scenario (via `ScenarioEditor`) or a debate (via debate setup).

## agent-pm-specific UX improvements (OPINION)

1. **PM "quick actions" in `RoomPanel`** — chips: _Plan_, _Risk assess_, _Retro_ that pre-fill Task + Mode=Scenario. Reuses picker; no engine change. (See `11` Q3.)
2. **Specialization chips that _do_ something** — today `Planning/Agile/Risk` are dead tags (`02_CAPABILITIES.md` row 5). Make them clickable filters: clicking "Risk" suggests invoking `agent-pm` + `agent-risk` together, or loads a risk-assessment scenario template.
3. **"Management" group visibility** — `agent-pm` is in the `Management` audit group (`prompt-audit-service.ts:18`) but the UI never shows this. Show a small "Audited · Management" badge on `AgentCard`/`AgentDetailPanel` to explain why a tool-less PM is still audited.
4. **PM decision timeline** — in `AgentHistoryTab`/`LiveActivityStream`, badge `agent-pm` entries that contain plan/risk language (reuses `COGNITIVE_STEP_COMPLETED`, `07_COGNITIVE_ROLE.md`).
5. **"Open last plan" shortcut** — if `agent-pm` produced a Director session, surface an "Open plan session" deep-link on its card (mirrors RoomPanel Open Session, `AGENTS.md` Step 6 history).
6. **Facilitator scenario template** — a one-click "Run PM facilitation" card in `DirectorPanel`/`RoomPanel` that loads a curated `agent-pm`-as-facilitator scenario (see `04`/`05`).

## Anti-patterns to avoid (OPINION)

- Do **not** build a separate `ProjectManagerPanel`. The shared `AgentsPanel` + `RoomPanel` + `DirectorPanel` already cover it. A bespoke panel would violate the "no 25 mini-frameworks" warning (`15_DO_NOT_BUILD_YET.md`).
- Do **not** special-case `AgentAvatar.tsx` to read profiles — the identity already flows correctly via `agent-identity.ts`; the hash fallback is intentional for unknown ids.
