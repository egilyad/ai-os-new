# 05_CONVERSATIONCORE — `agent-doc-auditor` in Conversation Core / Director

**VERIFIED.** Conversation Core (Director + `ConversationOrchestrator` + `ChatExecutor`) resolves doc-auditor through the shared `IAgentResolver` (`agentService`). No special case.

## Director Service binding

- `phase20-director.ts:36` registers `conversationDirectorService` with `c.get<IAgentResolver>('agentService')` passed into `HybridPolicy` → `ConversationOrchestrator`.
- `ConversationOrchestrator` resolves a turn's `participantId` to a real agent via the resolver so the turn is "spoken by" that agent (persona + pinned model), not just stamped as metadata.

## ChatExecutionEngine (the B-seam)

- `conversation-execution-engine.ts:23-28` — `ChatExecutionEngine implements IExecutionEngine`; constructor takes `agentResolver?: IAgentResolver`.
- `execute()` (`:30-43`): `const agent = this.agentResolver?.resolveAgent(proposal.participantId) ?? null;` then injects `agent.systemPrompt` as a `system` message and propagates Topic + running history.
- **For doc-auditor:** when a `TurnProposal` has `participantId: 'agent-doc-auditor'`, the engine resolves Felix, attaches his auditor system prompt, and the nvidia/meta-llama model is what `ChatExecutor` ultimately calls (model sourced from the resolved agent).
- This is the same path used by Debate-via-Director, the Invocation delegate (`phase21-invocation.ts:89-108` builds a scenario whose turns target the chosen agent ids, then `director.loadScenario`+`run`), and `conversation-backed-debate-orchestrator.ts` (generic over agentService).

## Observability

- `conversation-orchestrator.ts` emits `conversation:turn:start|complete|error|paused|resumed|aborted|completed` (`event-registry.ts` conversation group). Doc-auditor's turns surface through these generic events; `stores/directorStore.ts` / `invocationStore.ts` observe them (see `06_INVOCATION.md`, `08_COGNITIVE.md`).

## INFERRED

The `tools: []` on doc-auditor's node (`topology-defaults.ts:416`) means that even inside a Conversation Core turn, doc-auditor has no tool access — it reasons over the propagated Topic + history only. It cannot call code-manifest / search tools, unlike e.g. `agent-architect` (`CODER_TOOLS`). This reinforces the "judge, not actor" reading from `00_PROFILE.md`.

## OPINION

Because the turn→agent mapping is purely `participantId → resolveAgent`, doc-auditor's behavior in Conversation Core is entirely determined by (a) its curated profile/model and (b) its system prompt. There is no Director-side logic that treats an "auditor" turn specially (e.g. no auto-verification step after its reply).
