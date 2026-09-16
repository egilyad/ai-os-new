# 08_MEMORY_AND_CONTEXT — `agent-writer` Memory

## What memory exists for the writer (VERIFIED)

- **No writer-specific memory store.** grep finds zero `agent-writer` references in `memory-engine.ts` or any memory store. The ~16 memory stores (`AGENTS.md`) are generic infra, not per-agent.
- **Passive journaling:** `AgentJournalService` records every `COGNITIVE_STEP_COMPLETED` with `agentId:'agent-writer'` (`agent-journal-service.ts:150-171`) and every `debate:runtime:agent:error` (`:174`). This is the closest thing to "writer memory" — a log of what she produced.
- **Stats persistence:** `super_agents_agent_stats` KV (`agent-service.ts:68,103`) persists calls/tokens/latency/errors/cost per node, including the writer.
- **No semantic/episodic memory read-back.** The writer does **not** read her own past outputs, the docs she wrote, or crystals when generating new text. `[INFERRED]`

## What context she receives when generating

- **System prompt:** static `"You are a technical writer…"` (`topology-defaults.ts:388`).
- **Persona (debate):** topic-keyword injection (`persona-selector.ts`).
- **Tools:** only `SEARCH_TOOLS` (`topology-defaults.ts:390`). She cannot read the local codebase, existing docs, or the `crystals`/`forum` stores. `[VERIFIED]` This is the crux: she writes _from the prompt alone_, with no grounding.

## Continuity improvements (POTENTIAL, reuse existing infra)

1. **Doc-source tool.** Give the writer a tool (or a `CODE_SEARCH`/Dexie read) to read the actual module/source before documenting. Reuses the `tools` field already on the node (`topology-defaults.ts:390`). `[OPINION]` Highest-leverage fix.
2. **Read-back from Crystal Vault.** On "document this", pull related `crystals` (Knowledge module) as source-of-truth. Reuses `CrystalRepository` (`AGENTS.md` Module 2).
3. **Persist writer outputs to a `documents` store.** Today her output is ephemeral (a chat/debate message). Add a Dexie table `documents` (mirror of `crystals` v13 pattern) so docs survive and can be edited/versioned. `[INFERRED]` New table, but follows established DAL pattern.
4. **Journal → context.** Let the writer's next invocation load her last N journal entries as context (continuity). Reuses `AgentJournalService.record/list`.

## Risk note

Adding a `documents` table is a schema-version bump (Dexie). Follow the established additive-versioning convention (`AGENTS.md` P2.19). Reuse `schema-types.ts` + DAL getter + repository pattern exactly as `crystal-repository.ts` / `scenario-repository.ts`.
