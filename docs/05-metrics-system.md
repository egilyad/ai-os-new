# 05 — Metrics System

## Concept Layer

The metrics system transforms debate artifacts (arguments, claims, participant activity) into quantitative scores. All metrics are computed **heuristically** — no LLM calls — making them fast, deterministic, and reproducible. Three metric families exist: **graph metrics** (structure), **activity metrics** (participation), and **quality metrics** (depth, originality, usefulness).

## System Mapping Layer

### Graph Metrics — `DebateGraphMetrics`

Computed by `computeGraphMetrics()` in DebateEngine. Only meaningful for `argument_tree` strategy.

| Field               | Calculation                         | What It Measures            |
| ------------------- | ----------------------------------- | --------------------------- |
| `totalNodes`        | Count of arguments                  | Debate size                 |
| `maxDepth`          | Longest parent→child chain          | Reasoning depth             |
| `avgDepth`          | Mean depth across all nodes         | Average chain length        |
| `orphanRate`        | Nodes without valid parent / total  | Tree fragmentation          |
| `branchingFactor`   | Average children per parent         | Argument diversification    |
| `challengeDensity`  | Cross-position parent links / total | Counter-argument engagement |
| `refinementDensity` | Same-position parent links / total  | Elaboration vs. challenge   |

### Activity Metrics — `ActivityMetrics`

Computed by `computeActivityMetrics()` in DebateEngine. Independent of strategy.

| Component          | Fields                                                                        | What It Measures                        |
| ------------------ | ----------------------------------------------------------------------------- | --------------------------------------- |
| `perAgent[]`       | `argumentCount`, `wordCount`, `avgConfidence`, `avgDepth`, `childrenReceived` | Per-agent contribution                  |
| `mostDiscussed[]`  | Top-5 arguments by `childCount`                                               | Which arguments received most responses |
| `roundIntensity[]` | Arguments per round index                                                     | Debate pacing                           |

### Quality Metrics — `QualityMetrics`

Computed by `computeQualityMetrics()` in DebateEngine. Three composites:

**DepthMetric** — composite of:

- `uniqueArguments` — distinct bigram-signature arguments
- `lexicalDiversity` — unique words / total words
- `uniqueBigrams` — distinct character bigrams
- `topicBreadth` — rare terms (freq ≤3) / unique words
- `depthScore` = 0.25 * uniqueRatio + 0.25 * lexical + 0.25 * topicBreadth + 0.25 * bigrams/50

**OriginalityMetric** — composite of:

- `selfRepetition` — avg Jaccard similarity between same-agent consecutive arguments
- `crossRepetition` — avg Jaccard similarity between different agents (last 3 each)
- `noveltyScore` = 1 − (0.4 * selfRep + 0.6 * crossRep)

**UsefulnessMetric** — composite of:

- `relevanceScore` — topic word overlap in arguments
- `evidenceScore` — fraction of arguments with numbers/citations/evidence patterns
- `structureScore` — 0.4 * hasParentLinks + 0.3 * balance + 0.3
- `usefulnessScore` = 0.4 * relevance + 0.3 * evidence + 0.3 * structure

## Behavior Layer

- Graph metrics are auto-labeled: e.g., `branchingFactor > 2` → "High branching", `orphanRate > 0.3` → "High orphan rate"
- Activity metrics highlight the top-3 most active agents with a visual separator
- Quality metrics have color thresholds: depth > 0.6 = good, originality > 0.5 = good, usefulness > 0.5 = good
- All metrics are computed at debate stop (in `stopDebate()`) and stored on the session object
- Metrics are displayed in the DebatePanel analytics sidebar and are reactive (read from `session.graphMetrics` / `session.activityMetrics` / `session.qualityMetrics`)
- Convergence score is computed separately during the debate (not at stop) via smoothed Jaccard overlap of claims
