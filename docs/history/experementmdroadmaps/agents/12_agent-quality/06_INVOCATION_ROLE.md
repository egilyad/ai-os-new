# 06_INVOCATION_ROLE — `agent-quality` via Invocation Engine

## CURRENT (VERIFIED — `phase21-invocation.ts`)

- `AgentResolverDirectory` (`phase21-invocation.ts:44-57`) wraps `agentService.getAgents()`/`resolveAgent`, exposing `specializations`. RoomPanel's agent `<select>` is built from `agentService.getAgents()`; the human picks `agent-quality` and it becomes `req.target.agentId`.
- `InvocationEngineService.invoke` resolves the target via the directory; `resolveAgents` rejects unknown ids (per AGENTS.md). `agent-quality` is a registered node → accepted.
- `InvocationExecutionDelegate.start` (`phase21-invocation.ts:68-89`) hands off by `mode`:
  - `debate` → `debate.startDebate(..., agents as neutral, 'round_robin', 5)` (`:75-86`).
  - `chat` / `director-scenario` → ConversationDirector scenario (ConversationCore) (`:89+`).
- Policy: the seeded `Manual Room Chat (human-mention)` policy (`phase21-invocation.ts` registration) gates on `match.source:'human-mention'` and permits **any registered human-selected agent**, so `agent-quality` is allowed (AGENTS.md Step 6 Manual Room policy). `mode` from RoomPanel maps to `constraints.mode`.

## Human invocation shape (INFERRED from RoomPanel UI contract)

- Where picker → `context.type` (`'general'` ref).
- Mode picker → `constraints.mode` (`chat` / `debate` / `scenario`).
- Task textarea → `reason`.
- No agent-specific fields; `agent-quality` is treated like any other agent.

## RECOMMENDED

- Add an **invocation policy** specifically for QA requests: `match.source:'human-mention'`, `actions.target.agentId:'agent-quality'`, `mode:'chat'`, default `context.type` = the artifact to be reviewed. This lets a human click "Review this with QA" without manual agent selection.
- Surface `agent-quality`'s `Coverage`/`Test Automation` specializations as suggested task templates in RoomPanel when this agent is selected (UI-only, reuses existing `specializations` field already in `AgentResolverDirectory`).

## Scenarios

- **S1 — "Review this spec for test gaps"** → chat mode → ConversationCore turn by `agent-quality`.
- **S2 — "Stress-test this claim"** → debate mode → `agent-quality` injected as neutral claim-tester.
- **S3 — "Generate a test plan"** → scenario mode → Director scenario with `agent-quality` as the test-plan turn.
