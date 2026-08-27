---
title: Memory — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 06 — MEMORY: journaling and memory stores

## Agent Journal (VERIFIED)

`agent-journal-service.ts` records per-agent activity. It subscribes to:

- `COGNITIVE_STEP_ACTIVE` (`agent-journal-service.ts:130`)
- `COGNITIVE_STEP_COMPLETED` (`agent-journal-service.ts:150`)

Each completed cognitive step for `agent-doc-simplifier` (i.e., a real LLM
execution of the node) can produce a `JournalEntry`
(`agent-journal-service.ts:7-19`: agentId, agentName, taskType, outcome,
tokensUsed, durationMs, tags…). Storage is KV `agent_journal_v1`
(`agent-journal-service.ts:36`) with `BucketStorageAdapter.AGENTS`
(`agent-journal-service.ts:50`).

## Memory engine (VERIFIED)

`memory-engine.ts:181` also listens to `COGNITIVE_STEP_COMPLETED` and ingests
steps into the memory store. The shared context mentions "~16 memory stores";
the doc-simplifier node contributes memories only when it actually executes
(topic/context dependent), keyed by `nodeId`.

## Other consumers of the same signal (VERIFIED)

`COGNITIVE_STEP_COMPLETED` is consumed by: `agent-health-monitor.ts:66`,
`trace-service.ts:200`, `policy-service.ts:275`, `metrics-service.ts:187`,
`advisor-service.ts:119`, `snapshot-service.ts:114`
(grep results). All observe doc-simplifier's executions uniformly.

## What is NOT wired (VERIFIED, negative)

No dedicated "documentation memory" or "simplification corpus" store is keyed to
this agent. It shares the generic memory/journal pipeline with all 25 agents.
OPINION: simplification outputs could be harvested from the journal, but no code
does so today.
