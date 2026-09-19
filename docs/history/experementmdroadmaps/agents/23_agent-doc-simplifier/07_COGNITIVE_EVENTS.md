---
title: Cognitive Event Stream — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 07 — COGNITIVE EVENT STREAM

## The 4 cognitive events (VERIFIED)

Defined in `event-registry.ts`:

- `COGNITIVE_TRACE_UPDATED` (`event-registry.ts:736`)
- `COGNITIVE_STEP_ACTIVE` (`event-registry.ts:755`)
- `COGNITIVE_STEP_COMPLETED` (`event-registry.ts:763`)
- `COGNITIVE_DECISION_MADE` (`event-registry.ts:776`)

## Who emits (VERIFIED)

- `COGNITIVE_STEP_ACTIVE` + `COGNITIVE_STEP_COMPLETED` are emitted by
  `cognitive-service.ts:200,229` and `orchestration-service.ts:355,414`.
- `COGNITIVE_TRACE_UPDATED` emitted by `cognitive-service.ts:338` and
  `trace-service.ts:344`.
- `COGNITIVE_DECISION_MADE` emitted **only** by `cognitive-service.ts:414`
  (grep: 2 matches total — definition + single emit).

## This agent's footprint (VERIFIED)

When `agent-doc-simplifier` executes (via Core debate/chat, `03`/`04`), the
orchestrator emits `COGNITIVE_STEP_ACTIVE` then `COGNITIVE_STEP_COMPLETED` with
`nodeId:'agent-doc-simplifier'`. `AgentService` consumes the latter for stats
(`02_AGENT_SERVICE.md`), `agent-journal-service` + `memory-engine` for memory
(`06_MEMORY.md`).

## COGNITIVE_DECISION_MADE is dead-at-consumer (VERIFIED)

grep for consumers of `COGNITIVE_DECISION_MADE` returns **0 listeners** (only the
emit site + the registry definition). So even if some future path emitted it for
this agent, nothing would react. OPINION: the event is currently vestigial.

## Debate emits NO cognitive events (VERIFIED)

A grep of `src/kernel/services/debate-runtime` for `COGNITIVE_` returns **0
matches**. Therefore if doc-simplifier is invoked _inside a debate_, its steps are
NOT surfaced as `cognitive:*` events — only `debate:*` + (via the Core bridge)
`conversation:*`. This is consistent with `AGENTS.md` ("Debate emits NO cognitive
events"). INFERRED: this is a deliberate separation so cognitive analytics exclude
debate noise.
