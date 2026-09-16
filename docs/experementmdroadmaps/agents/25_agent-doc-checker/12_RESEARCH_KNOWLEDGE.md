# 12_RESEARCH_KNOWLEDGE — Research / Knowledge Module Participation

**Status:** N/A (no special participation). doc-checker in Research/Knowledge modules.

## Research module

Per AGENTS.md, Research is a cognitive capability but there is **no evidence** doc-checker is preferentially selected for research tasks. Its `specializations` (`Consistency, Cross-Reference, Validation`, agent-profiles.ts:270) and router keyword routing would only route doc-consistency topics to it. No `research`-specific wiring references `agent-doc-checker`.

## Knowledge Generator (Module 5)

`knowledge-generator-service` (AGENTS.md) runs a deterministic orchestrator (hypothesis → evidence → peer review → crystallization). It uses `crystalVault` + peer-review roles (advocate/skeptic/synthesizer/metanavigator). **No reference to doc-checker or the doc cluster** as a reviewer. doc-checker is not a built-in participant of the generator.

## Lenses / Synthesis

Covered in 09_LENSES (doc-checker has no lenses) and AGENTS.md Module 4 (Synthesis uses `lens:meta-meta`, not doc-checker).

## Cognitive event stream

Covered in 07_COGNITIVE_EVENTS. doc-checker participates only as a generic node when invoked.

## Conclusion

doc-checker has **no dedicated role** in Research or Knowledge Generator. It can be _manually_ added as a participant (via Director scenario, Debate, or Invocation — see 05/04/06), but is not auto-selected by those modules.

## Confidence

- Absence of references: VERIFIED via Grep (no `agent-doc-checker` in knowledge-generator / research sources; only in agent-profiles.ts + topology-defaults.ts).
- "No dedicated role": INFERRED from absence + architecture.
