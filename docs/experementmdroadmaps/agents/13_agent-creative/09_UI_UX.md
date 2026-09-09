# 09_UI_UX — Current agent UI and creative-specific improvements

## Current UI surfaces (VERIFIED)

`src/components/AgentsPanel/` contains a rich, generic agent console. `agent-creative`
gets the same treatment as all 25 agents:

- **AgentCard** (`AgentCard.tsx`) — avatar (🎨/#a855f7 via `resolveAgentIdentity`),
  name "Indira Sun", role "Creative Visionary", `specializations.join(' · ')`
  (`AgentCard.tsx:68-77`).
- **AgentDetailPanel** — full identity + tabs.
- **AgentIdentityEditor** (`AgentIdentityEditor.tsx:83-133`) — edits `specializations`
  (comma text) and `lensIds` (multi-select). **Note:** the lens picker lists the 12
  library lenses; a user _could_ assign `lens:optimistic` to `agent-creative`, but no
  creative lens exists.
- **AgentStatsDashboard / EloLeaderboard / AgentComparison** — performance views.
- **AgentHistoryTab** — journal (`AgentJournalService`).
- **AgentGroupsSection / AgentPolicySection / AgentWizard / AgentConfigTab /
  AgentCapabilitiesTab / AgentHandoffsTab / AgentInfraTab / AgentObservabilityTab** — all
  generic.
- **Elsewhere:** `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel`,
  `ForumPanel/AuthorBadge`, `DashboardPanel/AgentLiveBoard`, `RoomPanel` (invocation
  picker), `AgentComparisonPanel`.

## Creative-specific UX problems (INFERRED from above)

1. **Identity ≠ behavior mismatch, invisible to user.** The card says "Creative Visionary"
   with Brand/Narrative/Ideation specializations, but in a debate the agent may receive a
   `pragmatic_economist` persona (`persona-selector.ts:243-290`). The user cannot tell the
   displayed identity from the actual debate voice. **No UI surfaces the assigned persona.**
2. **No "what can this agent do" hint.** The card shows specializations as static text but
   never suggests: "Invoke for brand ideation" or "Add to a Creative Council debate."
3. **Lens editor offers irrelevant lenses.** Assigning `lens:security` to a creative agent
   is possible but meaningless; no creative/brand lens to choose.
4. **History is raw, not narrated.** `AgentHistoryTab` lists journal rows; no
   "creative lineage" (draft → review → crystal) view.
5. **No continuity affordance.** No "load brand voice from Crystal" button.

## Recommended creative-specific UX (reuse-existing components)

- **Persona badge in debate UI:** when `agent-creative` is a debate participant, show the
  assigned `PersonaVariant.name` next to its chip (data already returned by
  `PersonaSelector.selectForTopic`, `persona-selector.ts:300-308`). Tiny, honest fix.
- **"Invoke for…" quick actions on AgentCard:** buttons "Brainstorm" / "Draft copy" that
  pre-fill RoomPanel with `target.agentId='agent-creative'` + a creative task template
  (reuses `invocationEngine.invoke`, `phase21-invocation.ts`).
- **Lens filter:** in `AgentIdentityEditor`, hide lenses irrelevant to the agent's
  category, or add a `lens:brand-voice` (see `11` medium M2). Presentation + one lens.
- **Creative lineage tab:** read-only `AgentJournalService.listByAgent` joined with
  crystals/forum by `agentId` (`07_COGNITIVE_ROLE.md`). Reuses existing stores.
