---
title: ConversationCore Integration — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 04 — CONVERSATION CORE: chat, director, orchestrator

## How the agent "speaks" in Core (VERIFIED)

`conversation-execution-engine.ts:40` resolves a turn's participant:
`const agent = this.agentResolver?.resolveAgent(proposal.participantId) ?? null;`.
The `agentResolver` is `AgentService` (`IAgentResolver`). So when a `TurnProposal`
has `participantId: 'agent-doc-simplifier'`, Core resolves its identity
(model `llama-3.1-8b-instant`, system prompt, provider groq) and executes via
`ChatExecutor` (see `AGENTS.md` B3/B5.4a: `ChatExecutionEngine` over
`chatService`).

## Not a default participant (VERIFIED)

- The seeded workforce topology routes this agent via `e-router-doc-simplifier`
  (`topology-defaults.ts:500-504`) → only invoked when the **router** dispatches a
  task to it, or when explicitly targeted.
- `ConversationDirectorService` / `HybridPolicy` / `ConversationOrchestrator`
  (`AGENTS.md` B3/B4) use `participantId`s taken from a `ConversationScenario`.
  A scenario created through the Director UI can name `agent-doc-simplifier` as a
  participant; nothing pre-seeds such a scenario.

## DirectorService binding (VERIFIED)

`phase20-director.ts` registers `conversationDirectorService` with
`ChatExecutionEngine(chatService, eventBus)` (`AGENTS.md` B5.4a). The agent is
reached only through `proposal.participantId` → `agentService.resolveAgent`.
No Director code references doc-simplifier by id.

## ChatExecutor path (VERIFIED, INFERRED)

`ChatExecutor` (referenced in `AGENTS.md` B5.4a) executes the resolved agent's
system prompt + model. For doc-simplifier that means the simplification prompt
(`topology-defaults.ts:426-427`) at `groq/llama-3.1-8b-instant`, temperature 0.3.
The LLM response flows back as a `TurnResult` and emits `conversation:turn:complete`
(`AGENTS.md` B4).

## Conversation-backed debate (VERIFIED)

When a debate runs on ConversationCore (`conversation-backed-debate-orchestrator.ts`),
the same `resolveAgent` seam applies — doc-simplifier participates only if named a
participant (see `03_DEBATE.md`).

## Lifecycle status in Core (VERIFIED)

Core emits `conversation:*` events; `DirectorStore` consumes them
(`AGENTS.md` B4). The agent's per-node lifecycle state is still owned by
`AgentService` (`02_AGENT_SERVICE.md`).
