# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED problems

> Every item below is grounded in source. No fabrication.

1. **Specialization is inert.** `specializations:['Documentation','Tutorials','API Docs']` (`agent-profiles.ts:220`) is never read by any runtime path. `PersonaSelector` ignores it (`persona-selector.ts:3-241` has no `specializations` reference). **Evidence:** grep + file read. **Impact:** Clara is a generic LLM mouthpiece in debates.

2. **No documentation tooling / grounding.** Node tools = generic `SEARCH_TOOLS` (`topology-defaults.ts:390`). She cannot read source, existing docs, or crystals. **Impact:** any "document module X" output is ungrounded and may be inaccurate. This is exactly why separate `doc-architect`/`doc-auditor` exist with stricter prompts — but they share the same tooling gap.

3. **No writer-specific memory or output store.** Zero `agent-writer` references in memory-engine/crystal/forum/builder/scheduler. Her outputs are ephemeral messages. **Evidence:** grep. **Impact:** docs are not persisted, versioned, or reusable.

4. **No lens association.** Lens library (`lens-library.ts:12-284`) has 11 analytical lenses, none documentation-related; writer `lensIds` empty. **Impact:** she cannot be invoked "through a documentation lens" and is excluded from lens-driven analysis.

5. **Debate emits no cognitive events.** `AGENTS.md`: "Debate emits NO cognitive events." **Impact:** Clara's debate contributions are invisible to the cognitive stream / AgentJournal (except errors), so her documentation value in debates is untracked.

6. **`COGNITIVE_DECISION_MADE` is dead at consumer.** `AGENTS.md`. If the writer ever emits a documentation decision, nothing displays it. **Impact:** cannot surface doc-decisions without first fixing the consumer.

7. **Six overlapping documentation agents, no coordination.** `agent-writer` + 5 `doc-*` nodes (`agent-profiles.ts:212-271`) have near-identical topology wiring (`topology-defaults.ts:485-565`) but no team/group, no routing rule distinguishing them. **Impact:** redundant, confusing; the router may pick any of them arbitrarily. `[INFERRED]`

8. **Model is small (llama-3.1-8b-instant).** Pinned via profile (`agent-profiles.ts:219`). **Impact:** an 8B model is weak for long, accurate API documentation vs. the 70B models used by `doc-architect` etc. (`agent-profiles.ts:229` openrouter 70B). **Risk of low-quality docs.**

9. **No default scenario/flow uses her.** Nothing auto-routes documentation to Clara. She only acts when a human explicitly picks her (RoomPanel/Director). **Evidence:** no `agent-writer` in scenario/conversation defaults; grep.

10. **Avatar fallback inconsistency (minor).** `AgentAvatar.getAgentAvatar` (`AgentAvatar.tsx:47`) is a deterministic hash, while identity uses the curated emoji. Some components may show the hash glyph instead of `📝`. **Impact:** cosmetic inconsistency.
