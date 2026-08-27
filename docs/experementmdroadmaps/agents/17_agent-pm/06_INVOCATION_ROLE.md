# 06 — INVOCATION ROLE

> Human invocation via RoomPanel / Invocation Engine. Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## CURRENT (VERIFIED)

- **Entry point:** `RoomPanel` (route `room`) renders a human picker of agents from `agentService.getAgents()` and lets the user choose **Where** (room/forum/conversation), **Mode** (chat/debate/scenario), and a **Task** (`AGENTS.md` Step 6 rework). `agent-pm` appears in that picker like any other node.
- **Dispatch:** `RoomPanel` → `invocationEngine.invoke(req)` where `req.target = { agentId: 'agent-pm' }` (human-selected). `InvocationEngineService` gates on a policy, resolves the target via `AgentResolverDirectory` (wraps `agentService`, `phase21-invocation.ts:43-58`), then `InvocationExecutionDelegate.start` runs it (`phase21-invocation.ts:60-110`).
- **Policy:** the seeded `Manual Room Chat (human-selected agent)` policy (`phase21-invocation.ts:125-139`) matches `source:'human-mention'` and **does not constrain the agent** — `matches()`/`evaluate()` only gate on `match.source/event/expertise` (`AGENTS.md` pending-design note). So any registered human-selected agent, including `agent-pm`, is permitted. Unknown ids are rejected by `resolveAgents`.
- **Lifecycle:** `invocation:requested → accepted → executing → done|rejected` (5 events, `event-registry.ts` per AGENTS.md Step 3/§9). `useInvocationStore` observes them; `RoomPanel` shows status badge + Open Session (for `conversation`/`debate` sessionRef).
- **Context/mode mapping:** `context.type` (room/forum/conversation, ref `'general'`) + `constraints.mode` (chat/debate/scenario) are the only knobs; there is **no PM-specific context type**.

## What a human can ask `agent-pm` today (INFERRED)

- "Plan the Q3 roadmap", "What are the risks in this proposal?", "Break this into milestones" — all work as a **chat** invocation; `agent-pm` answers from its system prompt + 70B model. Output is free text; nothing structures it.
- **Debate** mode pits `agent-pm` against another agent on a topic (round_robin, 5 rounds, `phase21-invocation.ts:75-86`).
- **Scenario** mode → a single-participant Director scenario (per `05_CONVERSATION_ROLE.md`).

## POTENTIAL improvements (OPINION, see `11_OPPORTUNITIES.md`)

1. **PM intent shortcuts in RoomPanel.** Add quick-action chips ("Plan", "Risk assess", "Retro") that pre-fill the Task with a PM-flavored prompt and set Mode=Scenario. Reuses the existing picker; no engine change.
2. **Expertise-aware policy.** The policy model _could_ match on `req.target.specializations` (e.g. route "risk" tasks to `agent-pm`/`agent-risk`). Today `policy.actions.target` is a placeholder and `matches()` ignores it (`AGENTS.md` pending-design open question). Leaving as-is is fine; a future enhancement could let `agent-pm` be the _default_ for planning/agile/risk human mentions.
3. **Structured output capture.** After a `chat`/`scenario` invocation, offer "Save as Crystal" or "Post to Forum" so `agent-pm`'s plan becomes a first-class artifact (reuses `CrystalVault`/`ForumService`).

## Guardrails (VERIFIED)

- Human authority only (D6): `allowAgentInitiatedInvocation:false` in the default policy (`phase21-invocation.ts:137`). `agent-pm` never self-invokes.
- Engine is the sole `Invocation` writer (D7); `RoomPanel` never writes the aggregate. `agent-pm` is purely a _target_.
- Generic guard holds: an `agent-pm` invocation fires `invocation:*` + `conversation:*` (or `debate:*`), **no** `debate:`/`forum:` leakage for chat/scenario modes (AGENTS.md E2E closure).

## Scenario (INFERRED)

Human opens Room → picks **Dana Whitfield (Project Manager)** → Where: _This room_ → Mode: _Scenario_ → Task: _"Draft a 6-week plan to launch the Invocation Engine, flag top risks."_ → Invoke. Engine accepts (human-mention policy) → Director scenario runs `agent-pm` → live `conversation:*` feed in Room → `done` → Open Session jumps to `/director?session=…`.
