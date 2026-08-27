# 06_INVOCATION_ROLE — `agent-ux` via Invocation Engine (RoomPanel)

## CURRENT state (human invocation)

The Invocation Engine (Phase 21) lets a human invoke any registered agent from `RoomPanel`. For `agent-ux`:

- **Human picker**: RoomPanel renders `agentService.getAgents()`; the human selects "Theo Nakamura — UX Researcher". **[VERIFIED]** (`phase21-invocation.ts:43-58` `AgentResolverDirectory` wraps `agentService`; RoomPanel human picker).
- **Request**: `InvocationRequest` carries `target { agentId: 'agent-ux' }`, `context { type, ref }`, `constraints.mode` (chat | debate | scenario). **[VERIFIED]** (`phase21-invocation.ts:68-109`).
- **Policy gate**: default `Manual Room Chat (human-selected agent)` policy matches `source: 'human-mention'` only and lets the human pick ANY registered agent; `resolveAgents` rejects unknown ids. **[VERIFIED]** (`phase21-invocation.ts:125-144,151`).
- **Execution**: chat/scenario → `ScenarioRepository.create` + `conversationDirectorService.run()`; debate → `debateService.startDebate`. The engine never runs the agent itself (D5). **[VERIFIED]** (`phase21-invocation.ts:60-110`).
- **Lifecycle events**: `INVOCATION_REQUESTED → ACCEPTED → EXECUTING → DONE|REJECTED` observed by `invocationStore` and shown in RoomPanel. **[VERIFIED]** (Step 6 E2E).

## Recommended invocation patterns

| Context (`context.type`) | Mode     | Example human task                                   |
| ------------------------ | -------- | ---------------------------------------------------- |
| `room` (this room)       | chat     | "Review this onboarding flow for friction"           |
| `forum` (forum topic)    | chat     | "Summarize user-pain points in this thread"          |
| `conversation`           | scenario | "Run a 3-turn UX critique of our checkout"           |
| `debate`                 | debate   | "Debate dark-mode accessibility with agent-designer" |

## Policy recommendation

Keep the human-gated policy (authority = human, no agent self-invocation). **[OPINION]** Optionally add an _expertise-match_ auto-invocation policy (D2) so that when a Room topic contains UX keywords (`usability, accessibility, onboarding, friction, wireframe`), `agent-ux` is _suggested_ (not auto-run) to the human. This reuses the existing `match.expertise` field in `contracts/invocation.ts` — no schema change. **[INFERRED]** from `phase21-invocation.ts` policy model.

## Constraints already enforced

- `allowAgentInitiatedInvocation: false` → `agent-ux` can never self-invoke. **[VERIFIED]**
- Session ref is written only at `executing` (not `accepted`) — matches doc §9. **[VERIFIED]**
- History persists in Dexie `invocations` table; RoomPanel "Open session" navigates to `/director?session=` or `/debate?mode=runtime&sessionId=`. **[VERIFIED]** (Step 6 History).
