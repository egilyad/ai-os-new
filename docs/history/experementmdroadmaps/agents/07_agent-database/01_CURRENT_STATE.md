# 01_CURRENT_STATE — What `agent-database` ACTUALLY does now

> Honest read of the shared infrastructure. There is **no agent-specific code** for `agent-database`; it is one of 25 topology NODES that all share the same execution path.

## The actual execution path (VERIFIED)

1. The Mission Router routes an incoming request. If classified as a `data_flow` task, edge `e-router-database` (`topology-defaults.ts:470`) delivers it to `agent-database`.
2. The orchestrator executes the node (`agent-service.ts` → `orchestrator.execute`). The node's `config.prompt` (DB engineer) + `config.model` (`openrouter/meta-llama/llama-3.3-70b-instruct`, applied by `normalizeAgentIdentity`) are injected as the system prompt / model for the LLM call.
3. The LLM call runs through the standard LLM pipeline (provider adapter, governor, retry, streaming). There is **no DB-specific tool, sandbox, or schema context** — the "database expertise" is purely prompt-injected text.
4. The orchestrator emits `cognitive:step:active` then `cognitive:step:completed` (`orchestration-service.ts:355,414`). `agent-database` is just the `nodeId` on those events.

## What it is NOT (VERIFIED)

- It does **NOT** execute SQL. `sql_executor` is declared in node `tools` (`topology-defaults.ts:226`) but is absent from the `ToolService` registry (`tool-executor.ts:174-257`). No SQL sandbox/DB connection exists for it.
- It does **NOT** introspect schemas, run EXPLAIN/query plans, or measure replication lag. There is no data-source connector bound to this agent.
- It has **NO lens** (`lensIds:[]` after normalize, `topology-defaults.ts:106`). The 15 lenses never include a data lens.
- Its `specializations` (`SQL Tuning`, `Replication`, `Data Modeling`) are free-text strings carried in `config.specializations`; nothing in the runtime reads them to change behavior (VERIFIED: grep shows `specializations` consumed only by `agent-identity.ts` for display and by `phase21-invocation.ts` directory listing — neither alters execution).

## Lifecycle / state (VERIFIED)

- `AgentService` tracks `lifecycleStates` per node (`agent-service.ts:77,588`), toggles pause/resume (`toggleAgent` `:460`), auto-spawn clones under load (`evaluateAutoSpawn` `:614`), and persists stats to Dexie KV (`STATS_KEY`, `:68`).
- Stats are incremented only on `COGNITIVE_STEP_COMPLETED` / `STREAM_END` events (`agent-service.ts:184,219`). So `agent-database` accumulates `calls/tokens/latency/errors/cost` like every other node.

## Memory & continuity (VERIFIED)

- It shares the global memory mesh (15 memory stores under `src/kernel/services/memory/`). There is **no DB-specific memory partition** — `agent-journal-service.ts` records per-agent journal entries keyed by `agentId`, but that is a generic log, not domain memory.

## Bottom line (OPINION)

`agent-database` is a **prompt-pretending specialist**: it _sounds_ like a database engineer because of its system prompt and name, but it has zero database tooling, no lens, no domain memory, and no schema/query execution. Its value today is entirely dependent on the underlying LLM's general SQL knowledge, delivered through `meta-llama/llama-3.3-70b-instruct`.
