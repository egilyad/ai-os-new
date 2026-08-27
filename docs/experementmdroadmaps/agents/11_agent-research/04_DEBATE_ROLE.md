# 04 — DEBATE ROLE

## CURRENT state

- agent-research is a **generic debate participant**. It is selected by a human when configuring a debate; there is no auto-inclusion. Once a participant, `debate-agent-executor.ts:38-80` runs it with its node config (provider `openrouter`, model `openrouter/meta-llama/llama-3.3-70b-instruct`, research system prompt, `SEARCH_TOOLS`).
- **Persona:** topic-driven. On research-flavored topics the `PersonaSelector` most likely injects `cautious_scientist` (`persona-selector.ts:4-25`, keywords `research/study/evidence/data/peer-reviewed/hypothesis/empirical/methodology`). For non-research topics it may receive `technologist`, `philosopher`, or a deterministic fallback (`persona-selector.ts:284-289`). INFERRED from keyword overlap.
- **Tactical role:** `debate-meta-agent-controller.ts:21-50` may assign pro/con/neutral per-round based on argument-graph centrality — generic, not agent-specific.
- **No debate-specific memory** of its own; only generic `AgentJournalService` (`agent-journal-service.ts:174` logs debate errors).

## POTENTIAL (why this agent is especially justified in debate)

The three specializations — **Literature Review, Synthesis, Citations** — map directly onto debate needs that the current runtime does NOT satisfy:

1. **Evidence analyst:** A debate turn that must cite sources / evaluate evidence quality is exactly what `cautious_scientist` + the research prompt imply. Today nothing enforces citation or source-quality.
2. **Synthesizer:** "Synthesis" specialization is the natural bridge to `CONSENSUS`/`DEBATE_CONSENSUS` events (`event-registry.ts:793-809`) — agent-research could be the designated _synthesis_ voice rather than a generic participant.
3. **Citation/rigor gate:** It could be the agent that, post-debate, produces a cited briefing from the argument graph.

## RECOMMENDED debate posture

Make agent-research the **default `neutral`/synthesis participant** for research-, policy-, and evidence-heavy debates, and bind `lens:critical` + `lens:meta-uncertainty` to it so its turns are automatically lens-augmented (lenses are otherwise unused by this agent — `topology-defaults.ts:106`).

## 3 scenarios

1. **Evidence-quality adjudication** — Debate on "Does X therapy work?"; agent-research is forced `neutral` + `cautious_scientist`, tasked to judge claims against cited sources. _(Today: possible only if human manually selects it; no citation enforcement.)_
2. **Post-debate synthesis briefing** — After a 10-agent debate, agent-research consumes `DEBATE_CONSENSUS` + argument graph and emits a cited synthesis (reusing `Synthesis` specialization + Crystal Vault export). _(Today: NOT implemented; Synthesis engine exists but is separate.)_
3. **Literature-review opener** — Agent opens the debate with a structured literature map (claimed findings, conflicts, gaps). _(Today: only the raw prompt encourages it; no structured output schema.)_
