# 03 — Cognitive Layers

## Concept Layer

The system implements a **5-layer cognitive stack** that transforms unstructured LLM text into structured, measurable reasoning artifacts. Each layer has a distinct responsibility — generation produces text, control structures the interaction, diversity prevents groupthink, measurement quantifies quality, and interpretation extracts meaning.

This layered architecture is the system's primary research contribution: it makes multi-agent reasoning **auditable, comparable, and improvable**.

## System Mapping Layer

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 5: Interpretation                                     │
│  DebateInterpreter.interpret(session)                        │
│  → summary, disagreement peak, trajectory changers, insights │
├──────────────────────────────────────────────────────────────┤
│  Layer 4: Measurement                                        │
│  computeGraphMetrics() / computeActivityMetrics()             │
│  / computeQualityMetrics()                                   │
│  → graph stats, per-agent stats, depth/originality/usefulness│
├──────────────────────────────────────────────────────────────┤
│  Layer 3: Diversity                                          │
│  DebateGovernor.updateDiversity()                             │
│  → DiversityScorer (speaker variety, edge balance)           │
│  Constraints: "facts_only", "emotional_only", etc.           │
├──────────────────────────────────────────────────────────────┤
│  Layer 2: Control (Governor)                                 │
│  DebateGovernor.ingestArgument() / shouldStop()               │
│  → Claim extraction, contradiction detection, convergence    │
│  → Stop decision: no novel claims, plateau, resolved          │
├──────────────────────────────────────────────────────────────┤
│  Layer 1: Generation                                         │
│  callLLM() → DebateArgument                                  │
│  buildOpeningPrompt() / buildArgumentPrompt()                │
│  → provider fallback (up to 3 retries, 3 tiers)             │
└──────────────────────────────────────────────────────────────┘
```

| Layer          | File(s)                                 | Key Function                                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| Generation     | `debate-runtime/debate-sync-manager.ts` | `callLLM()`, `buildOpeningPrompt()`, `buildArgumentPrompt()`                   |
| Control        | `debate-governor/`                      | `ingestArgument()`, `shouldStop()`, `detectContradictions()`                   |
| Diversity      | `debate-governor/diversity-scorer.ts`   | `update()`, speaker diversity, constraint enforcement                          |
| Measurement    | `debate-runtime/debate-sync-manager.ts` | `computeGraphMetrics()`, `computeActivityMetrics()`, `computeQualityMetrics()` |
| Interpretation | `debate-interpreter.ts`                 | `interpret()`, `buildDisagreementTimeline()`, `findTrajectoryChangers()`       |

## Behavior Layer

### Layer 1 — Generation

Builds LLM prompts with structural context (role, constraints, temperature tone, debate state, parent references). Calls LLM with up to 3 retries across 3 fallback tiers. Returns structured `DebateArgument` with confidence score.

### Layer 2 — Control (Governor)

After each argument, extracts claims, adds to claim graph, checks for contradictions with existing claims, computes convergence score. Determines whether debate should stop based on novelty, convergence, and contradiction resolution.

### Layer 3 — Diversity

Tracks which speakers have contributed, what positions they've taken, and whether constraints are being respected. Prevents any single speaker from dominating. For `constrained` strategy, checks compliance via heuristic patterns.

### Layer 4 — Measurement

Computed at debate stop:

- **Graph metrics**: tree structure stats (depth, branching, orphan rate)
- **Activity metrics**: per-agent participation (count, words, confidence, responses)
- **Quality metrics**: depth (lexical diversity, topic breadth), originality (self/cross repetition via Jaccard), usefulness (relevance, evidence, structure)

### Layer 5 — Interpretation

Pure computation (no LLM) over debate artifacts:

- **Summary**: one-line quantitative description
- **Disagreement peak**: round and intensity of maximum divergence
- **Trajectory changers**: arguments that shifted focus, deepened, contradicted, or shifted consensus
- **Constraint correlation**: for constrained strategy, how each constraint affected depth/confidence
- **Insights**: heuristic findings (convergence level, balance, participation equality)

The layers are **strictly ordered** — each depends on the output of the layer below. Generation feeds control, control feeds diversity, diversity feeds measurement, measurement feeds interpretation.
