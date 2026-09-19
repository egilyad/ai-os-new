# 06 — INVOCATION ROLE for `agent-content` (human invocation)

> How a human invokes `agent-content` via the Invocation Engine / RoomPanel. VERIFIED from phase21-invocation.ts + RoomPanel.

## Current mechanism (VERIFIED)

1. **Human picks the agent.** `RoomPanel` renders an agent `<select>` from `agentService.getAgents()` (AGENTS.md Step 6 rework). The human selects "Lena Petrova (Content Strategist)".
2. **Request shape.** `InvocationRequest` carries `target { agentId: 'agent-content' }`, `context { type, ref }`, `constraints.mode` (`chat` | `debate` | `scenario`), and `reason` (the task text).
3. **Policy gate.** `InvocationEngineService.invoke()` runs `matches()` over seeded policies. The default `Manual Room Chat (human-selected agent)` policy matches on `source: 'human-mention'` only (phase21-invocation.ts:125-144). It does **NOT** constrain the agent — `matches()` never compares `policy.actions.target` to the request (VERIFIED comment phase21-invocation.ts:115-123). So any registered agent the human picks is allowed.
4. **Resolution.** `AgentResolverDirectory` wraps `agentService` and `resolveAgents` rejects unknown ids (phase21-invocation.ts:44-58). `agent-content` is registered → resolved.
5. **Execution handoff.** `InvocationExecutionDelegate.start()` (phase21-invocation.ts:61-109):
   - `mode:'debate'` → `debateService.startDebate(...)` with `agent-content` as a neutral participant.
   - `mode:'chat'`/`scenario` → builds a `ConversationScenario` (topic = `context.ref`, turns = `INTRODUCE` for each agent) → `director.loadScenario` + `director.run()`.
6. **Lifecycle events.** `invocation:requested → accepted → executing → done|rejected` emitted; `conversation:*` live events stream to `useInvocationStore`.

## Context / mode mapping for `agent-content` (RECOMMENDED defaults)

| Room "Where" picker | context.type             | Maps to                    |
| ------------------- | ------------------------ | -------------------------- |
| 💬 This room        | `room` (ref `'general'`) | chat                       |
| 📋 Forum topic      | `forum` (ref topic id)   | chat → could post to forum |
| 🗨️ Conversation     | `conversation` (ref)     | chat/director-scenario     |

| Room "Mode" picker | constraints.mode | Effect                                     |
| ------------------ | ---------------- | ------------------------------------------ |
| 💬 Chat            | `chat`           | single conversational turn via Director    |
| ⚔️ Debate          | `debate`         | debate session w/ agent-content as neutral |
| 🎬 Scenario        | `scenario`       | structured multi-turn Director run         |

## Recommended invocation patterns (OPINION)

- **Pre-filled task templates** in RoomPanel for `agent-content`: "Draft a blog post about ___", "SEO-audit this text", "Rewrite for ___ audience". These are just `reason` presets — no engine change.
- **Multi-agent content room:** allow selecting `agent-content` + `agent-creative` + `agent-writer` together; the delegate already maps `agents[]` → multiple participants (phase21-invocation.ts:68-108). Today RoomPanel picks one agent; extending to a list is a small UI change reusing existing multi-agent support.

## Policy notes

- The default policy is fire-and-forget seeded (phase21-invocation.ts:127-144). `agent-content` is permitted purely because it is a _registered_ agent, not because any policy mentions it.
- OPINION: a future `content-room` policy could match on `context.type:'forum'` + `expertise:'Editorial'` to auto-route content tasks to `agent-content` without a human pick (expertise-match trigger, D2 in INVOCATION_ENGINE.md). This is deferred design, not built.

## Gaps

- RoomPanel invokes **one** agent at a time (human picks a single agentId). Group/multi-agent content rooms are not exposed.
- No persistence of _what_ `agent-content` produced back to the agent's own memory/journal in a content-structured way (only generic `COGNITIVE_STEP_COMPLETED` side-effects).
