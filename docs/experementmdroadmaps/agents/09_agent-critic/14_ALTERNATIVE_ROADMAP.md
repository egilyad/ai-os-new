# 14_ALTERNATIVE_ROADMAP — Philosophy B: "Critic-as-a-Service" (separate micro-capability)

> Second philosophy contrasting with Roadmap A. Trade-offs explicit. NOT recommended as primary, but a valid divergence if the team prefers a dedicated critique subsystem over pure wiring.

## Core difference

- **A (wire-first):** Make the _existing_ `agent-critic` node a real critic by reusing lens/invocation/director/cognitive events. Zero new services.
- **B (service-first):** Build a dedicated **`CriticService`** that owns critique logic (structured fallacy detection, scoring, verification), and have `agent-critic` (and optionally others) _call into_ it. The agent becomes a thin persona over a real engine.

## Phases (B)

### Phase 0 — CriticService skeleton

- New `critic-service.ts` implementing `ICriticService` (detectFallacy, scoreArgument, verifyClaim).
- Reuse: `agent-journal-service` schema for output; `CognitiveDecisionSchema`.
- UI: none yet. Deps: none. Effort: M. Risk: Med. Result: standalone verifier exists.

### Phase 1 — Structured detection

- Rule/classifier layer over LLM output (formal-fallacy patterns, claim–evidence consistency). Reuse `CritiqueResult` (proposed in A/M2). Effort: L. Risk: High (NLP accuracy). Result: machine-checkable verdicts.

### Phase 2 — Agent integration

- `agent-critic`'s executor calls `CriticService` post-LLM; the agent surfaces verified critiques. Deps: P0–P1. Effort: M. Risk: Med. Result: critic produces verified (not just prompted) output.

### Phase 3 — Cross-agent critique API

- Expose `criticService.critique(text, context)` to debate/conversation/forum directly (bypass agent), so any module can request a critique without spawning the agent. Effort: L. Risk: Med. Result: critique as a utility.

### Phase 4 — Critique Knowledge Graph

- Persist critiques as Junction nodes (`junction-engine-service`) + Crystal links. Effort: XL. Risk: High. Result: organizational rejection memory.

## Trade-offs vs A

| Dimension                             | A (wire-first)              | B (service-first)              |
| ------------------------------------- | --------------------------- | ------------------------------ |
| New code                              | Minimal (wiring + 1 schema) | New service + verifier + API   |
| Time to value                         | Days                        | Weeks–months                   |
| Robustness of "fallacy detection"     | Still prompt-driven         | Verified/classified            |
| Risk                                  | Low                         | High (NLP, loops)              |
| Reuse of existing infra               | Maximal                     | Partial (new svc)              |
| Fits "no 25 mini-frameworks" guidance | ✅ Yes                      | ⚠️ Adds a framework            |
| Best when                             | Want fast, safe uplift      | Need provably-correct critique |

## Recommendation

Adopt **A as primary** (delivers 80% of value at 10% risk). Keep **B's Phase 0–1 (CriticVerifier, B2 in `11_OPPORTUNITIES`)** as a later, optional enhancement layered _on top of_ A's wiring — i.e., A first, B as a verifier bolt-on, not a replacement architecture.
