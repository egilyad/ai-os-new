# 09_UI_UX — Current agent UI & critic-specific UX

## Current UI surfaces (VERIFIED)

| Surface                                    | What it shows for agent-critic                                                                            | Evidence                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **AgentsPanel / AgentCard**                | name "Greta Lindqvist", role, status, stats, avatar 🔍#ec4899                                             | `components/AgentsPanel/`; `agent-service.ts:306-329` |
| **AgentDetailPanel**                       | full identity via `resolveAgentIdentity` (`agent-identity.ts:62`), incl. specializations, model, provider | `agent-identity.ts:129-143`                           |
| **AgentAvatar**                            | prefers profile avatar over hash fallback                                                                 | `AgentAvatar.tsx:47-54`, `agent-identity.ts:102-114`  |
| **DirectorPanel ParticipantsField**        | generic picker listing the agent by role                                                                  | `DirectorPanel/ParticipantsField.tsx`                 |
| **RoomPanel**                              | "Greta Lindqvist — Critical Auditor" in agent `<select>`                                                  | `RoomPanel.tsx:89-95,181-185`                         |
| **ForumPanel AuthorBadge**                 | agent identity chip when the critic posts                                                                 | forum uses agentService identity                      |
| **DashboardPanel / AgentLiveBoard**        | live activity from `COGNITIVE_STEP_COMPLETED`                                                             | `LiveActivityStream.tsx:122`                          |
| **DebateRuntimePanel / AgentControlPanel** | participant controls                                                                                      | debate UI                                             |
| **AgentComparisonPanel**                   | side-by-side agent comparison                                                                             | comparison UI                                         |
| **prompt-audit-service**                   | groups critic as "Analytical" for prompt-quality audit                                                    | `prompt-audit-service.ts:25`                          |

## What is agent-specific? (VERIFIED)

**Nothing.** Every surface treats `agent-critic` as a generic `agent` node. There is no component that:

- labels it visually as "the critic" beyond its avatar/name,
- shows its specializations as actionable (e.g., a "Run fallacy scan" button),
- surfaces its low temperature / skeptical stance,
- shows a critique history or fallacy ledger,
- binds `lens:critical` to its UI.

## Agent-specific UX improvements (OPINION / INFERRED)

1. **Critic badge + "Audit" action** on `AgentCard`: a one-click "Critique this" that opens Room pre-filled with `agent-critic` + `mode:chat` + the selected artifact as task.
2. **Specialization chips as actions:** render `Critical Analysis / Fallacy Detection / Logic` as clickable chips that pre-fill an Invocation request with the matching lens/prompt.
3. **Critique lane in DebateRuntimePanel:** when `agent-critic` is a participant, render its messages in a distinct "Critique" lane (reuse the existing status-badge styling pattern from `RoomPanel.tsx:312`).
4. **Fallacy ledger view** in `AgentDetailPanel`: read from a critique memory store (see `08_MEMORY_AND_CONTEXT`) and show "N fallacies flagged."
5. **Live "critiquing…" indicator** in `LiveActivityStream` when a `COGNITIVE_STEP_ACTIVE` with `nodeId:'agent-critic'` is active.
6. **Temperature/stance disclosure:** show "Skeptical · temp 0.1 · nvidia/llama-3.3-70b" in `AgentDetailPanel` so users understand its behavior bias.

All of these reuse existing components and stores — no new framework.
