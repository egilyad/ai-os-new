# 06_INVOCATION_ROLE — `agent-writer` via Invocation Engine (RoomPanel)

## Current (VERIFIED)

- `phase21-invocation.ts:43` `AgentResolverDirectory` wraps `agentService`; `resolveAgents` rejects unknown ids (`AGENTS.md` "resolveAgents rejects unknown"). Clara is a registered node, so she resolves.
- RoomPanel renders a human agent `<select>` from `agentService.getAgents()`; the human picks Clara (shown as "Clara Bengtsson — Technical Writer"). The pick becomes `req.target.agentId = 'agent-writer'`. `[VERIFIED by AGENTS.md Step 6 rework]`
- The invocation request carries `context { type, ref }` and `constraints.mode` (`chat`/`debate`/`scenario`). RoomPanel's friendly pickers map to these (`AGENTS.md`).
- Policy gate: only `human-mention` source policies allow it. A default "Manual Room Chat (human-selected agent)" policy is seeded (`phase21-invocation.ts`, `AGENTS.md` Step 6 Manual policy). The engine gates on `match.source`/`event`/`expertise` — **not** on `policy.actions.target`, so any registered agent (including Clara) is permitted. `[VERIFIED]`
- Lifecycle: `requested → accepted → executing → done|rejected`. `sessionRef` is set on `executing` (`AGENTS.md` Step 6 note). For `chat`/`scenario` mode the execution delegate hands off to `ConversationDirectorService`/`ChatExecutor`; for `debate` to `debateService`.

## Context / mode for Clara

| RoomPanel picker                                       | maps to                          | effect for Clara                                              |
| ------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| Where: 💬 This room / 📋 Forum topic / 🗨️ Conversation | `context.type` (ref `'general'`) | scopes the task                                               |
| Mode: 💬 Chat / ⚔️ Debate / 🎬 Scenario                | `constraints.mode`               | chat → ConversationCore; debate → Debate; scenario → Director |
| Task textarea                                          | `reason`                         | the writing brief                                             |
| Agent picker                                           | `target.agentId:'agent-writer'`  | speaker                                                       |

## Policy recommendation

Add a **documentation-specific policy** (or extend the manual one) whose `match.expertise` includes `Documentation` so Clara is the _preferred_ target when a human task mentions "docs/api/tutorial". This reuses `InvocationEngineService.matches()` which already inspects `match.expertise` (`AGENTS.md` Step 6 Manual policy). `[INFERRED]` Today the human must manually pick her; an expertise match would auto-suggest her.

## Scenario

Human opens RoomPanel → picks Clara → Where "This room" → Mode "Chat" → Task "Draft a README section for the Invocation Engine" → Invoke. Engine: `requested`(human-mention) → `accepted` → `executing`(ConversationCore chat, sessionRef set) → `conversation:*` live feed in RoomPanel → `done`. Open Session button navigates to `/director?session=…`. `[VERIFIED pattern from AGENTS.md Step 6 History/Open Session]`
