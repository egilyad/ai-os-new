# 08_MEMORY_AND_CONTEXT — Memory available to `agent-designer`

> VERIFIED: memory is provided by `AgentJournalService` (`agent-journal-service.ts:96`) and the
> generic KV stats in `AgentService`. There is **no design-specific memory store**.

## What is saved (VERIFIED)

- **Journal** (`agent_journal_v1` KV): one `JournalEntry` per `COGNITIVE_STEP_ACTIVE`/`
COGNITIVE_STEP_COMPLETED`/`debate:runtime:agent:error` (`agent-journal-service.ts:130-190`).
  Keyed by `agentId = nodeId` (i.e. `agent-designer`). Fields: taskType, taskDescription (output
  sliced to 200 chars), outcome, durationMs, tokensUsed (always 0 — never populated), tags (always
  `[]`).
- **Stats KV** (`super_agents_agent_stats`): calls/tokens/latency/errors/cost per nodeId
  (`agent-service.ts:68,158`).

## What is read back (VERIFIED)

- `listByAgent(agentId)` (`agent-journal-service.ts:253`), `getAgentStats` (`:299`), `search`,
  `getByDateRange`. Surfaced in `AgentHistoryTab` / `AgentObservabilityTab`.
- **Designer-specific reads: NONE.** No code filters memory by design tags or links to crystals.

## Gaps (VERIFIED/INFERRED)

1. **`tokensUsed` is always 0** in journal entries (`:166`, `:182` pass `0`). Designer cost is only
   in stats KV, not the journal — design effort is invisible in the history view.
2. **`tags` always empty** (`:141`, `:167`, `:185`) — no "accessibility"/"ux" tagging, so design
   memory is unsearchable by theme.
3. **`agentName` = nodeId** (`:135`, `:160`) — history shows `agent-designer`, not "Kai Mendez".
4. **No cross-session continuity**: each scenario/debate is independent; designer never "remembers"
   a prior design critique.
5. **No link to Crystal Vault / Knowledge** — design insights are not crystallized.

## Continuity improvements (OPINION, reuse existing)

- **Tag design entries**: when the step source is `agent-designer`, auto-tag `['ux','design']`
  (small change in `AgentJournalService.subscribe`). Enables `listByTag('ux')`.
- **Carry `agentName` from identity** instead of `nodeId` (fix `:135,160`).
- **Crystallize design critiques**: bridge designer outputs → `crystalVault.propose` (reuse Module 2
  `crystal-vault-service`). Design patterns become reusable crystals.
- **Design memory store** is NOT recommended as a new subsystem — reuse journal + crystals.
