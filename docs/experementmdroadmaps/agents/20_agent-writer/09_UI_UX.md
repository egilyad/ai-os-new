# 09_UI_UX — `agent-writer` in the UI

## Current UI surface (VERIFIED by AGENTS.md + source)

- **AgentsPanel** (`src/components/AgentsPanel/`): `AgentsPanelView`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar`. The writer appears in `getAgents()` list (`agent-service.ts:306`) with name, role, status, stats.
- **AgentAvatar** (`AgentAvatar.tsx:47` `getAgentAvatar`): deterministic fallback; but identity is resolved via `resolveAgentIdentity` (`agent-identity.ts`) which carries the curated `📝 #14b8a6` avatar from the profile. `[VERIFIED]`
- **DirectorPanel** `AgentIdentityChip` — shows Clara when she is a scenario participant.
- **DebateRuntimePanel** `AgentControlPanel` — shows her as a debate participant (start/pause/abort).
- **ForumPanel** `AuthorBadge` — if she posts in the forum.
- **AgentComparisonPanel**, **DashboardPanel/AgentLiveBoard** — stats/activity.
- **RoomPanel** — human picks "Clara Bengtsson — Technical Writer" from the agent `<select>` (`AGENTS.md` Step 6 rework).

## What the UI does NOT show (gaps)

- **No documentation-specific view.** There is no panel that shows "docs Clara has written", no diff/view of her outputs, no "Documentation" tab in AgentsPanel.
- **Specializations are shown as a static label only.** `Documentation / Tutorials / API Docs` appear in `AgentDetailPanel` via `resolveAgentIdentity.specializations` but are not actionable (no "filter debates by my specialization", no "assign me doc tasks").
- **No lens indicator** (she has none — see 02/07), but the UI gives no hint that doc-expertise is unused.
- **No "Document" quick action** in RoomPanel — only Chat/Debate/Scenario modes.

## Agent-specific UX improvements (POTENTIAL)

1. **"Ask Clara to document" button** in RoomPanel (mode `document` → ConversationCore chat with a doc-oriented system prompt). Reuses invocation flow (`phase21-invocation.ts`).
2. **Documentation tab in AgentDetailPanel** listing her journal entries / (future) `documents` store, with token cost per doc.
3. **Specialization-aware suggestions:** when a human task in RoomPanel mentions "docs/api/tutorial", pre-select Clara (reuses `InvocationEngineService.matches` expertise).
4. **Avatar + label consistency:** ensure `AgentAvatar` prefers the resolved identity avatar over the deterministic hash (already the case via `resolveAgentIdentity`, but `getAgentAvatar` fallback is still used in some places — verify per-component).
5. **Live "writing" indicator:** surface `COGNITIVE_STEP_ACTIVE` for `nodeId:'agent-writer'` in AgentLiveBoard so users see her mid-draft.

## Effort

All five are **UI-only** (app layer) reusing `resolveAgentIdentity`, `getStats`, `invocationEngine`, `AgentJournalService`. No kernel change. Low–medium effort. `[OPINION]`
