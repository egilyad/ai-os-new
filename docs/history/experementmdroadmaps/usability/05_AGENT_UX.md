# 05 — Agent UX

> How a first-time user understands, finds, configures, and invokes agents. Evidence: VERIFIED (read AgentsPanel, RoomPanel, ForumPanel, agent-service, AGENTS.md).

## What agents are in this product

Agents are the core "workforce." They can be spawned, configured, grouped, given roles/tools, run in debates, chats, rooms, director scenarios, and builder workflows. This is powerful but **conceptually heavy** for a newcomer.

## Findings

### A. Agent management is rich but undiscoverable-as-a-journey (VERIFIED)

- `AgentsPanel` (`AgentsPanelView.tsx`) offers: list/grid, search, status filter, `AgentCard`, `AgentDetailPanel`, `AgentStatsDashboard`, `LiveActivityStream`, `EloLeaderboard`, `AgentWizard`, `AgentGroupsSection`, import/export, reset stats, pause/resume all.
- Many sub-tabs in detail: Config / Capabilities / Handoffs / History / Observability (`AgentObservabilityTab.tsx`).
- **Gap:** There is no single "I'm new — start here" entry. A first-timer sees a dense workforce table and must guess what `spawn`, `Elo`, `handoffs`, `groups` mean. No inline glossary.

### B. "Invoke an agent" terminology mismatch (VERIFIED, see 03/RoomPanel)

- The user-facing path to make an agent act is **RoomPanel**, but the word "invoke"/"invocation" never appears in its UI. Instead: pick agent → "Where" (room/forum-topic/conversation) → "Mode" (chat/debate/director-scenario) → "Task" → Invoke.
- "Where"/"Mode" are abstract; a first-time user cannot map them to outcomes. The rejection path shows raw `no matching enabled policy` — an internal engine term, not a user-actionable message.

### C. Agent identity & authoring (VERIFIED)

- `AgentIdentityEditor.tsx` exists (configurable persona). Forum hardcodes author as "Вы" (Russian "You") — inconsistent with the configurable identity model elsewhere.

### D. Agent groups (R-26, INFERRED)

- `AgentGroupsSection.tsx` + `GroupsPanel` exist. Likely useful for organizing the workforce, but not surfaced as a recommended pattern in onboarding.

### E. Live agent activity (VERIFIED positive)

- `LiveActivityStream.tsx` (23KB) and `EloLeaderboard.tsx` give a real sense of agents "doing things." Good realtime comprehension aid — but only inside AgentsPanel.

## Systemic issues

- **S-AGENT-1 (P1):** No guided "create & run your first agent" flow. Wizard exists (`AgentWizard.tsx`) but is not promoted from Dashboard or as a first-run step.
- **S-AGENT-2 (P0):** Invocation vocabulary hidden — the core action ("make an agent do X") is buried under abstract "Where/Mode" pickers with no explanation.
- **S-AGENT-3 (P2):** Agent identity configurable in one place, hardcoded ("Вы") in another (Forum) — consistency break.

## Recommendations (IDs cross-referenced in 13/14)

- UX-A1: Add "Spawn your first agent" to Dashboard QuickActionBar / GetStarted when no agents exist.
- UX-A2: Reword RoomPanel "Where/Mode" into plain outcomes ("Chat with agent", "Run a debate", "Run a guided scenario") with one-line hints.
- UX-A3: Replace raw `no matching enabled policy` with actionable copy ("No policy allows this. Create one in Settings → Policies, or pick a different agent.").
- UX-A4: Unify author identity (stop hardcoding "Вы" in Forum).
