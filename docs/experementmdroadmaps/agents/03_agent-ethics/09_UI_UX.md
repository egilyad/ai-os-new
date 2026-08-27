# 09 — UI / UX: `agent-ethics`

## Current surface (VERIFIED)

- **AgentsPanel**: `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar` (🛡️/`#a855f7` via `resolveAgentIdentity`→`AgentAvatarService`, not the deterministic fallback in `AgentAvatar.tsx:47`). Tabs: `AgentStatsDashboard`, `AgentObservabilityTab`, `AgentHistoryTab`, `AgentConfigTab`, `AgentCapabilitiesTab`, `AgentGroupsSection`, `AgentPolicySection`, `AgentHandoffsTab`, `AgentInfraTab`, `EloLeaderboard`, `LiveActivityStream`, `AgentComparison`. (glob `src/components/AgentsPanel/`)
- **Cross-panel appearances**: DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel. (AGENTS.md)
- **RoomPanel**: human-pickable by display name "Elena Marchetti — Ethics Officer". (AGENTS.md Step 6 rework)
- **PromptAuditPanel**: shows her prompt grouped as `Analytical` with a quality score + "No tools assigned" suggestion (`prompt-audit-service.ts:29,192`).

## Problems specific to her UX (VERIFIED/INFERRED)

1. **No ethics affordance**: nowhere does the UI signal "this is the Ethics Officer — invoke for review". She is visually identical to any other card.
2. **Journal shows nodeId, not name** (see 08) — confusing in `AgentJournalPanel`/`AgentHistoryTab`.
3. **No preset scenario/invocation**: a user wanting an ethics review must hand-build it; no one-click "Ethics Review" button exists in Room or Director.
4. **Prompt-audit flags "no tools"** though an ethics officer arguably needs none — minor noise.
5. **Debate participation invisible** in `LiveActivityStream` (no cognitive events from debate) — her debate turns don't show as "cognitive steps".

## Agent-specific UX improvements (OPINION)

- **QW**: an "Ethics Review" quick-action chip on her `AgentCard` that opens Room in chat mode pre-targeted to her with a review instruction template.
- **QW**: render her journal/history entries with display name + 🛡️ + `ethics` tag.
- **QW**: in Debate participant picker, show a "⚖️ Ethics audit" badge/auto-suggestion when topic matches ethics keywords (reuse `persona-selector.ts` keyword sets).
- **MEDIUM**: a dedicated "Ethics" filter in `AgentJournalPanel`/`LiveActivityStream`.
- **MEDIUM**: preset "Ethics Review" scenario in Director Library (see 05) with a one-click launch from her card.
- **MEDIUM**: surface her structured verdicts (risks/alternatives) as a readable card rather than raw text.
