# 06_INVOCATION_ROLE — `agent-doc-architect`

> Invocation Engine + RoomPanel. **VERIFIED** unless noted.

## Wiring (VERIFIED — `src/kernel/service-registration/phase21-invocation.ts`)

- `AgentResolverDirectory` (`phase21-invocation.ts:43-58`) wraps `agentService` and exposes `getAgents()` + `resolveAgent()` (with `specializations`). It is injected into `InvocationEngineService` at `phase21-invocation.ts:152`.
- `InvocationExecutionDelegate` (`phase21-invocation.ts:61-110`) is the handoff: `start(agents, context, mode)` →
  - `mode:'debate'` → `debateService.startDebate` (`phase21-invocation.ts:75-87`)
  - `mode:'chat'` / `'director-scenario'` → `scenarioRepository.create` + `conversationDirectorService.loadScenario` + `run()` (`phase21-invocation.ts:89-108`)

## Policy gate (VERIFIED)

- Default policy `Manual Room Chat (human-selected agent)` matches **only** `source:'human-mention'` (`phase21-invocation.ts:125-139`). Per `InvocationEngineService` (D7), `matches()` never compares `policy.actions.target` to the request; `invoke()` resolves agents from `req.target` — the **human's pick in RoomPanel**.
- `resolveAgents` rejects unknown ids (`AGENTS.md` Step 5 + Step 6 manual-policy). So doc-architect is permitted **iff** it is a registered agent (it is) and the human selects it.

## RoomPanel UX (VERIFIED — `src/components/RoomPanel/RoomPanel.tsx`)

- RoomPanel renders an **agent `<select>`** from `agentService.getAgents()` (human-facing name "Bianca Conti — Documentation Architect", no ids shown). doc-architect is one option.
- "Where" picker → `context.type` (`conversation`/`forum`/`debate`); "Mode" picker → `constraints.mode` (`chat`/`debate`/`director-scenario`); "Task" textarea → `reason`.
- On submit → `invocationEngine.invoke(req)` with `target.agentId = 'agent-doc-architect'`.
- Lifecycle observed in `useInvocationStore` (intent) + `conversation:*`/`debate:*` (live output). "Open Session" navigates to `/director?session=…` or `/debate?…` when `sessionRef` is set.

## Generic guard (VERIFIED)

- E2E (`room-invocation-e2e.integration.test.tsx`) asserts **no `debate:`/`forum:`-prefixed event** fires while `INVOCATION_*` + `CONVERSATION_*` do — proving doc-architect invocation does not drag the legacy architecture along. The same guard covers doc-architect since it shares the path.

## What doc-architect does NOT get from invocation

- No automatic documentation-architecture routing. A human must pick it; the engine does **not** infer "this task is about docs → route to doc-architect" (no expertise-match policy seeded for it). (INFERRED from Step 6 manual-policy being source-only.)
- Even when invoked, the execution is a generic chat/debate; the agent's _specializations_ are not used to shape the objective (the human's "Task" text is the only signal).

## Opportunities (see 11)

- Seed an expertise-match invocation policy so doc-architecture tasks auto-suggest doc-architect.
- Pre-fill RoomPanel "Task" with a documentation-architecture template when doc-architect is selected.
