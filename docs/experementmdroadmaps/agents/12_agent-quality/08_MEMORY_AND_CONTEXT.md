# 08_MEMORY_AND_CONTEXT — memory available to / saved by `agent-quality`

## What is written today (VERIFIED)

- **Agent Journal** (`agent-journal-service.ts`): auto-records on `COGNITIVE_STEP_ACTIVE`, `COGNITIVE_STEP_COMPLETED`, `debate:runtime:agent:error`. Stored in Dexie KV `agent_journal_v1` (`agent-journal-service.ts:36`). Entries: `agentId, agentName, taskType, taskDescription, outcome, durationMs, tokensUsed, tags, timestamp`.
  - Gap: `agentName` = node id (`agent-quality`), **not** "Noah Ferreira" (`agent-journal-service.ts:135,161`). So journal history is not human-readable per agent.
- **Stats KV** (`super_agents_agent_stats`) and **Groups KV** (`super_agents_agent_groups`) via `agent-service.ts:68-69`.
- **Health snapshot** KV (`agent_health_monitor_state`) via `agent-health-monitor.ts:32`.

## Generic memory stores (VERIFIED — `src/kernel/services/memory/*`)

15+ stores: `semantic-memory`, `episodic-memory`, `procedural-memory`, `working-memory`, `emotional-memory`, `social-memory`, `spatial-memory`, `memory-palace`, `memory-cache`, `memory-quality-gate`, `memory-search-utils`, `memory-worker-client`, `memory-prune-scheduler`, `service-backed-memory`, `sleep-engine`. These are **generic infrastructure**; **nothing** writes `agent-quality`'s QA findings (test plans, coverage gaps, verdicts) into any of them. So the agent has **no long-term QA memory** — each invocation starts from zero context beyond its node prompt.

## What could be read back (POTENTIAL, reuse existing)

- `service-backed-memory.ts` is the store-backed memory used by agents; a QA "test-plan" memory type could be a new category there **without** a new bus.
- `episodic-memory` could store "last QA review of artifact X" keyed by `agent-quality` + artifact hash.

## Continuity improvements (RECOMMENDED)

1. **Persist QA artifacts:** when `agent-quality` emits a test plan / coverage report / verdict, write it to `service-backed-memory` (or a dedicated `qa_findings` KV) keyed by `agentId + artifactRef`. Reuse `agent-journal-service` write path.
2. **Read-back on invocation:** RoomPanel / Director turn prep could inject the last QA finding for the same artifact as context (display/retrieval only).
3. **Fix journal `agentName`** to resolve via `resolveAgentIdentity` so history is human-readable (QW in 11).

## Avoid

- Do NOT build a 16th bespoke memory store just for this agent. Reuse `service-backed-memory` / journal KV.
