# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED problems

1. **No real DB tooling (VERIFIED).** `sql_executor` and `data_analysis` are declared on the node (`topology-defaults.ts:226`) but absent from `ToolService` (`tool-executor.ts:174-257`). The agent cannot execute SQL, introspect schemas, or measure replication. Its "Database Engineer" capability is **prompt-only**.
2. **Decorative `model:'auto'` (VERIFIED).** The node template sets `model:'auto'` (`topology-defaults.ts:227`) which is silently overwritten by `normalizeAgentIdentity` (`:105`). The literal is dead and misleading to anyone reading the template.
3. **Specializations are inert (VERIFIED).** `SQL Tuning / Replication / Data Modeling` (`agent-profiles.ts:90`) are read only for display (`agent-identity.ts:135`) and the invocation directory (`phase21-invocation.ts:54`); nothing routes behavior by them.
4. **No data lens (VERIFIED).** `lensIds:[]` (`topology-defaults.ts:106`); the 15-lens library has no data/SQL lens. The agent gets no perspective transform for DB tasks.
5. **Debate ignores DB identity (VERIFIED).** `persona-selector.ts` has no DB persona; the agent debates as a generic analyst. Its curated expertise is wasted in structured disputes.
6. **No domain memory (VERIFIED).** All 15 memory stores are generic; DB insights are not tagged/retrievable by specialization. Continuity is weak for repeated schema/query work.
7. **Dead cognitive event (VERIFIED per AGENTS.md).** `cognitive:decision:made` (`event-registry.ts:776`) is emitted but unconsumed — no decision trail for the agent.
8. **No schema/query execution context in Invocation (VERIFIED).** A human invoking Priya to "tune this query" gets text only; the `Manual Room Chat` policy (`phase21-invocation.ts:125`) cannot supply a DB sandbox.
9. **UI implies capabilities it lacks (VERIFIED/INFERRED).** The `tools` field suggests SQL execution that does not exist; users may expect runnable queries.
10. **Generic routing only (VERIFIED).** The Router reaches `agent-database` via a single `data_flow` edge (`topology-defaults.ts:470`); there is no specialization-aware routing that would prefer Priya for DB-heavy subtasks over, say, `agent-architect`.
