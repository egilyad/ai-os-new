# 09 — UI / UX for `agent-content`

> Current agent UI and agent-specific UX improvements. VERIFIED components in src/components/AgentsPanel/* and consumers.

## Current UI surface (VERIFIED)

`agent-content` appears in every generic agent UI as one of 25 agents:

- **AgentsPanelView / AgentCard** — lists Lena with avatar, role, status.
- **AgentDetailPanel** — shows model (llama-3.3-70b), provider, stats, lifecycle controls.
- **AgentIdentityEditor** — can edit her prompt/name/role (writes back to topology node).
- **AgentWizard** — can clone/create agents (generic).
- **AgentAvatar** — ⚠️ renders a **deterministic glyph from id hash**, NOT her curated 📝 (AgentAvatar.tsx:47-54). So in any component using plain `<AgentAvatar agentId="agent-content" />`, she shows a generic emoji, not 📝.
- **AgentStatsDashboard / EloLeaderboard** — ranks her by calls/tokens.
- **AgentObservabilityTab / LiveActivityStream** — shows her step events.
- **AgentHistoryTab** — her journal entries (agent-journal-service.ts).
- **AgentGroupsSection / AgentPolicySection** — can group/permission her.
- **DirectorPanel / AgentIdentityChip**, **DebateRuntimePanel / AgentControlPanel**, **ForumPanel / AuthorBadge**, **DashboardPanel / AgentLiveBoard**, **AgentComparisonPanel** — all resolve her identity generically.

## UX problems specific to `agent-content` (VERIFIED/INFERRED)

1. **Avatar mismatch.** Curated 📝 is injected into `node.config.avatar` (topology-defaults.ts:103) and IS used by identity-aware chips, but the plain `AgentAvatar` component ignores it (AgentAvatar.tsx:47). Result: Lena looks different depending on the screen. _VERIFIED._
2. **No content-specific controls.** Despite "Content Strategist," there is no UI to set tone, audience, format, SEO target, or brand voice. The only steer is a free-text task.
3. **No content output preview.** Her produce (a drafted article, an SEO note) is shown as raw chat text; no structured content view (editor, markdown render, readability score).
4. **Specializations invisible.** `Editorial / SEO / Messaging` (agent-profiles.ts:170) are not shown anywhere as actionable chips — they're metadata only.
5. **No "content portfolio."** No screen aggregates what Lena has produced (drafts, audits) across sessions.

## Agent-specific UX improvements (OPINION, reuse existing components)

1. **Fix avatar consistency.** Either make `AgentAvatar` prefer `node.config.avatar` (read via `resolveAgentIdentity`) or have identity-aware consumers pass `emoji/color` everywhere. Tiny change, high polish. (Reuses agent-identity.ts + AgentAvatar.tsx.)
2. **Content task presets in RoomPanel.** Add quick-task buttons ("Draft blog post", "SEO audit", "Rewrite for audience") that prefill `reason`. Reuses RoomPanel's existing task textarea (no engine change).
3. **Specialization chips on AgentCard.** Render `specializations` from `resolveAgentIdentity` (agent-identity.ts:135) as chips. Reuses existing identity view.
4. **Content portfolio tab.** A new AgentDetailPanel sub-tab that calls `agentJournalService.listByAgent('agent-content')` + memory filtered by `source` (see 08) to show her work history. Reuses existing stores.
5. **Structured content output card.** When `agent-content` produces a long-form response, render it in a markdown/editor surface with a copy/export button. Reuses generic message rendering; content-type detection by participant id.

## Risks / dependencies

- Avatar fix touches a widely-used component — must keep the deterministic fallback for unknown ids (AgentAvatar.tsx:77).
- Content portfolio needs the agent-scoped memory recall from 08_MEMORY_AND_CONTEXT.
