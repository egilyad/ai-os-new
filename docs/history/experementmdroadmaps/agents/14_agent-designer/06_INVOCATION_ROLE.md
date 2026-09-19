# 06_INVOCATION_ROLE — `agent-designer` via Invocation Engine (Room)

> VERIFIED: `phase21-invocation.ts` registers `invocationEngineService`; `AgentResolverDirectory`
> (`:44`) wraps `agentService`; `InvocationExecutionDelegate` (`:61`) maps intent → ConversationCore
> (chat/director-scenario) or Debate. The `DEFAULT_ROOM_POLICY` (`:125`) matches `source:'human-mention'`
> ONLY and resolves the target from the **human's pick** in RoomPanel.

## CURRENT (VERIFIED)

- A human opens RoomPanel, picks `agent-designer` from the agent `<select>` (any registered agent is
  allowed — `resolveAgents` rejects only unknown ids).
- `req.target = { agentId: 'agent-designer' }`; `context.type` ∈ {room, forum, conversation};
  `constraints.mode` ∈ {chat, debate, director-scenario}.
- Engine emits `INVOCATION_REQUESTED → ACCEPTED → EXECUTING → DONE|REJECTED`
  (`event-registry` `invocation:*`); no `debate:`/`forum:` events fire for a pure chat invocation.
- For `mode:'debate'`, designer is forced `'neutral'` (`phase21-invocation.ts:81`) — design stance lost.

## Human invocation context/mode fit

| User intent                      | context.type | mode              | Notes                                   |
| -------------------------------- | ------------ | ----------------- | --------------------------------------- |
| "Review this UI copy"            | room         | chat              | Designer speaks node prompt on groq/70b |
| "Debate dark-mode vs light-mode" | room         | debate            | Forced neutral — suboptimal (see 04)    |
| "Prototype a settings page"      | conversation | director-scenario | Needs design-aware scenario template    |

## Policy

- **No design-specific policy exists.** The only seeded policy is the generic `Manual Room Chat
(human-selected agent)` (`phase21-invocation.ts:125`). `matches()` gates on `source`/`event`/
  `expertise` only — it never constrains the agent (VERIFIED per AGENTS.md D7 note).
- `allowAgentInitiatedInvocation:false` — designer **cannot** self-invoke (authority = human).

## Recommendation

Add a **design-role policy** that (a) permits `agent-designer` for `context.type:room` with
`mode:chat|debate`, and (b) for `mode:debate` preserves a design stance (pro) instead of neutral.
This is a data-only change (one `createPolicy` call), reusing the existing engine — no new code.
