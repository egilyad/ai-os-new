# 08_MEMORY_AND_CONTEXT — memory available to `agent-network`

> Honest: no agent-specific memory is seeded. Only generic stores + Agent Journal.

## What memory exists in the system (VERIFIED)

Memory subsystem (`src/kernel/services/memory/`): `emotional, episodic, procedural, semantic, social, spatial, working` + `sleep, prune, quality, federated, palace, cache, worker`. These are **generic**, keyed by `metadata.agentId` in queries where supported:

- `episodic-memory.ts:53` — `if (query.agentId) results = results.filter(e => e.metadata.agentId === query.agentId)`
- `social-memory.ts:33` — same pattern
- `service-backed-memory.ts:46` — same pattern

Other stores (emotional/semantic/procedural/working/spatial) were not individually verified for `agentId` filtering, but the pattern is consistent.

## What `agent-network` actually saves / reads (VERIFIED + INFERRED)

- **Saved:** NOTHING agent-specific is automatically written for `agent-network`. There is no seeder that records Nadia's identity, specializations, or past turns into a memory store. The only per-agent durable record is the **Agent Journal** (`agent-journal-service.ts`), keyed by `agentId`, populated from `COGNITIVE_STEP_ACTIVE/COMPLETED` + `debate:runtime:agent:error`.
- **Read:** She does not read any memory store during a turn. Her only context is the node system prompt + conversation history (ConversationCore) or the debate prompt (debate). No `episodic/semantic` lookup is performed for her.

## Long-term / episodic / semantic / agent-specific (INFERRED)

- **Long-term:** none. Each invocation/debate/conversation starts cold; she cannot recall "last week's topology recommendation."
- **Episodic:** available generically but unused for her.
- **Semantic:** available generically but unused for her.
- **Agent-specific:** only the journal (activity log, not knowledge).

## How to improve continuity (OPINION, reuse-only)

1. **Seed a semantic memory** for `agent-network` at boot: her specializations + the network-engineer prompt + a few canonical facts (TCP/IP layers, SDN controllers, latency metrics). Reuse `semantic-memory` write path keyed by `agentId:'agent-network'`. Low risk, high value — turns "cold" into "grounded."
2. **Auto-journal -> semantic:** when a Nadia turn produces a durable conclusion, promote the Agent Journal entry to `semantic-memory` (reuse `AgentJournalService` + a memory writer). Avoids a separate memory pipeline.
3. **Read-before-speak:** in `ChatExecutionEngine` (or a thin wrapper), inject a `semantic-memory.query({agentId:'agent-network', topic})` summary into the system message. Reuses existing resolveAgent seam (`conversation-execution-engine.ts:40-43`).
4. **Debate continuity:** same read-before-speak could apply in `debate-llm-prompt-context.ts` so she recalls prior stances.

## Risks / dependencies

- Must avoid polluting shared memory with agent-private data — scope writes by `agentId` and respect the existing `metadata.agentId` filter.
- Memory quality gate (`memory-quality-gate.ts`) should score seeded/recalled entries to prevent noise.
- Do NOT build a new "network memory" store — reuse the generic ones (see 15_DO_NOT_BUILD_YET).

## Bottom line

Memory for `agent-network` is **theoretically available but practically empty**. The cheapest win is seeding + read-back via existing generic stores, not a new subsystem.
