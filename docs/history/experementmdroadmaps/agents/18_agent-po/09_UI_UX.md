# 09 — UI / UX

> VERIFIED unless marked.

## Current agent UI (VERIFIED)

`AgentsPanel` is the hub. Relevant surfaces (all generic over `agentService`):

- `AgentCard.tsx` — name, role, **specializations** (`AgentCard.tsx:68-78`), success rate, latency, pause/play (`:82`). Avatar from `resolveAgentIdentity` (`:23,56-63`).
- `AgentsPanelView.tsx` — grid/list, search, tabs, wizard, groups.
- `AgentDetailPanel.tsx`, `AgentIdentityEditor.tsx` — edit name/role/specializations/prompt/avatar.
- `AgentStatsDashboard.tsx`, `EloLeaderboard.tsx`, `LiveActivityStream.tsx`, `AgentComparison.tsx`, `AgentGroupsSection.tsx`, `AgentHistoryTab.tsx`, `AgentCapabilitiesTab.tsx`, `AgentObservabilityTab.tsx`, `AgentHandoffsTab.tsx`, `AgentInfraTab.tsx`, `AgentPolicySection.tsx`, `AgentConfigTab.tsx`.
- `AgentAvatar.tsx:47` `getAgentAvatar` is a **hash-based** generator (emoji/color from id hash) — **NOT** reading `AGENT_PROFILES` despite AGENTS.md claim. The curated 🎯/#8b5cf6 only reaches UI via `resolveAgentIdentity` (`agent-identity.ts:102-114`) → `AgentAvatar` `emoji`/`color` props (`AgentCard.tsx:60-61`). (VERIFIED discrepancy vs SHARED CONTEXT.)

## Where `agent-po` appears (VERIFIED)

DirectorPanel `AgentIdentityChip` (`:25`: `baseRole · specializations[0]`), Forum `AuthorBadge`, Debate `AgentControlPanel`/`DebateAnalytics`, Dashboard `AgentLiveBoard`, `AgentComparisonPanel`, RoomPanel picker.

## Agent-specific UX improvements (OPINION)

1. **PO "capabilities" tab content** — `AgentCapabilitiesTab` is generic; add a PO-specific section showing its 3 specializations as actionable chips (click → invoke RoomPanel with prefilled task). Reuses invocation path.
2. **Specialization-driven avatar/label** — today specializations are just text (`AgentCard.tsx:77`). Add a "Backlog / Vision / Prioritization" badge row with icons.
3. **PO quick-invoke button** on `AgentCard` (e.g. "Groom backlog") → RoomPanel prefilled. Pure UI, reuses `06`.
4. **PO activity filter** in `LiveActivityStream` — already possible via `nodeId` filter (`07`).
5. **Fix avatar source doc/behavior** — ensure curated avatar always wins (currently `getAgentAvatar` hash can diverge for agents without `cfg.avatar`). Low priority.

## Risk

UI-only; no contract changes. Low risk except #5 (verify `resolveAgentIdentity` avatar precedence, `agent-identity.ts:102-114`).
