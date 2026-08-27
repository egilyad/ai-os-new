# 06 — Interpretation Engine

## Concept Layer

The **DebateInterpreter** is the system's post-hoc analysis layer — it converts raw debate data into human-readable findings without making any LLM calls. It is deliberately **pure computation**: no interpretation-hallucination, no "the agent seems to think" — only structural patterns extracted from the argument graph and participation data.

## System Mapping Layer

**Location**: `src/kernel/services/debate-interpreter.ts`

**Class**: `DebateInterpreter` — no dependencies, instantiated as `private interpreter` inside `DebateService`

**Entry point**: `interpret(session: DebateSession): DebateInterpretation`

### Output Type

```
DebateInterpretation {
  summary: string;                                // One-line quantitative summary
  disagreementPeak: DisagreementPoint | null;      // Max intensity round (or null if <0.3)
  disagreementTimeline: Array<{round, intensity}>;  // Per-round intensity
  trajectoryChangers: TrajectoryChanger[];          // Key turning points
  constraintCorrelation?: ConstraintCorrelation;    // Per-constraint stats (constrained only)
  insights: string[];                              // Heuristic findings
}
```

### Sub-computations

| Computation | Method | Logic |
|------------|--------|-------|
| Summary | `generateSummary()` | "N agents debated X over R rounds (M args). Pro: N, Con: M. Convergence: X%." |
| Disagreement timeline | `buildDisagreementTimeline()` | Per-round: `intensity = 1 − 2 * |0.5 − pros/total|` |
| Peak disagreement | `findDisagreementPeak()` | Max intensity round, null if <0.3 threshold |
| Trajectory changers | `findTrajectoryChangers()` | 3 strategies: intensity shifts ≥0.4, top-3 most-linked arguments (tree mode), minority-side arguments |
| Constraint correlation | `analyzeConstraintCorrelation()` | Per-constraint: avg depth, confidence, challenge rate, compliance (speculation penalty) |
| Insights | `generateInsights()` | Heuristic: convergence level, participation balance, pro/con balance, graph structure notes |

## Behavior Layer

- Called once at debate stop: `this.interpretation = this.interpreter.interpret(session)`
- All metrics used (graph, activity, quality) are computed **before** interpretation — interpretation reads them
- Disagreement peaks are highlighted in the UI with a red glow + Zap icon
- Trajectory changers are deduplicated by argumentId (a single argument can have multiple impacts)
- Constraint correlation is only computed for `constrained` strategy
- If all rounds have intensity <0.3, `disagreementPeak` is null (no significant disagreement detected)
- Insights are heuristic strings like "High convergence suggests near-consensus" or "Well-balanced participation"
