# 09_UI_UX — current agent UI for `agent-risk`

## Surfaces (VERIFIED — src/components/AgentsPanel/*)

- **AgentCard.tsx** — name, role, avatar, status, key stats. Primary grid card.
- **AgentDetailPanel.tsx** — full profile: identity, config, stats, tabs.
- **AgentAvatar.tsx** — `getAgentAvatar(id)` is **hash-based** (AgentAvatar.tsx:47); emoji/color derived from id, NOT from `AGENT_PROFILES`. So in raw avatar contexts agent-risk may show a non-📊 glyph. `AgentIdentityView` (agent-identity.ts) carries the curated 📊/#ef4444 via `agentAvatarService` for richer surfaces.
- **AgentStatsDashboard.tsx** — calls/tokens/latency/cost/errors.
- **EloLeaderboard.tsx** — debate ranking.
- **LiveActivityStream.tsx** — recent activity (from stats/lifecycle, not cognitive stream directly).
- **AgentObservabilityTab.tsx** — health/lifecycle/metrics.
- **AgentHistoryTab.tsx** — historical runs.
- **AgentIdentityEditor.tsx / AgentConfigTab.tsx** — edit prompt, model, temperature, tools, specializations.
- **AgentGroupsSection.tsx** — team membership.
- **AgentComparison.tsx** — compare agents.

## Other surfaces (VERIFIED)

- DebateRuntimePanel, DirectorPanel (`AgentIdentityChip`), ForumPanel (`AuthorBadge`), Dashboard (`AgentLiveBoard`), RoomPanel (invocation picker + cards), AgentJournalPanel.

## Current agent-specific UX (VERIFIED + INFERRED)

- The card shows the agent as a generic analytic agent; **specializations (Risk Modeling/Monte Carlo/Compliance) are not prominently surfaced** in AgentCard (UI-HIDDEN per 02). The risk prompt is visible only in the editor, not the card.
- No risk-specific widget: no risk score gauge, no "last risk review" summary, no compliance checklist view.
- Avatar inconsistency (hash vs profile) is a real, minor UX bug worth fixing.

## Recommended agent-specific UX improvements (OPINION — see 11/13)

1. **Specialization chips on AgentCard** — render `specializations` from `AGENT_PROFILES`/`resolveAgent` as badges (reuse AgentIdentityView.specializations).
2. **Curated avatar everywhere** — ensure `AgentAvatar` prefers `AGENT_PROFILES` emoji/color (or `AgentIdentityView.avatar`) so 📊/#ef4444 is consistent; fix the hash fallback to consult the profile first.
3. **Risk summary widget in AgentDetailPanel** — "Last risk assessment", "Open risk items", "Compliance coverage" sourced from memory/journal (08) + cognitive decisions (07).
4. **Invocation hint** — in RoomPanel picker, show agent-risk's specializations as placeholder Task suggestions ("Score risk of…", "Monte-Carlo…", "Audit compliance of…").
5. **Decision badge** — colored risk badge from `cognitive:decision:made` (07).

## Effort / risk (OPINION)

- All improvements are UI-only, reusing `AgentIdentityView`, memory/journal, cognitive events. Low effort, low risk. No backend agent changes required for 1–2; 3–5 need the memory/decision wiring from 07/08.
