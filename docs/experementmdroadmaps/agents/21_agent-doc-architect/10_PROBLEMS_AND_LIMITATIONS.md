# 10_PROBLEMS_AND_LIMITATIONS — `agent-doc-architect`

> Concrete, source-backed problems. **VERIFIED** where a file:line is given; **INFERRED** where impact is reasoned.

## P1 — No grounding tools (VERIFIED config; INFERRED impact)

- `tools: []` at `topology-defaults.ts:404`. Contrast `agent-architect` (`CODER_TOOLS`, `topology-defaults.ts:190`), `agent-risk` (`ANALYTICS_TOOLS`, `topology-defaults.ts:164`).
- Its prompt commands "never invent features… traceable to specific source files" (`topology-defaults.ts:402`) but it **cannot read source**. The promise is unenforceable; output may be confidently wrong.
- Severity: HIGH. This is the single biggest gap between identity and capability.

## P2 — Specializations are decorative (VERIFIED)

- `specializations: ['Information Architecture','Taxonomy','Standards']` (`agent-profiles.ts:230`) are never read by any routing, persona, or lens logic. `persona-selector.ts` ignores them; `AgentResolverDirectory` surfaces them but nothing consumes them for behavior (`phase21-invocation.ts:54`).
- No documentation/taxonomy lens exists (`lens-engine/lens-library.ts` — 11 lenses, none doc-related), and `lensIds` defaults `[]` (`topology-defaults.ts:106`).

## P3 — No default participation (VERIFIED)

- No seeded debate, Director scenario, scheduler, or event subscription names `agent-doc-architect`. It only runs when a human explicitly selects it (RoomPanel) or a hardcoded list includes it. Latent, not active.

## P4 — Debate is invisible to observability (VERIFIED)

- Debate emits **no** cognitive events (shared context + `event-registry.ts` cognitive section). So doc-architect debate turns accrue **no** stats/journal/health/memory. A debate with Bianca leaves no trace in the cognitive stack.

## P5 — No coordination with doc siblings (VERIFIED)

- The 5 doc nodes are independent. `consistency-checker.ts:491-529` (`runDocumentationDebate`) only _textually_ names them in a report template — it does **not** invoke them. No pipeline/ordering exists.

## P6 — No documents persistence (VERIFIED absent)

- No `documents` store, no `document:*` events in `event-registry.ts`. doc-architect's output lives only in the conversation session + journal text. No versioning, no doc map, no taxonomy graph.

## P7 — OpenRouter dependency (VERIFIED + shared context)

- Pinned to `openrouter/meta-llama/llama-3.3-70b-instruct` (`agent-profiles.ts:229`). AGENTS.md records 402/key-balance handling for OpenRouter; a dead key silently drops this agent from routing (no fallback to another provider for this specific model).

## P8 — Router may never pick it (INFERRED)

- The Mission Router classifies tasks and routes by classification; nothing maps "documentation architecture / taxonomy / standards" to doc-architect specifically. It is reachable only via the explicit `e-router-doc-architect` edge if the router classifies to it — likely rare vs. generic agents.

## P9 — Prompt-audit grouping is cosmetic (VERIFIED)

- `prompt-audit-service.ts:46` groups it as "Documentation" by id prefix, but this only affects an audit dashboard; it does not change behavior, tools, or routing.

## Opinion

The agent is a **well-dressed ghost**: strong identity, correct model, good prompt — but no tools, no routing, no coordination, no persistence, and no debate observability. Eight of nine problems are "integration missing," not "agent broken."
