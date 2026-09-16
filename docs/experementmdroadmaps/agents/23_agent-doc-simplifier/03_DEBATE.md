---
title: Debate Participation — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 03 — DEBATE: this agent as a debate participant

## Summary (VERIFIED)

`agent-doc-simplifier` has **no debate-specific wiring**. It can join a debate
_only_ if explicitly selected as a participant (by the debate UI, by the Invocation
Engine in `debate` mode, or via the router). There is no persona, strategy, or
role assignment keyed to its id.

## Participant execution path (VERIFIED)

- `debate-agent-executor.ts` `createAgentExecutor` (`debate-agent-executor.ts:38-117`)
  executes a `ParticipantConfig` by `request.nodeId`. It does not care which agent
  — it calls `callLLM(session, participant, signal)` (`debate-agent-executor.ts:72`).
- `ConversationBackedDebateOrchestrator` reuses the same `AgentExecutor`
  (`conversation-backed-debate-orchestrator.ts:22-56`): `execute()` maps a
  `TurnProposal.participantId` → `agentExecutor({ agentId, nodeId })`
  (`conversation-backed-debate-orchestrator.ts:40-45`).

## Persona selection (VERIFIED, INFERRED)

`PersonaSelector.selectForTopic` (`persona-selector.ts:292-308`) picks a variant
by `agentRole` (pro/con/neutral) + topic keywords + round. The variant list
(`persona-selector.ts:3-241`) contains **no** doc-simplifier-specific persona.
When started via Invocation (`phase21-invocation.ts:78-85`) the participant role
is forced to `'neutral'`. For a neutral role with no matching keywords,
`selectVariant` returns a deterministic eligible variant
(`persona-selector.ts:287-289`) — i.e., doc-simplifier would receive an arbitrary
persona, not a "simplifier" persona. OPINION: this is a latent mismatch but
harmless (persona is just a prompt suffix).

## How a debate gets this agent (VERIFIED)

- Normal debate UI: user picks participants → `DebateParticipant[]` (id = node id).
- Invocation `debate` mode: `InvocationExecutionDelegate.start`
  (`phase21-invocation.ts:75-87`) builds participants from `req.target`.

## Debate events (VERIFIED)

Debate emits `DEBATE_*` events only. A repo-wide grep for `COGNITIVE_` inside
`src/kernel/services/debate-runtime` returns **0 matches** — debate does NOT emit
cognitive events (consistent with `07_COGNITIVE_EVENTS.md`).

## Strategy assignment (VERIFIED)

`assignArgumentStrategies` (`topology-defaults.ts:56-80`) only assigns a debate
`strategy` to agents that _share a provider:model group of size ≥ 2_.
doc-simplifier (groq/llama-3.1-8b-instant) shares its group with `agent-writer`
(also groq/llama-3.1-8b-instant, `agent-profiles.ts:218-219`) and possibly others,
so it may receive a strategy from `STRATEGIES` (`topology-defaults.ts:43-54`).
INFERRED: arbitrary but deterministic.
