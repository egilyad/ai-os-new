# 04_DEBATE_ROLE — `agent-database` in Debate

## CURRENT (VERIFIED)

- Debate participants are selected from topology nodes via `persona-selector.ts`. The selector scores 11 generic persona variants (`cautious_scientist`, `technologist`, `pragmatic_economist`, …) by **topic keyword match** and agent **role** (`pro`/`con`/`neutral`).
- There is **no** DB-specific persona (`persona-selector.ts:3-241` — grep confirms no `sql`/`schema`/`replication` variant).
- The agent's `specializations` (`SQL Tuning`, `Replication`, `Data Modeling`) are **not** consulted by the selector. Its DB identity is invisible to debate framing — it is just another neutral participant that may be assigned `technologist` or `cautious_scientist` if the topic contains "data"/"technology"/"science".
- Debate execution reuses `agentService.resolveAgent` for persona + pinned model (per AGENTS.md: `debate-agent-executor.ts`, `debate-meta-agent-controller.ts`). The model pin (`llama-3.3-70b-instruct`) is applied; the prompt is the generic node prompt.
- **Net:** In debate, `agent-database` performs as a generic analyst, not a database specialist.

## POTENTIAL (justified — INFERRED/OPINION)

- **DB-framed persona variant.** A `data_engineer` persona (trigger keywords: `sql`, `schema`, `index`, `query`, `replication`, `normalization`, `migration`, `transaction`, `ACID`, `sharding`) would let the agent inject DB-specific reasoning ("demand the schema/EXPLAIN plan", "warn on N+1 / missing indexes") — directly leveraging its curated specializations.
- **Role-aware assignment.** When a debate topic is about data architecture, the agent should be auto-assigned `pro`/`con` with the data persona rather than a random generic one.
- **Evidence-grounded debate.** If a real `sql_executor` existed (see `02_CAPABILITIES`), the agent could actually run candidate queries in debate and cite execution plans — turning opinion into evidence.

## RECOMMENDED (OPINION)

Add a `data_engineer` persona variant to `persona-selector.ts` and make `selectForTopic` consult `resolved.specializations` (available via `agentService.resolveAgent`) so DB topics route the agent to DB-framed reasoning. Low risk: purely additive to the variant list; no change to selection machinery beyond an extra scored variant.

## Scenarios (INFERRED)

1. **"Should we shard the orders table?"** — agent-database (data persona) argues `pro` for sharding with concrete partition-key reasoning; architect counters operational cost.
2. **"Is our schema in 3NF adequate for analytics?"** — agent-database vs data-scientist on OLTP vs star-schema; agent cites normalization trade-offs.
3. **"Postgres vs Cassandra for the event log?"** — agent-database frames ACID vs BASE, replication lag, and write throughput, grounding the dispute in DB fundamentals.
