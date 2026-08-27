# 08 — MEMORY & CONTEXT

> VERIFIED unless marked.

## Available memory (VERIFIED)

- **`agent-journal-service`** — per-agent `JournalEntry` keyed by `agentId` (`agent-journal-service.ts:7-19,36`), fed from `COGNITIVE_STEP_COMPLETED` (`:150`). `agent-po` accrues: `taskType`, `taskDescription`, `outcome`, `durationMs`, `tokensUsed`, `tags`, `timestamp`.
- **`memory-engine`** subscribes to `COGNITIVE_STEP_COMPLETED` (`memory-engine.ts:181`) — generic memory store; ~16 memory stores in the system (AGENTS.md).
- **`AgentStats`** KV (`agent-service.ts:68`) — calls/tokens/latency/errors/cost.
- **Dexie** `invocations` / `scenarios` when invoked (persisted aggregates).

## Saved / Read (VERIFIED)

- `agent-po`'s journal is **written** automatically (no opt-in). It is **read** by `AgentHistoryTab` / history UI (generic).
- There is **no PO-specific memory layer, no backlog memory, no vision memory**. The specializations `Backlog`/`Vision`/`Prioritization` do **not** create dedicated memory stores.

## Continuity improvements (OPINION)

1. **Backlog memory store** — a dedicated `memory-engine` namespace seeded by PO outputs (prioritized items) so future PO sessions inherit prior backlog context. Reuses `memory-engine` (`memory-engine.ts`), no new infra.
2. **Cross-session PO identity continuity** — persist `agent-po`'s last vision statement / open priorities in KV (mirror `agent-stats` KV pattern, `agent-service.ts:68`).
3. **Journal → structured backlog** — extend `JournalEntry` (or add a `backlogItems` tag/field) so PO turns that produce backlog items are queryable later (bridge to `05` C1).
4. **Surface the dropped-model bug in memory** — since `provider`/`model` are in `COGNITIVE_STEP_COMPLETED`, a PO memory view would reveal it ran on a router-assigned model, not the groq pin (`02` #4).

## Risk

All improvements are additive KV/Dexie reads/writes; no kernel contracts change. Low risk.
