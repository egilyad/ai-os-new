# 08_MEMORY_AND_CONTEXT — `agent-doc-architect`

> Memory stores and contextual grounding. **VERIFIED** unless noted.

## Per-agent memory (VERIFIED)

- `agent-journal-service.ts` (`src/kernel/services/agent-journal-service.ts`) is the primary per-agent memory. It subscribes to `COGNITIVE_STEP_ACTIVE` (`agent-journal-service.ts:130`) and `COGNITIVE_STEP_COMPLETED` (`agent-journal-service.ts:150`), keyed by `nodeId`. doc-architect gets a journal automatically on any ConversationCore/Director execution.
- `memory-engine.ts:181` subscribes to `COGNITIVE_STEP_COMPLETED` and writes to a generic memory store. There are **~16 memory stores** in the system (per shared context); none are doc-architect-specific — all are keyed by `nodeId`/`traceId` generically.

## Context it can access at runtime (VERIFIED gap)

- **No tools** → `tools: []` (`topology-defaults.ts:404`). Therefore at execution time doc-architect:
  - cannot read source files (no `CODER_TOOLS`, unlike `agent-architect` at `topology-defaults.ts:190`),
  - cannot search the codebase (no `SEARCH_TOOLS`),
  - cannot query crystals / forum / workflow state (no domain tools),
  - cannot open existing documentation.
- INFERRED: its only "context" is (a) its system prompt (`topology-defaults.ts:402`), (b) the conversation/debate messages it receives, (c) any `objective.description`/`constraints` from a Director turn. There is **no retrieval-augmented context**.

## Cross-module context (VERIFIED)

- **Lenses:** `lensIds` defaults to `[]` (`topology-defaults.ts:106`); lens library has 11 lenses, **none** for documentation/taxonomy (`lens-engine/lens-library.ts`). So doc-architect gets no lens context.
- **Crystal / Forum / Workflow / Scheduler:** no subscription or trigger names `agent-doc-architect`. It does not consume `knowledge:crystal:formed`, `forum:*`, or scheduler events. (VERIFIED — grep for `agent-doc-architect` outside `topology-defaults.ts`/`agent-profiles.ts` returns only the agent-writer/15_agent-content doc references and `prompt-audit-service.ts:46`.)
- **Research/Knowledge:** no special participation; reachable only by explicit selection.

## What "memory" means for this agent today

A rolling journal + generic memory entries of its past turns (output text, duration, model). **No long-term structured knowledge** (e.g. a documentation map, taxonomy graph, or standards registry) is persisted for it. Its specializations ("Taxonomy", "Standards") are static strings, never turned into retrievable state.

## Opportunities (see 11)

- Give doc-architect `SEARCH_TOOLS`/`CODER_TOOLS` so its journal can be grounded in real code.
- Persist a "documentation map" entity (its Taxonomy specialization made concrete) keyed by `agent-doc-architect`.
- Subscribe it to `knowledge:crystal:formed` to auto-propose doc-structure updates.
