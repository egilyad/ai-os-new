# 09_UI_UX — Current agent UI & design-specific opportunities

> VERIFIED surfaces from `src/components/AgentsPanel/` and shared chips.

## Current UI (VERIFIED)

- **AgentCard** (`AgentCard.tsx`): avatar (🎨 `#ec4899` via `resolveAgentIdentity`), name "Kai
  Mendez", role "Product Designer", `specializations.join(' · ')` (`AgentCard.tsx:68-78`),
  tools (shows "no capabilities" since `tools:[]`), provider/model line
  (`agent.providerId` / `agent.model` `:164-169`), pause/resume, invocations/success/latency/errors
  stats.
- **AgentDetailPanel / AgentIdentityEditor / AgentWizard** — generic editors; can edit prompt,
  temperature, model, roleName. No design-specific fields.
- **AgentStatsDashboard / AgentObservabilityTab / AgentHistoryTab / AgentCapabilitiesTab /
  AgentGroupsSection / AgentPolicySection / AgentHandoffsTab / AgentInfraTab / AgentConfigTab /
  AgentComparison** — all generic across 25 agents.
- **Shared chips**: `DirectorPanel/AgentIdentityChip`, `ForumPanel/AuthorBadge`,
  `DebateRuntimePanel/AgentControlPanel` — render the resolved identity generically.

## Agent-specific UX problems (VERIFIED)

1. The card shows **"no capabilities"** because `tools:[]` (`AgentCard.tsx:115-117`) — misleading for
   a "Prototyping" specialist with no tools.
2. **Specializations are display-only** — they never change behavior, so the UI over-promises.
3. No **preview of the design persona** the agent will actually use (the generic prompt).

## Design-specific UX improvements (OPINION, reuse existing components)

- **Design portfolio tab** in `AgentDetailPanel`: render the agent's crystallized design patterns
  (from Crystal Vault) + recent design critiques (journal `listByTag('ux')`). Reuses `CrystalCard`.
- **Prototype preview pane**: when designer emits HTML/markdown, render it in an iframe/canvas
  (reuse `KnowledgeGenPanel` preview patterns). No new framework.
- **Lens assignment UI**: let the user attach `lens:design` to the designer (reuse `LensesPanel`
  selection control). Today `lensIds` is hardcoded `[]`.
- **Specializations → prompt-injection preview**: show how `UX / Prototyping / Design Systems` would
  shape the system prompt (educates users that today they don't).
- **"Design stance" toggle** in debate/invocation config: pro/neutral/con for design critiques.
