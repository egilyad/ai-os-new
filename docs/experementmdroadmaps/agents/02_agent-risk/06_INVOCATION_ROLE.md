# 06_INVOCATION_ROLE — `agent-risk` via Invocation Engine / RoomPanel

## CURRENT mechanics (VERIFIED)

- RoomPanel renders a `<select>` of `agentService.getAgents()` (RoomPanel.tsx:89-95); agent-risk appears as "Risk Analyst — Risk Analyst" (name — role).
- Human selects agent-risk, picks Where (`room` / `forum-topic` / `conversation`) and Mode (`chat` / `debate` / `director-scenario`), enters a Task, and clicks Invoke (RoomPanel.tsx:121-141).
- The request: `source:'human-mention'`, `target:{agentId:'agent-risk'}`, `context:{type:where, ref:'general'}`, `constraints:{mode}` (RoomPanel.tsx:127-134).
- `InvocationEngineService.invoke` (invocation-engine-service.ts:39): emits `INVOCATION_REQUESTED` → evaluates policy → `Manual Room Chat (human-mention)` (phase21-invocation.ts) allows any human-selected registered agent → `resolveAgents({agentId})` returns `[{id:'agent-risk'}]` (line 160-161) → `accepted` → `execution.start` → `executing` → `done`.
- Lifecycle observable in `useInvocationStore` (invocation:*) + live `conversation:*` feed (RoomPanel feed section).
- "Open session" button navigates to `/director?session=` or `/debate?mode=runtime&sessionId=` (RoomPanel.tsx:110-113) when `sessionRef.kind` is conversation/debate.

## Context / mode mapping (VERIFIED)

- Where "💬 This room" → `context.type:'room'`; "📋 Forum topic" → `forum-topic`; "🗨️ Conversation" → `conversation` (RoomPanel.tsx:20-24).
- Mode "💬 Chat" → `chat`; "⚔️ Debate" → `debate`; "🎬 Scenario" → `director-scenario` (RoomPanel.tsx:26-30).
- For agent-risk the natural default is **Chat** (quick risk question) or **Debate** (adversarial risk review). `director-scenario` requires a pre-built scenario referencing agent-risk (see 05).

## Policy (VERIFIED)

- `Manual Room Chat (human-mention)` gates only on `match.source:'human-mention'`; permits any registered agent; `allowAgentInitiatedInvocation:false` (phase21-invocation.ts). So agent-risk can be invoked by a human but NOT self-/peer-invoke (by design, D6 authority=human).

## Improvements (OPINION — see 11/13)

- Add a risk-context template (pre-filled Task suggestions: "Score the risk of…", "Run a Monte-Carlo on…", "Audit compliance of…").
- Add a `risk-review` director-scenario quick-pick in RoomPanel so a human can invoke agent-risk in a multi-agent risk conversation in one click.
- Surface the agent's `specializations` as invocation hints in the picker.

## Caveats (VERIFIED)

- Invocation resolves the agent by `target.agentId` only (engine does NOT consult `policy.actions.target`); the human's pick is authoritative. Unknown ids are rejected (invocation-engine-service.ts:77-88).
