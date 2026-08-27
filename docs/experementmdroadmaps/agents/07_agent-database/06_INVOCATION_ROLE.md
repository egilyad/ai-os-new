# 06_INVOCATION_ROLE — Human invocation of `agent-database`

## How a human invokes it today (VERIFIED)

- `RoomPanel` presents a friendly **Agent picker** populated from `agentService.getAgents()` (AGENTS.md: "RoomPanel human-picks any agent"). Priya Nair appears as "Priya Nair — Database Engineer".
- The human also picks **Where** (`💬 This room / 📋 Forum topic / 🗨️ Conversation` → `context.type`) and **Mode** (`💬 Chat / ⚔️ Debate / 🎬 Scenario` → `constraints.mode`), and types a **Task**.
- On submit, `invocationEngine.invoke(req)` is called. The request target is `agent-database` (resolved from the human pick), NOT from any policy's `actions.target`.
- `phase21-invocation.ts:125-144` seeds a `Manual Room Chat (human-selected agent)` policy that matches **only** `source:'human-mention'` and lets the human choose ANY registered agent. Non-registered ids are rejected later by `AgentResolverDirectory`/`resolveAgents`.
- Execution handoff (`InvocationExecutionDelegate.start`, `:60-110`):
  - `mode:'debate'` → `debateService.startDebate(...)` with the agent as a neutral participant.
  - `mode:'chat'`/`'director-scenario'` → creates a `Scenario` via `scenarioRepository.create`, `director.loadScenario` + `run()`.

## Lifecycle observed (VERIFIED per AGENTS.md Step 6 E2E)

`requested → accepted → executing → done` (or `rejected`). `sessionRef` appears on `executing`. Live `conversation:*` / `debate:*` events stream to `useInvocationStore`. The aggregate is the sole writer (`InvocationEngineService`).

## Recommended context/mode for this agent (OPINION)

- **Best mode:** `Chat` (ConversationCore) for SQL review / schema critique / migration advice. `Debate` is useful when two DB positions must be argued (e.g., SQL vs NoSQL).
- **Recommended context:** `💬 This room` for ad-hoc queries; `🗨️ Conversation` when a multi-turn plan is needed.
- **Policy suggestion:** A dedicated `Database Review (human-selected)` policy could set `mode:'chat'` + a default `reason` template ("Review the following schema/query for …"), but per D7 the policy only gates the _call type_, not the agent.

## Gap (VERIFIED)

Because `sql_executor` is not a real tool, an invoked "tune this query" request yields **textual** advice only — the agent cannot execute the query to verify. This is the single biggest limiter on invocation value (see `11_OPPORTUNITIES` QW-1).
